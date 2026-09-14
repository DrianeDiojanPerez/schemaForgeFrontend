import type {
  ErdEdge,
  ErdNode,
  RelationshipType,
  ErdTableNode,
} from "../types/erd"
import { isSchemaNode, isTableNode } from "./node-guards"

/**
 * Build a round-trippable SQL dump of the diagram. The leading comment
 * directives are what let parseSQL recover node positions, column ids and
 * edge metadata. Strip the comments and the SQL still runs, it just comes
 * back with a regenerated layout on the next import.
 */
export const buildSQL = (nodes: ErdNode[], edges: ErdEdge[]): string => {
  let sql = "-- Generated SQL Schema\n"
  sql += `-- Generated at: ${new Date().toISOString()}\n`
  sql += "--\n"
  sql += "-- This file can be re-imported into the ERD Builder.\n"
  sql += "-- Layout and IDs are preserved via these comment directives:\n"
  sql += "--   -- @node id=<id> x=<n> y=<n>     (above each CREATE TABLE)\n"
  sql += "--   -- @col  id=<id>                 (above each column line)\n"
  sql += "--   -- @edge id=<id> type=<rel> sourceHandle=<h> targetHandle=<h>\n"
  sql += "--                                    (above each ALTER TABLE FK)\n"
  sql += "-- Removing these comments will still produce valid SQL, but layout\n"
  sql += "-- and edge metadata will be regenerated on next import.\n\n"

  // Schema rectangles are drawing furniture with no DDL of their own, so
  // their geometry only survives as a directive.
  const schemaNodes = nodes.filter(isSchemaNode)
  schemaNodes.forEach((schema) => {
    const w = Math.round((schema.style?.width as number) ?? 220)
    const h = Math.round((schema.style?.height as number) ?? 140)
    const accent = schema.data.accent ?? "chart-1"
    sql += `-- @schema id=${schema.id} x=${Math.round(schema.position.x)} y=${Math.round(schema.position.y)} w=${w} h=${h} accent=${accent} name=${schema.data.name}\n`
  })
  if (schemaNodes.length > 0) sql += "\n"

  const tableNodes = nodes.filter(isTableNode)
  const tablesById = new Map<string, ErdTableNode>(
    tableNodes.map((node) => [node.id, node])
  )

  tableNodes.forEach((node) => {
    const table = node.data
    const parentBit = node.parentId ? ` parent=${node.parentId}` : ""
    sql += `-- @node id=${node.id} x=${Math.round(node.position.x)} y=${Math.round(node.position.y)}${parentBit}\n`
    sql += `-- Table: ${table.schema}.${table.name}\n`
    sql += `CREATE TABLE ${table.schema}.${table.name} (\n`

    const columnBlocks = table.columns.map((col) => {
      let colDef = `  ${col.name} ${col.format.toUpperCase()}`

      if (col.isPrimary) {
        colDef += " PRIMARY KEY"
      }

      if (!col.isNullable && !col.isPrimary) {
        colDef += " NOT NULL"
      }

      if (col.isUnique && !col.isPrimary) {
        colDef += " UNIQUE"
      }

      if (col.isIdentity) {
        colDef += " GENERATED ALWAYS AS IDENTITY"
      }

      return `  -- @col id=${col.id}\n${colDef}`
    })

    sql += columnBlocks.join(",\n")
    sql += "\n);\n\n"

    if (table.indexes && table.indexes.length > 0) {
      table.indexes.forEach((index) => {
        sql += `CREATE INDEX ${index.name} ON ${table.schema}.${table.name} `
        sql += `USING ${index.type.toUpperCase()} (${index.columns.join(", ")});\n`
      })
      sql += "\n"
    }
  })

  sql += "-- Foreign Key Constraints\n"
  edges.forEach((edge) => {
    const sourceNode = tablesById.get(edge.source)
    const targetNode = tablesById.get(edge.target)

    if (sourceNode && targetNode && edge.sourceHandle && edge.targetHandle) {
      const sourceColId = edge.sourceHandle.replace(
        /-(left|right|top|bottom)$/,
        ""
      )
      const targetColId = edge.targetHandle.replace(
        /-(left|right|top|bottom)$/,
        ""
      )

      const sourceCol = sourceNode.data.columns.find(
        (c) => c.id === sourceColId
      )
      const targetCol = targetNode.data.columns.find(
        (c) => c.id === targetColId
      )

      if (sourceCol && targetCol) {
        const constraintName = `fk_${targetNode.data.name}_${targetCol.name}`
        const relType: RelationshipType =
          edge.data?.relationshipType ?? "one-to-many"
        sql += `-- @edge id=${edge.id} type=${relType} sourceHandle=${edge.sourceHandle} targetHandle=${edge.targetHandle}\n`
        sql += `ALTER TABLE ${targetNode.data.schema}.${targetNode.data.name}\n`
        sql += `  ADD CONSTRAINT ${constraintName}\n`
        sql += `  FOREIGN KEY (${targetCol.name})\n`
        sql += `  REFERENCES ${sourceNode.data.schema}.${sourceNode.data.name}(${sourceCol.name})\n`
        sql += `  ON DELETE CASCADE;\n\n`
      }
    }
  })

  return sql
}
