import { isTableNode } from "./node-guards"
import type { ErdEdge, ErdNode } from "../types/erd"

export const stripHandleSide = (handle: string): string =>
  handle.replace(/-(left|right|top|bottom)$/, "")

/**
 * The foreign key mark belongs to whichever column an edge lands on. It is
 * worked out from the edges instead of being set by hand, so deleting an
 * edge or the table at its other end cannot leave a stale mark behind.
 *
 * The same array comes back when nothing changed, so React Flow does not
 * re-render every node on each edge change.
 */
export function markForeignKeys(nodes: ErdNode[], edges: ErdEdge[]): ErdNode[] {
  const referencing = new Set(
    edges.flatMap((edge) =>
      edge.targetHandle
        ? [`${edge.target}/${stripHandleSide(edge.targetHandle)}`]
        : []
    )
  )

  const next = nodes.map((node) => {
    if (!isTableNode(node)) return node

    const columns = node.data.columns.map((column) => {
      const isForeignKey = referencing.has(`${node.id}/${column.id}`)

      return Boolean(column.isForeignKey) === isForeignKey
        ? column
        : { ...column, isForeignKey }
    })

    return columns.every((column, index) => column === node.data.columns[index])
      ? node
      : { ...node, data: { ...node.data, columns } }
  })

  return next.every((node, index) => node === nodes[index]) ? nodes : next
}
