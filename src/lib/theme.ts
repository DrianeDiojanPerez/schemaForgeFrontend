import { useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

// Runs before the first paint so the page never flashes the wrong theme.
export const themeScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}})()`

const listeners = new Set<() => void>()

const readTheme = (): Theme =>
  document.documentElement.classList.contains("dark") ? "dark" : "light"

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Private browsing can refuse storage. The theme still applies.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    readTheme,
    () => "light" as const // The server has no class list to read.
  )
}
