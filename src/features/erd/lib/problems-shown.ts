import type { Diagnostic } from "@/features/schema/types/schema";

import type { ProblemsShown } from "./canvas-preferences";

function wanted(item: Pick<Diagnostic, "severity">, shown: ProblemsShown): boolean {
	return shown === "all" || (shown === "errors" && item.severity === "ERROR");
}

/** The findings the person has asked to see, in the order they came. */
export function keepShown<T extends Pick<Diagnostic, "severity">>(
	items: T[],
	shown: ProblemsShown,
): T[] {
	return shown === "all" ? items : items.filter((item) => wanted(item, shown));
}

/** The same, for findings grouped by the table or line they blame. An element with nothing left is dropped. */
export function keepShownByElement<T extends Pick<Diagnostic, "severity">>(
	grouped: Map<string, T[]>,
	shown: ProblemsShown,
): Map<string, T[]> {
	if (shown === "all") return grouped;

	const kept = new Map<string, T[]>();

	for (const [id, items] of grouped) {
		const left = keepShown(items, shown);
		if (left.length > 0) kept.set(id, left);
	}

	return kept;
}
