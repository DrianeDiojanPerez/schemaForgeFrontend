import { useCallback } from "react";
import { getViewportForBounds, useReactFlow, useStoreApi } from "@xyflow/react";

import type { Diagnostic } from "@/features/schema/types/schema";

import { isTableNode } from "../lib/node-guards";
import type { ErdEdge, ErdNode, ErdTableNode } from "../types/erd";

/** Under this the column names in a table are too small to read. */
export const READABLE_ZOOM = 1.4;

const ZOOM_DURATION = 250;

const PAN_DURATION = 450;

/**
 * Going to a table the same way wherever it was asked for, whether that is
 * the list down the side, a click on the canvas, or a column's type picker.
 */
export function useReveal() {
	const {
		fitView,
		setCenter,
		setViewport,
		getZoom,
		getNodes,
		setNodes,
		getEdges,
		setEdges,
		getNodesBounds,
	} = useReactFlow<ErdNode, ErdEdge>();
	const store = useStoreApi();

	// Too far out, the table is brought up to a size worth reading. Near
	// enough already, the zoom stays where the reader left it.
	const bringCloser = useCallback(
		(id: string) => {
			if (getZoom() >= READABLE_ZOOM) return null;

			return fitView({ nodes: [{ id }], padding: 0.3, duration: ZOOM_DURATION });
		},
		[fitView, getZoom],
	);

	// A table picked off the list can be anywhere, so it is travelled to even
	// when it needs no zooming. The promise settles when the camera does.
	const goTo = useCallback(
		(node: ErdNode): Promise<unknown> => {
			const closer = bringCloser(node.id);
			if (closer !== null) return closer;

			const bounds = getNodesBounds([node.id]);

			return setCenter(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, {
				zoom: getZoom(),
				duration: PAN_DURATION,
				// The default flight path pulls the camera back and pushes it in
				// again on the way, which reads as a lurch when the zoom was meant
				// to sit still. Straight there instead.
				interpolate: "linear",
			});
		},
		[bringCloser, getNodesBounds, getZoom, setCenter],
	);

	// A whole schema is framed rather than travelled to, since its tables are
	// spread wider than one camera move can hold. The cap keeps a schema of one
	// table from being thrown at the screen.
	const frame = useCallback(
		(ids: string[]) => {
			void fitView({
				nodes: ids.map((id) => ({ id })),
				padding: 0.25,
				maxZoom: READABLE_ZOOM,
				duration: PAN_DURATION,
			});
		},
		[fitView],
	);

	const problemEdge = useCallback(
		(diagnostic: Diagnostic): ErdEdge | undefined =>
			getEdges().find((edge) => diagnostic.elementIds.includes(edge.id)),
		[getEdges],
	);

	// The ids blamed can be a table, one of its columns, or a relationship,
	// and either way there is a table the canvas can fly to. The first one
	// blamed is the one the message is about; for a relationship it is the
	// table the line leaves from.
	const problemTable = useCallback(
		(diagnostic: Diagnostic): ErdTableNode | undefined => {
			const nodes = getNodes();
			const table = (id: string) =>
				nodes.find((node): node is ErdTableNode => isTableNode(node) && node.id === id);
			const owner = (id: string) =>
				nodes.find(
					(node): node is ErdTableNode =>
						isTableNode(node) &&
						(node.id === id || node.data.columns.some((column) => column.id === id)),
				);
			const direct = diagnostic.elementIds.map(owner).find(Boolean);
			if (direct) return direct;

			const edge = problemEdge(diagnostic);
			return edge ? table(edge.source) : undefined;
		},
		[getNodes, problemEdge],
	);

	// One that names nothing on the canvas but says where it is gets the
	// camera sent there instead. Resolves to whether there was anywhere to go.
	const goToProblem = useCallback(
		async (diagnostic: Diagnostic, inset: { right: number } = { right: 0 }): Promise<boolean> => {
			const table = problemTable(diagnostic);

			if (table) {
				const edge = problemEdge(diagnostic);
				const picked = new Set(edge ? [edge.source, edge.target] : [table.id]);

				setNodes((current) =>
					current.map((node) =>
						node.selected === picked.has(node.id)
							? node
							: { ...node, selected: picked.has(node.id) },
					),
				);
				setEdges((current) =>
					current.map((item) =>
						item.selected === (item.id === edge?.id)
							? item
							: { ...item, selected: item.id === edge?.id },
					),
				);
				// Framed with room to spare rather than filled to the edges, since a
				// card goes beside it and the columns are readable well before then.
				// The viewport is set outright rather than through fitView, which
				// waits on the next node update to reach the store and, after the
				// selection above, there may not be one.
				const { width, height, minZoom } = store.getState();
				// A panel open on the right is not canvas, so the table is framed in
				// what is left of the width beside it.
				const room = edge ? "12%" : "20%";
				const viewport = getViewportForBounds(
					getNodesBounds([...picked]),
					width,
					height,
					minZoom,
					READABLE_ZOOM,
					inset.right > 0
						? { top: room, bottom: room, left: room, right: `${inset.right + 48}px` }
						: edge
							? 0.35
							: 0.6,
				);
				await setViewport(viewport, { duration: PAN_DURATION });
				return true;
			}

			if (!diagnostic.location) return false;

			await setCenter(diagnostic.location.x, diagnostic.location.y, {
				zoom: Math.max(getZoom(), READABLE_ZOOM),
				duration: PAN_DURATION,
			});
			return true;
		},
		[
			problemTable,
			problemEdge,
			setNodes,
			setEdges,
			store,
			getNodesBounds,
			setViewport,
			setCenter,
			getZoom,
		],
	);

	return { bringCloser, goTo, frame, problemTable, goToProblem };
}
