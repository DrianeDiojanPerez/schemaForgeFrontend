import type {
  Attribute,
  Cardinality,
  DataType,
  DataTypeKind,
  Diagnostic,
  Dialect,
  Entity,
  Relationship,
  Schema,
  SchemaSummary,
  Severity,
} from "../types/schema"

/**
 * Wire-format normalisation.
 *
 * `@grpc/proto-loader` hands back proto enum value names, which carry the
 * enum's own prefix: `DATA_TYPE_KIND_VARCHAR` rather than `VARCHAR`. It also
 * renders unset optional fields as `null` instead of leaving them absent.
 *
 * This is format translation only. It decides no schema meaning, which is what
 * keeps it on the right side of the line: the prefixes are a protobuf naming
 * convention, not a fact about databases.
 */

const DATA_TYPE_PREFIX = "DATA_TYPE_KIND_"
const CARDINALITY_PREFIX = "CARDINALITY_"
const SEVERITY_PREFIX = "SEVERITY_"
const DIALECT_PREFIX = "DIALECT_"

function strip(value: unknown, prefix: string): string {
  const text = typeof value === "string" ? value : ""

  return text.startsWith(prefix) ? text.slice(prefix.length) : text
}

// null is how proto-loader spells "unset" for an optional scalar.
function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined
}

type Wire = Record<string, unknown>

export function dataTypeIn(wire: Wire | null | undefined): DataType {
  const source = wire ?? {}

  return {
    kind: strip(source.kind, DATA_TYPE_PREFIX) as DataTypeKind,
    length: optionalNumber(source.length),
    precision: optionalNumber(source.precision),
    scale: optionalNumber(source.scale),
  }
}

export function attributeIn(wire: Wire): Attribute {
  const foreignKey = wire.foreignKey as Wire | null | undefined

  return {
    id: String(wire.id ?? ""),
    name: String(wire.name ?? ""),
    description: String(wire.description ?? ""),
    dataType: dataTypeIn(wire.dataType as Wire | null),
    nullable: Boolean(wire.nullable),
    primaryKey: Boolean(wire.primaryKey),
    unique: Boolean(wire.unique),
    foreignKey: foreignKey
      ? {
          entityId: String(foreignKey.entityId ?? ""),
          attributeId: String(foreignKey.attributeId ?? ""),
        }
      : undefined,
    defaultValue: optionalString(wire.defaultValue),
  }
}

export function entityIn(wire: Wire): Entity {
  const position = (wire.position as Wire | null) ?? {}

  return {
    id: String(wire.id ?? ""),
    name: String(wire.name ?? ""),
    description: String(wire.description ?? ""),
    attributes: ((wire.attributes as Wire[] | undefined) ?? []).map(
      attributeIn
    ),
    position: {
      x: typeof position.x === "number" ? position.x : 0,
      y: typeof position.y === "number" ? position.y : 0,
    },
  }
}

export function relationshipIn(wire: Wire): Relationship {
  return {
    id: String(wire.id ?? ""),
    name: String(wire.name ?? ""),
    description: String(wire.description ?? ""),
    fromEntityId: String(wire.fromEntityId ?? ""),
    fromAttributeId: String(wire.fromAttributeId ?? ""),
    toEntityId: String(wire.toEntityId ?? ""),
    toAttributeId: String(wire.toAttributeId ?? ""),
    cardinality: strip(wire.cardinality, CARDINALITY_PREFIX) as Cardinality,
  }
}

export function schemaIn(wire: Wire): Schema {
  return {
    id: String(wire.id ?? ""),
    name: String(wire.name ?? ""),
    description: String(wire.description ?? ""),
    entities: ((wire.entities as Wire[] | undefined) ?? []).map(entityIn),
    relationships: ((wire.relationships as Wire[] | undefined) ?? []).map(
      relationshipIn
    ),
    createdAt: String(wire.createdAt ?? ""),
    updatedAt: String(wire.updatedAt ?? ""),
  }
}

export function summaryIn(wire: Wire): SchemaSummary {
  return {
    id: String(wire.id ?? ""),
    name: String(wire.name ?? ""),
    description: String(wire.description ?? ""),
    entityCount: Number(wire.entityCount ?? 0),
    relationshipCount: Number(wire.relationshipCount ?? 0),
    createdAt: String(wire.createdAt ?? ""),
    updatedAt: String(wire.updatedAt ?? ""),
  }
}

export function diagnosticIn(wire: Wire): Diagnostic {
  const location = wire.location as Wire | null | undefined

  return {
    code: String(wire.code ?? ""),
    severity: strip(wire.severity, SEVERITY_PREFIX) as Severity,
    message: String(wire.message ?? ""),
    elementIds: ((wire.elementIds as string[] | undefined) ?? []).map(String),
    location:
      location &&
      typeof location.x === "number" &&
      typeof location.y === "number"
        ? { x: location.x, y: location.y }
        : undefined,
  }
}

/**
 * Outbound. Undefined optionals are omitted rather than sent as null, which is
 * what lets the backend tell "the user gave no length" from "the length is 0".
 */
export function dataTypeOut(dataType: DataType): Wire {
  const wire: Wire = { kind: `${DATA_TYPE_PREFIX}${dataType.kind}` }

  if (dataType.length !== undefined) wire.length = dataType.length
  if (dataType.precision !== undefined) wire.precision = dataType.precision
  if (dataType.scale !== undefined) wire.scale = dataType.scale

  return wire
}

export function attributeOut(attribute: Attribute): Wire {
  const wire: Wire = {
    id: attribute.id,
    name: attribute.name,
    description: attribute.description,
    dataType: dataTypeOut(attribute.dataType),
    nullable: attribute.nullable,
    primaryKey: attribute.primaryKey,
    unique: attribute.unique,
  }

  if (attribute.foreignKey) wire.foreignKey = attribute.foreignKey
  if (attribute.defaultValue !== undefined) {
    wire.defaultValue = attribute.defaultValue
  }

  return wire
}

export function entityOut(entity: Entity): Wire {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    attributes: entity.attributes.map(attributeOut),
    position: { x: entity.position.x, y: entity.position.y },
  }
}

export function relationshipOut(relationship: Relationship): Wire {
  return {
    id: relationship.id,
    name: relationship.name,
    description: relationship.description,
    fromEntityId: relationship.fromEntityId,
    fromAttributeId: relationship.fromAttributeId,
    toEntityId: relationship.toEntityId,
    toAttributeId: relationship.toAttributeId,
    cardinality: `${CARDINALITY_PREFIX}${relationship.cardinality}`,
  }
}

export function schemaOut(schema: Schema): Wire {
  return {
    id: schema.id,
    name: schema.name,
    description: schema.description,
    entities: schema.entities.map(entityOut),
    relationships: schema.relationships.map(relationshipOut),
    createdAt: schema.createdAt,
    updatedAt: schema.updatedAt,
  }
}

export function dialectOut(dialect: Dialect): string {
  return `${DIALECT_PREFIX}${dialect}`
}
