import { createContext, use } from "react"

import { DEFAULT_EDGE_DASH, DEFAULT_EDGE_LINE } from "../lib/edge-lines"
import type { EdgeDash, EdgeLine } from "../lib/edge-lines"

export type EdgeStyle = { line: EdgeLine; dash: EdgeDash; labels: boolean }

/**
 * Same reasoning as the connector arrows: the setting belongs to the canvas,
 * and writing it onto every edge would rewrite each one whenever it changed.
 */
const EdgeLineContext = createContext<EdgeStyle>({
  line: DEFAULT_EDGE_LINE,
  dash: DEFAULT_EDGE_DASH,
  labels: true,
})

export const EdgeLineProvider = EdgeLineContext.Provider

export function useEdgeStyle(): EdgeStyle {
  return use(EdgeLineContext)
}
