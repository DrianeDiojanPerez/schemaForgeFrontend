import { Position } from "@xyflow/react";
import type { ConnectionLineComponentProps } from "@xyflow/react";

import { useHeldSides } from "../hooks/use-held-sides";
import { edgeDash, linePath } from "../lib/edge-lines";
import { stripHandleSide } from "../lib/foreign-keys";
import type { ErdNode } from "../types/erd";
import { useEdgeStyle } from "./edge-line-context";

const FALLBACK_TABLE_WIDTH = 160;

type Props = ConnectionLineComponentProps<ErdNode>;

// A row has a handle on all four sides, and the two on its top and bottom
// edges would hang the line off the edge of the row. The side handles sit
// at the row's middle, so the height is read off one of those instead.
function rowMiddle(node: Props["fromNode"], handle: Props["toHandle"], fallback: number) {
	if (!handle?.id) return fallback;

	const column = stripHandleSide(handle.id);
	const bounds = node.internals.handleBounds;
	const level = [...(bounds?.source ?? []), ...(bounds?.target ?? [])].find(
		(item) => item.id === `${column}-left` || item.id === `${column}-right`,
	);
	if (!level) return fallback;

	return node.internals.positionAbsolute.y + level.y + level.height / 2;
}

/**
 * The line while a relationship is still being dragged out, drawn the way it
 * will be once it lands: same route, same dash, same colour and weight. It
 * leaves from whichever side of the table is nearer the pointer, and once the
 * pointer is over a table it runs edge to edge, so nothing changes on release.
 */
export function ConnectionLine({ fromNode, fromHandle, fromY, toNode, toHandle, toX, toY }: Props) {
	const { line, dash } = useEdgeStyle();

	const sourceLeft = fromNode.internals.positionAbsolute.x;
	const sourceRight = sourceLeft + (fromNode.measured.width ?? FALLBACK_TABLE_WIDTH);

	const targetLeft = toNode ? toNode.internals.positionAbsolute.x : toX;
	const targetRight = toNode ? targetLeft + (toNode.measured.width ?? FALLBACK_TABLE_WIDTH) : toX;

	const { sourceSide, targetSide } = useHeldSides(sourceLeft, sourceRight, targetLeft, targetRight);

	const [path] = linePath(
		line,
		{
			sourceX: Math.round(sourceSide === "left" ? sourceLeft : sourceRight),
			sourceY: Math.round(rowMiddle(fromNode, fromHandle, fromY)),
			targetX: Math.round(targetSide === "left" ? targetLeft : targetRight),
			targetY: Math.round(toNode ? rowMiddle(toNode, toHandle, toY) : toY),
			sourcePosition: sourceSide === "left" ? Position.Left : Position.Right,
			targetPosition: targetSide === "left" ? Position.Left : Position.Right,
		},
		0,
	);

	// Inline, because React Flow's stylesheet colours this class and a
	// stylesheet rule wins over an attribute.
	return (
		<path
			d={path}
			fill="none"
			style={{
				stroke: "var(--primary)",
				strokeOpacity: 0.6,
				strokeWidth: 1,
				strokeDasharray: edgeDash(dash).dash,
			}}
			className="react-flow__connection-path"
		/>
	);
}
