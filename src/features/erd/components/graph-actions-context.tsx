import { createContext, use } from "react"

export type GraphActions = {
  addColumn: (nodeId: string) => void
  removeTable: (nodeId: string) => void
  removeColumn: (nodeId: string, columnId: string) => void
}

/**
 * React Flow builds nodes from a type map, so a node cannot be handed props.
 * The editing actions reach it through here instead of being rewritten against
 * `setNodes` inside the node itself.
 */
const GraphActionsContext = createContext<GraphActions>({
  addColumn: () => {},
  removeTable: () => {},
  removeColumn: () => {},
})

export const GraphActionsProvider = GraphActionsContext.Provider

export function useGraphActions(): GraphActions {
  return use(GraphActionsContext)
}
