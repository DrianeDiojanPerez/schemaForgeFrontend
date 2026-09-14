/**
 * The canonical schema model, mirroring backend/proto/schemaforge/v1/schema.proto.
 *
 * Hand-written rather than generated: the server functions speak gRPC and hand
 * plain JSON to the browser, so no protobuf runtime reaches the bundle.
 * `@grpc/proto-loader` checks every message against the real `.proto` at the
 * boundary, so drift here surfaces as a failed call rather than wrong data.
 */

export type DataTypeKind =
  | "TEXT"
  | "VARCHAR"
  | "CHAR"
  | "SMALL_INT"
  | "INTEGER"
  | "BIG_INT"
  | "NUMERIC"
  | "REAL"
  | "DOUBLE_PRECISION"
  | "BOOLEAN"
  | "DATE"
  | "TIME"
  | "TIMESTAMP"
  | "TIMESTAMPTZ"
  | "UUID"
  | "JSON"
  | "JSONB"
  | "BYTEA"

export type Cardinality = "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_MANY"

export type Severity = "WARNING" | "ERROR"

export type Dialect = "POSTGRES" | "MYSQL"

export type Position = {
  x: number
  y: number
}

export type DataType = {
  kind: DataTypeKind
  /** varchar(n), char(n) */
  length?: number
  /** numeric(p, s) */
  precision?: number
  scale?: number
}

export type ForeignKeyRef = {
  entityId: string
  attributeId: string
}

export type Attribute = {
  id: string
  name: string
  /** Emitted as COMMENT ON COLUMN by the generator. */
  description: string
  dataType: DataType
  nullable: boolean
  primaryKey: boolean
  unique: boolean
  foreignKey?: ForeignKeyRef
  defaultValue?: string
}

export type Entity = {
  id: string
  name: string
  /** Emitted as COMMENT ON TABLE by the generator. */
  description: string
  attributes: Attribute[]
  position: Position
}

export type Relationship = {
  id: string
  name: string
  description: string
  fromEntityId: string
  fromAttributeId: string
  toEntityId: string
  toAttributeId: string
  cardinality: Cardinality
}

export type Schema = {
  id: string
  name: string
  description: string
  entities: Entity[]
  relationships: Relationship[]
  createdAt: string
  updatedAt: string
}

export type SchemaSummary = {
  id: string
  name: string
  description: string
  entityCount: number
  relationshipCount: number
  createdAt: string
  updatedAt: string
}

export type Diagnostic = {
  /** A stable code such as `SF-KEY-MISSING`. Key off this, not the message. */
  code: string
  severity: Severity
  message: string
  /** Ids of the offending entity, attribute, or relationship. */
  elementIds: string[]
  location?: Position
}

/** The parts of a schema a caller supplies; identity and timestamps are the backend's. */
export type SchemaDraft = {
  name: string
  description: string
  entities: Entity[]
  relationships: Relationship[]
}

/**
 * A failed call as the browser receives it. The backend puts its stable
 * application code and any field violations in trailing metadata, and the
 * server functions unpack them into this shape.
 */
export type RpcError = {
  /** The backend's stable application code, for example 1001 for not-found. */
  appCode: number
  /** The gRPC status name, for example `NOT_FOUND`. */
  status: string
  message: string
  /** Keyed by the dotted path that failed, such as `entities[0].name`. */
  violations?: Record<string, string[]>
}

export const CARDINALITY_LABELS: Record<Cardinality, string> = {
  ONE_TO_ONE: "1:1",
  ONE_TO_MANY: "1:N",
  MANY_TO_MANY: "N:M",
}

export const EMPTY_SCHEMA: Schema = {
  id: "",
  name: "untitled schema",
  description: "",
  entities: [],
  relationships: [],
  createdAt: "",
  updatedAt: "",
}
