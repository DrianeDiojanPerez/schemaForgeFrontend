import type { Edge, Node } from "@xyflow/react"

export type RelationshipType = "one-to-one" | "one-to-many" | "many-to-many"

export type SchemaAccent =
  "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"

export type ColumnIndex = {
  name: string
  columns: string[]
  type: "btree" | "hash" | "gin" | "gist"
}

export type TableColumn = {
  id: string
  name: string
  format: string
  isPrimary: boolean
  isNullable: boolean
  isUnique: boolean
  isIdentity: boolean
  isForeignKey?: boolean
}

export type TableNodeData = {
  id: number
  schema: string
  name: string
  ref?: string
  isForeign?: boolean
  columns: TableColumn[]
  indexes?: ColumnIndex[]
}

export type SchemaNodeData = {
  name: string
  accent?: SchemaAccent
}

export type RelationshipEdgeData = {
  relationshipType: RelationshipType
}

export type ErdTableNode = Node<TableNodeData, "table">

export type ErdSchemaNode = Node<SchemaNodeData, "schema">

export type ErdNode = ErdTableNode | ErdSchemaNode

export type ErdEdge = Edge<RelationshipEdgeData, "relationship">

export type ErdDiagram = {
  nodes: ErdNode[]
  edges: ErdEdge[]
  timestamp?: string
}
