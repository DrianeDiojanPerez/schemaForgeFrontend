import { describe, expect, test } from "vitest"

import { nearestSides } from "./lib/edge-lines"

// Two tables 160 wide. The source sits at 0; the target is moved about.
const source = { left: 0, right: 160 }

describe("nearestSides", () => {
  test("picks the pair of edges that sit closest together", () => {
    expect(nearestSides(source.left, source.right, 300, 460)).toEqual({
      sourceSide: "right",
      targetSide: "left",
    })
    expect(nearestSides(source.left, source.right, -300, -140)).toEqual({
      sourceSide: "left",
      targetSide: "right",
    })
  })

  test("keeps the sides it had while another pair is only a little closer", () => {
    // The target's left edge at 78 is 78 from the source's left edge and 82
    // from its right, so a table dragged across this spot would flip between
    // the two pairs on every pixel unless the choice it had is held on to.
    const held = { sourceSide: "right", targetSide: "left" } as const

    expect(nearestSides(source.left, source.right, 78, 238, held)).toEqual(held)
    expect(nearestSides(source.left, source.right, 70, 230, held)).toEqual(held)
  })

  test("lets go of the held sides once another pair is clearly closer", () => {
    const held = { sourceSide: "right", targetSide: "left" } as const

    expect(nearestSides(source.left, source.right, -300, -140, held)).toEqual({
      sourceSide: "left",
      targetSide: "right",
    })
  })
})
