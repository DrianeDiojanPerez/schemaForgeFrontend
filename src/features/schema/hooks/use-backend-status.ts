import { useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { notify } from "@/lib/toast"

import { CHECKING, backendQueries } from "../api/queries"
import type { BackendStatus } from "../api/queries"

export type { BackendState, BackendStatus } from "../api/queries"

let announced = false

/**
 * Watches the connection for the canvas. A working backend is what the app
 * is supposed to have, so it passes without comment and only trouble
 * interrupts: the first bad answer of the session is reported once, the
 * retries after it are silent, and the answer that ends them says so while
 * the caller reloads.
 */
export function useBackendWatch(onReconnect: () => Promise<void> | void) {
  const { data } = useQuery(backendQueries.status())
  const before = useRef(data?.state)

  useEffect(() => {
    if (!data) return

    const was = before.current
    before.current = data.state

    if (data.state === "checking" || data.state === was) return

    if (data.state !== "online") {
      if (announced) return
      announced = true

      // Up and answering, and every save will still fail. That is a warning
      // rather than an error: nothing is broken, the credentials are wrong.
      if (data.state === "unauthorised") {
        notify.warning({
          title: "Backend refused sign-in",
          description: data.detail,
        })
        return
      }

      notify.error({ title: "Backend unreachable", description: data.detail })
      return
    }

    // Online from nothing is the ordinary start, so nothing is said. Online
    // after a bad answer is the wait ending.
    if (was === undefined) return

    notify.waiting({ title: "Reconnecting" })

    void Promise.resolve(onReconnect()).then(() =>
      notify.success({
        title: "Connected",
        description: data.version ? `Backend v${data.version}` : undefined,
      })
    )
  }, [data, onReconnect])
}

export function useBackendStatus(): {
  status: BackendStatus
  check: () => void
} {
  const queryClient = useQueryClient()
  const query = useQuery(backendQueries.status())

  return {
    status: query.isFetching ? CHECKING : (query.data ?? CHECKING),
    check: () => void queryClient.refetchQueries(backendQueries.status()),
  }
}
