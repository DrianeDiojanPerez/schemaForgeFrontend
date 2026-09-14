import type { ErdNode, ErdSchemaNode, ErdTableNode } from "../types/erd"

export const isTableNode = (node: ErdNode): node is ErdTableNode =>
  node.type === "table" || node.type === undefined

export const isSchemaNode = (node: ErdNode): node is ErdSchemaNode =>
  node.type === "schema"
