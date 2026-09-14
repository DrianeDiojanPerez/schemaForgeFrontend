import type {
  Attribute,
  Cardinality,
  DataTypeKind,
  Entity,
  Relationship,
  Schema,
  SchemaDraft,
} from "@/features/schema/types/schema"

import { isTableNode } from "./node-guards"
import type {
  ErdDiagram,
  ErdEdge,
  ErdNode,
  ErdTableNode,
  RelationshipType,
  TableColumn,
  TableNodeData,
} from "../types/erd"

/**
 * Translation between the canvas and the canonical model the backend owns.
 *
 * The canvas draws PostgreSQL type names from a long list; the backend models
 * eighteen dialect-independent kinds and decides for itself what each becomes
 * in a given database. Only the types that correspond exactly are translated.
 * A type with no canonical equivalent is reported rather than coerced, because
 * a silent `inet` to `text` would make the generated DDL disagree with the
 * picture on screen.
 */

const KIND_BY_FORMAT: Record<string, DataTypeKind> = {
  text: "TEXT",
  varchar: "VARCHAR",
  char: "CHAR",
  smallint: "SMALL_INT",
  integer: "INTEGER",
  bigint: "BIG_INT",
  numeric: "NUMERIC",
  // An exact spelling of numeric rather than a near miss, so it translates.
  decimal: "NUMERIC",
  real: "REAL",
  "double precision": "DOUBLE_PRECISION",
  boolean: "BOOLEAN",
  date: "DATE",
  time: "TIME",
  timestamp: "TIMESTAMP",
  timestamptz: "TIMESTAMPTZ",
  uuid: "UUID",
  json: "JSON",
  jsonb: "JSONB",
  bytea: "BYTEA",
}

const FORMAT_BY_KIND: Record<DataTypeKind, string> = {
  TEXT: "text",
  VARCHAR: "varchar",
  CHAR: "char",
  SMALL_INT: "smallint",
  INTEGER: "integer",
  BIG_INT: "bigint",
  NUMERIC: "numeric",
  REAL: "real",
  DOUBLE_PRECISION: "double precision",
  BOOLEAN: "boolean",
  DATE: "date",
  TIME: "time",
  TIMESTAMP: "timestamp",
  TIMESTAMPTZ: "timestamptz",
  UUID: "uuid",
  JSON: "json",
  JSONB: "jsonb",
  BYTEA: "bytea",
}

const CARDINALITY_BY_TYPE: Record<RelationshipType, Cardinality> = {
  "one-to-one": "ONE_TO_ONE",
  "one-to-many": "ONE_TO_MANY",
  "many-to-many": "MANY_TO_MANY",
}

const TYPE_BY_CARDINALITY: Record<Cardinality, RelationshipType> = {
  ONE_TO_ONE: "one-to-one",
  ONE_TO_MANY: "one-to-many",
  MANY_TO_MANY: "many-to-many",
}

const DEFAULT_SCHEMA = "public"

export type Unsupported = {
  table: string
  column: string
  format: string
}

export type ToDraftResult =
  { ok: true; draft: SchemaDraft } | { ok: false; unsupported: Unsupported[] }

const stripHandleSide = (handle: string): string =>
  handle.replace(/-(left|right|top|bottom)$/, "")

/**
 * The backend has no notion of a namespace, so anything outside `public` is
 * folded into the entity name and split back out on the way in.
 */
function qualifiedName(data: TableNodeData): string {
  return data.schema === DEFAULT_SCHEMA
    ? data.name
    : `${data.schema}.${data.name}`
}

function splitName(name: string): { schema: string; name: string } {
  const dot = name.indexOf(".")

  return dot === -1
    ? { schema: DEFAULT_SCHEMA, name }
    : { schema: name.slice(0, dot), name: name.slice(dot + 1) }
}

function attributeOf(column: TableColumn): Attribute {
  return {
    id: column.id,
    name: column.name,
    description: column.description ?? "",
    dataType: {
      kind: KIND_BY_FORMAT[column.format],
      length: column.length,
      precision: column.precision,
      scale: column.scale,
    },
    nullable: column.isNullable,
    primaryKey: column.isPrimary,
    unique: column.isUnique,
    defaultValue: column.defaultValue,
  }
}

/**
 * Reads the drawing into a draft the backend can store.
 *
 * A relationship runs from the key it references to the column that carries
 * the foreign key, which is the direction the canvas already draws: source is
 * the referenced side, target is the referencing one. The foreign key is
 * recorded on the target attribute as well as in the relationship, because the
 * generator reads one to write the constraint and the verifier reads the other
 * to check cardinality.
 */
export function toDraft(
  name: string,
  description: string,
  nodes: ErdNode[],
  edges: ErdEdge[]
): ToDraftResult {
  const tables = nodes.filter(isTableNode)
  const unsupported: Unsupported[] = []

  for (const node of tables) {
    for (const column of node.data.columns) {
      if (!(column.format in KIND_BY_FORMAT)) {
        unsupported.push({
          table: node.data.name,
          column: column.name,
          format: column.format,
        })
      }
    }
  }

  if (unsupported.length > 0) return { ok: false, unsupported }

  const entities: Entity[] = tables.map((node) => ({
    id: node.id,
    name: qualifiedName(node.data),
    description: node.data.description ?? "",
    attributes: node.data.columns.map(attributeOf),
    position: { x: node.position.x, y: node.position.y },
  }))

  const byId = new Map(entities.map((entity) => [entity.id, entity]))
  const relationships: Relationship[] = []

  for (const edge of edges) {
    if (!edge.sourceHandle || !edge.targetHandle) continue

    const from = byId.get(edge.source)
    const to = byId.get(edge.target)

    if (!from || !to) continue

    const fromAttributeId = stripHandleSide(edge.sourceHandle)
    const targetAttribute = to.attributes.find(
      (attribute) => attribute.id === stripHandleSide(edge.targetHandle!)
    )

    if (!targetAttribute) continue

    targetAttribute.foreignKey = {
      entityId: from.id,
      attributeId: fromAttributeId,
    }

    relationships.push({
      id: edge.id,
      name: "",
      description: "",
      fromEntityId: from.id,
      fromAttributeId,
      toEntityId: to.id,
      toAttributeId: targetAttribute.id,
      cardinality:
        CARDINALITY_BY_TYPE[edge.data?.relationshipType ?? "one-to-many"],
    })
  }

  return { ok: true, draft: { name, description, entities, relationships } }
}

function columnOf(attribute: Attribute): TableColumn {
  return {
    id: attribute.id,
    name: attribute.name,
    // No fallback: the record covers every kind, so a miss is wire corruption
    // rather than something to paper over with `text`.
    format: FORMAT_BY_KIND[attribute.dataType.kind],
    isPrimary: attribute.primaryKey,
    isNullable: attribute.nullable,
    isUnique: attribute.unique,
    isIdentity: false,
    isForeignKey: Boolean(attribute.foreignKey),
    length: attribute.dataType.length,
    precision: attribute.dataType.precision,
    scale: attribute.dataType.scale,
    defaultValue: attribute.defaultValue,
    description: attribute.description || undefined,
  }
}

/** Turns a stored schema back into the diagram the canvas renders. */
export function toDiagram(schema: Schema): ErdDiagram {
  const nodes: ErdTableNode[] = schema.entities.map((entity, index) => ({
    id: entity.id,
    type: "table",
    position: { x: entity.position.x, y: entity.position.y },
    data: {
      id: index + 1,
      ...splitName(entity.name),
      description: entity.description || undefined,
      columns: entity.attributes.map(columnOf),
    },
  }))

  const edges: ErdEdge[] = schema.relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.fromEntityId,
    sourceHandle: `${relationship.fromAttributeId}-right`,
    target: relationship.toEntityId,
    targetHandle: `${relationship.toAttributeId}-left`,
    type: "relationship",
    animated: true,
    data: { relationshipType: TYPE_BY_CARDINALITY[relationship.cardinality] },
  }))

  return { nodes, edges, timestamp: schema.updatedAt || undefined }
}

/** Groups backend diagnostics by the table they blame, for inline display. */
export function problemsByTable(
  schema: SchemaDraft,
  diagnostics: { message: string; elementIds: string[] }[]
): Map<string, string[]> {
  const owner = new Map<string, string>()

  for (const entity of schema.entities) {
    for (const attribute of entity.attributes) {
      owner.set(attribute.id, entity.id)
    }
  }

  const grouped = new Map<string, string[]>()

  for (const diagnostic of diagnostics) {
    for (const elementId of diagnostic.elementIds) {
      const entityId = owner.get(elementId) ?? elementId
      const existing = grouped.get(entityId)

      if (existing) {
        existing.push(diagnostic.message)
      } else {
        grouped.set(entityId, [diagnostic.message])
      }
    }
  }

  return grouped
}
