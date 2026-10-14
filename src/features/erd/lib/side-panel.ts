// The panels that lie over the canvas, the schema list on the left and the
// script on the right, come and go the same way and stop at the same line.

// In on a long ease-out that settles without a bounce, out on a shorter
// ease-in so the panel is gone before it feels like a wait.
export const PANEL_IN = { type: "tween", duration: 0.6, ease: [0.33, 0.6, 0.2, 1] } as const;
export const PANEL_OUT = { type: "tween", duration: 0.35, ease: [0.55, 0, 1, 0.45] } as const;

// Half the bar in the middle of the canvas's bottom edge and a gap, which a
// panel's edge stops short of; the stylesheet caps the width the same way.
const BAR_HALF = 152;

/** How wide a panel over the given canvas may be before it reaches the bar. */
export function panelReach(canvas: HTMLElement | null | undefined): number {
	return (canvas?.clientWidth ?? Infinity) / 2 - BAR_HALF;
}
