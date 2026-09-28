import { createContext, use } from "react";

import type { Diagnostic } from "@/features/schema/types/schema";

/**
 * Backend diagnostics keyed by the node they blame.
 *
 * A context rather than node data: writing them onto the nodes would rewrite
 * every node object on each validation, and React Flow re-renders a node when
 * its data changes identity.
 */
const ProblemsContext = createContext<Map<string, Diagnostic[]>>(new Map());

export const ProblemsProvider = ProblemsContext.Provider;

export function useNodeProblems(nodeId: string): Diagnostic[] {
	return use(ProblemsContext).get(nodeId) ?? [];
}
