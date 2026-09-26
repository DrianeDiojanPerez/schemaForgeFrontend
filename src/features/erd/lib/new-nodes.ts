import type { XYPosition } from "@xyflow/react"

import type { ErdEdge, ErdNode, ErdTableNode, TableColumn } from "../types/erd"
import { stripHandleSide } from "./foreign-keys"
import { isTableNode } from "./node-guards"

const DEFAULT_SCHEMA = "public"

const uid = () => crypto.randomUUID().slice(0, 8)

function unusedName(prefix: string, taken: Set<string>): string {
  let count = taken.size + 1
  while (taken.has(`${prefix}_${count}`)) count += 1
  return `${prefix}_${count}`
}

function unusedCopyName(source: string, taken: Set<string>): string {
  const base = `${source}_copy`
  if (!taken.has(base)) return base

  let count = 2
  while (taken.has(`${base}_${count}`)) count += 1
  return `${base}_${count}`
}

export function newColumn(taken: Set<string>): TableColumn {
  return {
    id: `col-${uid()}`,
    name: unusedName("column", taken),
    format: "text",
    isPrimary: false,
    isNullable: true,
    isUnique: false,
    isIdentity: false,
  }
}

/**
 * A new table arrives with the primary key it would need anyway, so the first
 * thing to do with it is name it rather than repair it.
 */
export function newTable(position: XYPosition, nodes: ErdNode[]): ErdTableNode {
  const tables = nodes.filter(isTableNode)

  return {
    id: `table-${uid()}`,
    type: "table",
    position,
    data: {
      id: tables.length + 1,
      schema: DEFAULT_SCHEMA,
      name: unusedName("table", new Set(tables.map((node) => node.data.name))),
      isForeign: false,
      columns: [
        {
          id: `col-${uid()}`,
          name: "id",
          format: "uuid",
          isPrimary: true,
          isNullable: false,
          isUnique: true,
          isIdentity: false,
        },
      ],
    },
  }
}

/**
 * The same as copying one table, done to a whole selection at once, with the
 * relationships between the copied tables carried over. Anything pointing
 * outside the selection is left behind, since the copy is not the table the
 * other end meant.
 *
 * Positions are kept relative to the top left of what was copied, so a
 * selection lands in the shape it was taken in.
 */
export function copyOfTables(
  sources: ErdTableNode[],
  edges: ErdEdge[],
  at: XYPosition,
  nodes: ErdNode[]
): { nodes: ErdTableNode[]; edges: ErdEdge[] } {
  if (sources.length === 0) return { nodes: [], edges: [] }

  const left = Math.min(...sources.map((node) => node.position.x))
  const top = Math.min(...sources.map((node) => node.position.y))

  const taken = new Set(nodes.filter(isTableNode).map((node) => node.data.name))
  const count = nodes.filter(isTableNode).length

  const forNode = new Map<string, string>()
  const forColumn = new Map<string, string>()

  const copies = sources.map((source, index) => {
    const id = `table-${uid()}`
    forNode.set(source.id, id)

    const name = unusedCopyName(source.data.name, taken)
    taken.add(name)

    return {
      ...source,
      id,
      selected: true,
      dragging: false,
      position: {
        x: at.x + (source.position.x - left),
        y: at.y + (source.position.y - top),
      },
      data: {
        ...source.data,
        id: count + index + 1,
        name,
        columns: source.data.columns.map((column) => {
          const columnId = `col-${uid()}`
          forColumn.set(`${source.id}/${column.id}`, columnId)

          return { ...column, id: columnId, isForeignKey: false }
        }),
      },
    }
  })

  // A handle is a column id with the side it sits on stuck to the end, so the
  // side is taken off to look the column up and put back on afterwards.
  const rehandle = (nodeId: string, handle: string | null | undefined) => {
    if (!handle) return handle

    const column = stripHandleSide(handle)
    const copied = forColumn.get(`${nodeId}/${column}`)

    return copied ? handle.replace(column, copied) : handle
  }

  const inside = edges.filter(
    (edge) => forNode.has(edge.source) && forNode.has(edge.target)
  )

  return {
    nodes: copies,
    edges: inside.map((edge) => ({
      ...edge,
      id: `e${forNode.get(edge.source)}-${forNode.get(edge.target)}-${Date.now()}-${uid()}`,
      source: forNode.get(edge.source)!,
      target: forNode.get(edge.target)!,
      sourceHandle: rehandle(edge.source, edge.sourceHandle),
      targetHandle: rehandle(edge.target, edge.targetHandle),
      selected: false,
    })),
  }
}
