import { getSmoothStepPath } from "@xyflow/react"
import type { Position } from "@xyflow/react"

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
] as const

export type EdgeLine = (typeof EDGE_LINES)[number]["id"]

export const DEFAULT_EDGE_LINE: EdgeLine = "rounded"

export type Side = "left" | "right"

export type Sides = { sourceSide: Side; targetSide: Side }

// How much closer another pair of edges has to be before a line moves to it.
// Without this a table dragged across the halfway point flips sides on
// every pixel.
const HOLD = 24

/** How far back from the table the "one" bars sit along the line. */
export const END_GAP = 4

const PAIRS: Record<`${Side}To${Capitalize<Side>}`, Sides> = {
  leftToLeft: { sourceSide: "left", targetSide: "left" },
  leftToRight: { sourceSide: "left", targetSide: "right" },
  rightToLeft: { sourceSide: "right", targetSide: "left" },
  rightToRight: { sourceSide: "right", targetSide: "right" },
}

type Pair = keyof typeof PAIRS

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
  held?: Sides
): Sides {
  const distances: Record<Pair, number> = {
    leftToLeft: Math.abs(sourceLeft - targetLeft),
    leftToRight: Math.abs(sourceLeft - targetRight),
    rightToLeft: Math.abs(sourceRight - targetLeft),
    rightToRight: Math.abs(sourceRight - targetRight),
  }

  const closest = (Object.keys(distances) as Pair[]).reduce((best, key) =>
    distances[key] < distances[best] ? key : best
  )

  if (held) {
    const kept: Pair = `${held.sourceSide}To${capitalize(held.targetSide)}`

    if (distances[kept] <= distances[closest] + HOLD) return PAIRS[kept]
  }

  return PAIRS[closest]
}

function capitalize(side: Side): Capitalize<Side> {
  return side === "left" ? "Left" : "Right"
}

type Ends = {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
}

// How far apart the lanes sit when several relationships run between the same
// two tables. Matching the corner radius keeps a turn inside its own lane.
const LANE = 14

/** The path to draw, with the point the relationship badge sits on. */
export function linePath(
  line: EdgeLine,
  ends: Ends,
  lane: number
): [string, number, number] {
  const [path, labelX, labelY] = getSmoothStepPath({
    ...ends,
    borderRadius: line === "square" ? 0 : LANE,
    offset: (lane + 1) * LANE,
  })

  return [path, labelX, labelY]
}

/**
 * How the line is drawn along that route. The dash pattern is set on the path
 * itself, which is also what overrides the marching dashes React Flow gives an
 * animated edge, so Solid really is solid.
 */
export const EDGE_DASHES = [
  { id: "solid", label: "Solid", dash: "none" },
  { id: "dashed", label: "Dashed", dash: "6 4" },
] as const

export type EdgeDash = (typeof EDGE_DASHES)[number]["id"]

export const DEFAULT_EDGE_DASH: EdgeDash = "dashed"

export function edgeDash(id: EdgeDash) {
  return EDGE_DASHES.find((item) => item.id === id) ?? EDGE_DASHES[0]
}
