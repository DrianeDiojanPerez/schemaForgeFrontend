import type { XYPosition } from "@xyflow/react"

import type { ErdNode, ErdTableNode, TableColumn } from "../types/erd"
import { isTableNode } from "./node-guards"

const DEFAULT_SCHEMA = "public"

const uid = () => crypto.randomUUID().slice(0, 8)

function unusedName(prefix: string, taken: Set<string>): string {
  let count = taken.size + 1
  while (taken.has(`${prefix}_${count}`)) count += 1
  return `${prefix}_${count}`
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
