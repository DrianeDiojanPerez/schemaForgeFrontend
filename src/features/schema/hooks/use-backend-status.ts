import { useSyncExternalStore } from "react"

import { notify } from "@/lib/toast"
import { checkBackend } from "@/server/rpc/schema"

/**
 * `unauthorised` is the case worth keeping apart from the other two: the
 * backend is up and answering, and every save will still fail.
 */
export type BackendState = "checking" | "online" | "unauthorised" | "offline"

export type BackendStatus = {
  state: BackendState
  version: string
  /** What the backend reported, or why the call never got there. */
  detail: string
}

const CHECKING: BackendStatus = { state: "checking", version: "", detail: "" }

// The settings dialog and the startup announcement read the same result, and
// neither of them owns it, so it sits beside them rather than in either.
let status: BackendStatus = CHECKING

const listeners = new Set<() => void>()

function publish(next: BackendStatus) {
  status = next
  listeners.forEach((listener) => listener())
}

async function run(): Promise<BackendStatus> {
  publish(CHECKING)

  try {
    const result = await checkBackend()

    publish(
      result.signedIn
        ? { state: "online", version: result.version, detail: result.status }
        : {
            state: "unauthorised",
            version: result.version,
            detail: result.reason ?? "The backend refused the sign-in",
          }
    )
  } catch (error) {
    publish({
      state: "offline",
      version: "",
      detail: error instanceof Error ? error.message : "No answer",
    })
  }

  return status
}

let inFlight: Promise<BackendStatus> | undefined

/**
 * Concurrent callers share one probe, so opening the settings while the
 * startup check is still running does not start a second.
 */
export function probeBackend(): Promise<BackendStatus> {
  inFlight ??= run().finally(() => {
    inFlight = undefined
  })

  return inFlight
}

let reported = false

/**
 * A working backend is what the app is supposed to have, so it passes without
 * comment and only trouble interrupts. The settings tab is where the healthy
 * case can be read. Only the first probe of the session speaks; later ones are
 * asked for from the settings, which show the answer themselves.
 */
export async function reportBackendTrouble(): Promise<void> {
  const result = await probeBackend()

  if (reported || result.state === "online") return
  reported = true

  // Up and answering, and every save will still fail. That is a warning rather
  // than an error: nothing is broken, the credentials are wrong.
  if (result.state === "unauthorised") {
    notify.warning({
      title: "Backend refused sign-in",
      description: result.detail,
    })
    return
  }

  notify.error({ title: "Backend unreachable", description: result.detail })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useBackendStatus(): BackendStatus {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => CHECKING
  )
}
