import { useState } from "react"

import { nearestSides } from "../lib/edge-lines"
import type { Sides } from "../lib/edge-lines"

/** The sides a line runs between, remembered so they only change for a
    clear reason rather than on every pixel of a drag. */
export function useHeldSides(
  sourceLeft: number,
  sourceRight: number,
  targetLeft: number,
  targetRight: number
): Sides {
  const [held, setHeld] = useState<Sides>()
  const sides = nearestSides(
    sourceLeft,
    sourceRight,
    targetLeft,
    targetRight,
    held
  )

  if (
    held?.sourceSide !== sides.sourceSide ||
    held.targetSide !== sides.targetSide
  ) {
    setHeld(sides)
  }

  return sides
}
