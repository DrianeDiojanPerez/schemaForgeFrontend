import { createContext, use } from "react";

import type { Diagnostic } from "@/features/schema/types/schema";

/**
 * Backend diagnostics keyed by the table or relationship they blame.
 *
 * A context rather than node data: writing them onto the nodes would rewrite
 * every node object on each validation, and React Flow re-renders a node when
 * its data changes identity.
 */
const ProblemsContext = createContext<Map<string, Diagnostic[]>>(new Map());

export const ProblemsProvider = ProblemsContext.Provider;

export function useElementProblems(elementId: string): Diagnostic[] {
	return use(ProblemsContext).get(elementId) ?? [];
}
