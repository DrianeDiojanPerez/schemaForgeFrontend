import { createContext, use } from "react"

import type { TableNodeData } from "../types/erd"

export type GraphActions = {
  addColumn: (nodeId: string) => void
  copyTable: (data: TableNodeData) => void
  removeTable: (nodeId: string) => void
  removeColumn: (nodeId: string, columnId: string) => void
  renameSchema: (name: string) => void
}

/**
 * React Flow builds nodes from a type map, so a node cannot be handed props.
 * The editing actions reach it through here instead of being rewritten against
 * `setNodes` inside the node itself.
 */
const GraphActionsContext = createContext<GraphActions>({
  addColumn: () => {},
  copyTable: () => {},
  removeTable: () => {},
  removeColumn: () => {},
  renameSchema: () => {},
})

export const GraphActionsProvider = GraphActionsContext.Provider

export function useGraphActions(): GraphActions {
  return use(GraphActionsContext)
}
