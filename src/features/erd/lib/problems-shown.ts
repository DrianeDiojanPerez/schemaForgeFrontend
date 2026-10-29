import type { Diagnostic } from "@/features/schema/types/schema";

import type { ProblemsShown } from "./canvas-preferences";

function wanted(item: Pick<Diagnostic, "severity">, shown: ProblemsShown): boolean {
	return shown === "all" || (shown === "errors" && item.severity === "ERROR");
}

/** The marks the person has asked for, grouped by the table or line they blame. An element with nothing left is dropped. */
export function keepShownByElement<T extends Pick<Diagnostic, "severity">>(
	grouped: Map<string, T[]>,
	shown: ProblemsShown,
): Map<string, T[]> {
	if (shown === "all") return grouped;

	const kept = new Map<string, T[]>();

	for (const [id, items] of grouped) {
		const left = items.filter((item) => wanted(item, shown));
		if (left.length > 0) kept.set(id, left);
	}

	return kept;
}
