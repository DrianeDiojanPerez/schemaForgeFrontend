import { useCallback } from "react"
import { useReactFlow } from "@xyflow/react"

import type { ErdNode } from "../types/erd"

/** Under this the column names in a table are too small to read. */
export const READABLE_ZOOM = 1.4

const ZOOM_DURATION = 250

const PAN_DURATION = 450

/**
 * Going to a table the same way wherever it was asked for, whether that is
 * the list down the side, a click on the canvas, or a column's type picker.
 */
export function useReveal() {
  const { fitView, setCenter, getZoom, getNodesBounds } = useReactFlow()

  // Too far out, the table is brought up to a size worth reading. Near
  // enough already, the zoom stays where the reader left it.
  const bringCloser = useCallback(
    (id: string) => {
      if (getZoom() >= READABLE_ZOOM) return null

      return fitView({ nodes: [{ id }], padding: 0.3, duration: ZOOM_DURATION })
    },
    [fitView, getZoom]
  )

  // A table picked off the list can be anywhere, so it is travelled to even
  // when it needs no zooming.
  const goTo = useCallback(
    (node: ErdNode) => {
      if (bringCloser(node.id) !== null) return

      const bounds = getNodesBounds([node.id])

      void setCenter(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        {
          zoom: getZoom(),
          duration: PAN_DURATION,
          // The default flight path pulls the camera back and pushes it in
          // again on the way, which reads as a lurch when the zoom was meant
          // to sit still. Straight there instead.
          interpolate: "linear",
        }
      )
    },
    [bringCloser, getNodesBounds, getZoom, setCenter]
  )

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
      })
    },
    [fitView]
  )

  return { bringCloser, goTo, frame }
}
