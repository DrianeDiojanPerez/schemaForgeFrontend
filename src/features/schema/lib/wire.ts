import type {
  Attribute as AttributeWire,
  Attribute__Output,
} from "@/server/rpc/generated/schemaforge/v1/Attribute"
import type {
  DataType as DataTypeWire,
  DataType__Output,
} from "@/server/rpc/generated/schemaforge/v1/DataType"
import type { Dialect as DialectWire } from "@/server/rpc/generated/schemaforge/v1/Dialect"
import type { Diagnostic__Output } from "@/server/rpc/generated/schemaforge/v1/Diagnostic"
import type {
  Entity as EntityWire,
  Entity__Output,
} from "@/server/rpc/generated/schemaforge/v1/Entity"
import type {
  Relationship as RelationshipWire,
  Relationship__Output,
} from "@/server/rpc/generated/schemaforge/v1/Relationship"
import type {
  Schema as SchemaWire,
  Schema__Output,
} from "@/server/rpc/generated/schemaforge/v1/Schema"
import type { SchemaSummary__Output } from "@/server/rpc/generated/schemaforge/v1/SchemaSummary"

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
  Unprefixed,
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

function unprefix<TValue extends string, TPrefix extends string>(
  value: TValue,
  prefix: TPrefix
): Unprefixed<TValue, TPrefix> {
  const rest = value.startsWith(prefix) ? value.slice(prefix.length) : value

  return rest as Unprefixed<TValue, TPrefix>
}

// null is how proto-loader spells "unset" for an optional scalar.
function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined
}

export function dataTypeIn(wire: DataType__Output | null): DataType {
  return {
    // The zero value is not a type a column can have, and the backend never
    // sends it back, so the one name outside the domain is dropped here.
    kind: unprefix(wire?.kind ?? "", DATA_TYPE_PREFIX) as DataTypeKind,
    length: optional(wire?.length),
    precision: optional(wire?.precision),
    scale: optional(wire?.scale),
  }
}

export function attributeIn(wire: Attribute__Output): Attribute {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    dataType: dataTypeIn(wire.dataType),
    nullable: wire.nullable,
    primaryKey: wire.primaryKey,
    unique: wire.unique,
    foreignKey: wire.foreignKey
      ? {
          entityId: wire.foreignKey.entityId,
          attributeId: wire.foreignKey.attributeId,
        }
      : undefined,
    defaultValue: wire.defaultValue || undefined,
  }
}

export function entityIn(wire: Entity__Output): Entity {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    attributes: wire.attributes.map(attributeIn),
    position: { x: wire.position?.x ?? 0, y: wire.position?.y ?? 0 },
  }
}

export function relationshipIn(wire: Relationship__Output): Relationship {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    fromEntityId: wire.fromEntityId,
    fromAttributeId: wire.fromAttributeId,
    toEntityId: wire.toEntityId,
    toAttributeId: wire.toAttributeId,
    cardinality: unprefix(wire.cardinality, CARDINALITY_PREFIX) as Cardinality,
  }
}

export function schemaIn(wire: Schema__Output): Schema {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    entities: wire.entities.map(entityIn),
    relationships: wire.relationships.map(relationshipIn),
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  }
}

export function summaryIn(wire: SchemaSummary__Output): SchemaSummary {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    entityCount: wire.entityCount,
    relationshipCount: wire.relationshipCount,
    createdAt: wire.createdAt,
    updatedAt: wire.updatedAt,
  }
}

export function diagnosticIn(wire: Diagnostic__Output): Diagnostic {
  return {
    code: wire.code,
    severity: unprefix(wire.severity, SEVERITY_PREFIX) as Severity,
    message: wire.message,
    elementIds: wire.elementIds,
    location: wire.location
      ? { x: wire.location.x, y: wire.location.y }
      : undefined,
  }
}

/**
 * Outbound. Undefined optionals are omitted rather than sent as null, which is
 * what lets the backend tell "the user gave no length" from "the length is 0".
 */
export function dataTypeOut(dataType: DataType): DataTypeWire {
  const wire: DataTypeWire = { kind: `${DATA_TYPE_PREFIX}${dataType.kind}` }

  if (dataType.length !== undefined) wire.length = dataType.length
  if (dataType.precision !== undefined) wire.precision = dataType.precision
  if (dataType.scale !== undefined) wire.scale = dataType.scale

  return wire
}

export function attributeOut(attribute: Attribute): AttributeWire {
  const wire: AttributeWire = {
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

export function entityOut(entity: Entity): EntityWire {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    attributes: entity.attributes.map(attributeOut),
    position: { x: entity.position.x, y: entity.position.y },
  }
}

export function relationshipOut(relationship: Relationship): RelationshipWire {
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

export function schemaOut(schema: Schema): SchemaWire {
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

export function dialectOut(dialect: Dialect): DialectWire {
  return `${DIALECT_PREFIX}${dialect}`
}
