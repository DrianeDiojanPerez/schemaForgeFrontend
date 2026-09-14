import { createContext, use } from "react"

/**
 * Backend diagnostics keyed by the node they blame.
 *
 * A context rather than node data: writing them onto the nodes would rewrite
 * every node object on each validation, and React Flow re-renders a node when
 * its data changes identity.
 */
const ProblemsContext = createContext<Map<string, string[]>>(new Map())

export const ProblemsProvider = ProblemsContext.Provider

export function useNodeProblems(nodeId: string): string[] {
  return use(ProblemsContext).get(nodeId) ?? []
}
