import { useSyncExternalStore } from "react"
import { sileo } from "sileo"
import type { SileoOptions } from "sileo"

/**
 * Sileo and React Flow happen to name the six screen positions identically,
 * so one list drives the toaster, the mini-map and the control bar.
 */
export const SCREEN_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const

export type ScreenPosition = (typeof SCREEN_POSITIONS)[number]

const DEFAULT_POSITION: ScreenPosition = "top-center"

// The toaster is mounted at the root and the control that moves it lives on
// the canvas, so the choice cannot travel down as a prop.
let position: ScreenPosition = DEFAULT_POSITION

const listeners = new Set<() => void>()

export function setToastPosition(next: ScreenPosition) {
  position = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToastPosition(): ScreenPosition {
  return useSyncExternalStore(
    subscribe,
    () => position,
    () => DEFAULT_POSITION
  )
}

/**
 * Raise toasts through here rather than through sileo.
 *
 * Sileo lets a toast that is still on screen decide where the next one goes,
 * which reads as the position setting having been ignored. Naming the position
 * on every call is what stops that.
 *
 * `waiting` never expires on its own. It is meant to be replaced by the toast
 * that reports how the work ended.
 */
export const notify = {
  waiting: (options: SileoOptions) =>
    sileo.show({ ...options, type: "loading", duration: null, position }),
  success: (options: SileoOptions) => sileo.success({ ...options, position }),
  warning: (options: SileoOptions) => sileo.warning({ ...options, position }),
  info: (options: SileoOptions) => sileo.info({ ...options, position }),
  error: (options: SileoOptions) => sileo.error({ ...options, position }),
}
