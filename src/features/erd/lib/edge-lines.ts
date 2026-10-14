import { Position } from "@xyflow/react";

/**
 * The route a relationship takes between two tables. `preview` is the same
 * shape drawn small, so the setting shows the line rather than naming it.
 */
export const EDGE_LINES = [
	{
		id: "rounded",
		label: "Rounded",
		preview: "M2 12 H26 A6 6 0 0 1 32 18 V26 A6 6 0 0 0 38 32 H62",
	},
	{ id: "square", label: "Square", preview: "M2 12 H32 V32 H62" },
] as const;

export type EdgeLine = (typeof EDGE_LINES)[number]["id"];

export const DEFAULT_EDGE_LINE: EdgeLine = "rounded";

export type Side = "left" | "right";

export type Sides = { sourceSide: Side; targetSide: Side };

// How much closer another pair of edges has to be before a line moves to it.
// Without this a table dragged across the halfway point flips sides on
// every pixel.
const HOLD = 40;

/** How far back from the table the "one" bars sit along the line. */
export const END_GAP = 4;

const PAIRS: Record<`${Side}To${Capitalize<Side>}`, Sides> = {
	leftToLeft: { sourceSide: "left", targetSide: "left" },
	leftToRight: { sourceSide: "left", targetSide: "right" },
	rightToLeft: { sourceSide: "right", targetSide: "left" },
	rightToRight: { sourceSide: "right", targetSide: "right" },
};

type Pair = keyof typeof PAIRS;

/**
 * Which side of each table a line runs between: the pair of edges that sit
 * closest together, so a line never crosses back over its own table. The
 * sides the line had are kept until another pair is closer by a clear
 * margin.
 */
export function nearestSides(
	sourceLeft: number,
	sourceRight: number,
	targetLeft: number,
	targetRight: number,
	held?: Sides,
): Sides {
	const distances: Record<Pair, number> = {
		leftToLeft: Math.abs(sourceLeft - targetLeft),
		leftToRight: Math.abs(sourceLeft - targetRight),
		rightToLeft: Math.abs(sourceRight - targetLeft),
		rightToRight: Math.abs(sourceRight - targetRight),
	};

	const closest = (Object.keys(distances) as Pair[]).reduce((best, key) =>
		distances[key] < distances[best] ? key : best,
	);

	if (held) {
		const kept: Pair = `${held.sourceSide}To${capitalize(held.targetSide)}`;

		if (distances[kept] <= distances[closest] + HOLD) return PAIRS[kept];
	}

	return PAIRS[closest];
}

function capitalize(side: Side): Capitalize<Side> {
	return side === "left" ? "Left" : "Right";
}

type Ends = {
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	sourcePosition: Position;
	targetPosition: Position;
};

// How far apart the lanes sit when several relationships run between the same
// two tables.
const LANE = 14;

// How round a corner is. No more than a lane, so a turn stays inside its own.
export const RADIUS = 10;

type Point = { x: number; y: number };

/**
 * Every route is the same shape: out from the source to a first vertical,
 * along it to a crossing line, across to a second vertical, along that to
 * the target's row, and in. Facing tables with room between them have both
 * verticals in one place, which is the S. Closer than that they part, and
 * the line reaches past the other table and comes back round. A loop round a
 * table also has them together, out past its side. One shape for all three
 * is what lets a line slide from one to another when the sides change.
 */
function twoVerticalPath(
	{ sourceX, sourceY, targetX, targetY }: Ends,
	firstX: number,
	secondX: number,
	radius: number,
): [string, number, number] {
	const crossY = (sourceY + targetY) / 2;
	const points: Point[] = [
		{ x: sourceX, y: sourceY },
		{ x: firstX, y: sourceY },
		{ x: firstX, y: crossY },
		{ x: secondX, y: crossY },
		{ x: secondX, y: targetY },
		{ x: targetX, y: targetY },
	];
	const runs = points.slice(1).map((point, i) => distance(points[i], point));

	// A corner rounds by no more than the run on either side of it, and
	// shares a run with the corner at its other end. With the verticals
	// together the two middle corners are not there, and the outer ones have
	// the whole vertical between them.
	const together = runs[2] === 0;
	const bends = [
		Math.min(radius, runs[0], together ? (runs[1] + runs[3]) / 2 : runs[1] / 2),
		together ? 0 : Math.min(radius, runs[1] / 2, runs[2] / 2),
		together ? 0 : Math.min(radius, runs[2] / 2, runs[3] / 2),
		Math.min(radius, runs[4], together ? (runs[1] + runs[3]) / 2 : runs[3] / 2),
	];

	let path = `M${points[0].x} ${points[0].y}`;
	for (let i = 1; i <= 4; i++) {
		const corner = points[i];
		const approach = towards(corner, points[i - 1], bends[i - 1]);
		const leave = towards(corner, points[i + 1], bends[i - 1]);
		path += `L${approach.x} ${approach.y}Q${corner.x} ${corner.y} ${leave.x} ${leave.y}`;
	}
	path += `L${points[5].x} ${points[5].y}`;

	return [path, (firstX + secondX) / 2, crossY];
}

function distance(a: Point, b: Point): number {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

/** The point `by` along the way from `from` to `to`, or `from` itself when they are the same point. */
function towards(from: Point, to: Point, by: number): Point {
	const length = distance(from, to);
	if (length === 0) return from;

	return {
		x: from.x + ((to.x - from.x) / length) * by,
		y: from.y + ((to.y - from.y) / length) * by,
	};
}

// How far out from a table the line goes before it turns. Round a table it
// keeps a lane clear and a corner's worth more, so the curve has its run.
// Between facing tables a shorter one lets the S form in a narrower gap.
const LOOP_REACH = 2 * LANE;
const ACROSS_REACH = LANE;

/** The path to draw, with the point the relationship badge sits on. */
export function linePath(
	line: EdgeLine,
	ends: Ends,
	lane: number,
	radius = RADIUS,
): [string, number, number] {
	if (line === "square") radius = 0;
	const { sourceX, targetX, sourcePosition, targetPosition } = ends;
	const out = sourcePosition === Position.Right ? 1 : -1;
	const shift = lane * LANE * out;

	if (sourcePosition === targetPosition) {
		const edge = out > 0 ? Math.max(sourceX, targetX) : Math.min(sourceX, targetX);
		const verticalX = edge + out * LOOP_REACH + shift;
		return twoVerticalPath(ends, verticalX, verticalX, radius);
	}

	const firstX = sourceX + out * ACROSS_REACH + shift;
	const secondX = targetX - out * ACROSS_REACH + shift;

	// Room for both reaches between the tables is room for the S.
	if ((secondX - firstX) * out >= 0) {
		const middle = (sourceX + targetX) / 2 + shift;
		return twoVerticalPath(ends, middle, middle, radius);
	}

	return twoVerticalPath(ends, firstX, secondX, radius);
}

/**
 * How the line is drawn along that route. The dash pattern is set on the path
 * itself, which is also what overrides the marching dashes React Flow gives an
 * animated edge, so Solid really is solid.
 */
export const EDGE_DASHES = [
	{ id: "solid", label: "Solid", dash: "none" },
	{ id: "dashed", label: "Dashed", dash: "6 4" },
] as const;

export type EdgeDash = (typeof EDGE_DASHES)[number]["id"];

export const DEFAULT_EDGE_DASH: EdgeDash = "solid";

export function edgeDash(id: EdgeDash) {
	return EDGE_DASHES.find((item) => item.id === id) ?? EDGE_DASHES[0];
}
