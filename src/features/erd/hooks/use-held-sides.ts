import { useEffect, useRef, useState } from "react";

import { bestSides } from "../lib/edge-lines";
import type { SideCosts, Sides } from "../lib/edge-lines";

// The least time between one swap of ends and the next. A table dragged
// through another can have the two routes trade places several times in a
// second, and a line that follows every trade reads as a flicker.
const COOLDOWN = 400;

/**
 * The sides a line runs between: always the best pair for where the tables
 * are now, so what is seen during a drag is what stays after the drop,
 * only never swapped twice in quick succession. A swap that was put off is
 * made as soon as the wait is over.
 */
export function useHeldSides(costs: SideCosts): Sides {
	const [shown, setShown] = useState<Sides>();
	const swappedAt = useRef(0);
	const wanted = bestSides(costs);
	const changed =
		!shown || shown.sourceSide !== wanted.sourceSide || shown.targetSide !== wanted.targetSide;

	useEffect(() => {
		if (!changed) return;

		const timer = setTimeout(
			() => {
				swappedAt.current = Date.now();
				setShown(wanted);
			},
			Math.max(0, swappedAt.current + COOLDOWN - Date.now()),
		);

		return () => clearTimeout(timer);
	}, [changed, wanted]);

	return shown ?? wanted;
}
