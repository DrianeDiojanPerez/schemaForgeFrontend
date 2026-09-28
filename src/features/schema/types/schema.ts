import type { Cardinality__Output } from "@/server/rpc/generated/schemaforge/v1/Cardinality";
import type { DataTypeKind__Output } from "@/server/rpc/generated/schemaforge/v1/DataTypeKind";
import type { Dialect__Output } from "@/server/rpc/generated/schemaforge/v1/Dialect";
import type { Severity__Output } from "@/server/rpc/generated/schemaforge/v1/Severity";

/**
 * The canonical schema model as the browser sees it.
 *
 * The shapes are written by hand so the browser gets plain JSON with no
 * protobuf runtime in the bundle. The enums come from the types generated
 * from the proto files, minus the prefix each proto enum carries and the
 * zero value proto3 makes every enum start with, so a value added to the
 * contract shows up here on the next `npm run proto:types`.
 */

/** `DATA_TYPE_KIND_VARCHAR` as the proto spells it, `VARCHAR` here. */
export type Unprefixed<
	TValue extends string,
	TPrefix extends string,
> = TValue extends `${TPrefix}${infer TRest}` ? TRest : never;

type Named<TValue extends string, TPrefix extends string> = Exclude<
	Unprefixed<TValue, TPrefix>,
	"UNSPECIFIED"
>;

export type DataTypeKind = Named<DataTypeKind__Output, "DATA_TYPE_KIND_">;

export type Cardinality = Named<Cardinality__Output, "CARDINALITY_">;

export type Severity = Named<Severity__Output, "SEVERITY_">;

export type Dialect = Named<Dialect__Output, "DIALECT_">;

export type Position = {
	x: number;
	y: number;
};

export type DataType = {
	kind: DataTypeKind;
	/** varchar(n), char(n) */
	length?: number;
	/** numeric(p, s) */
	precision?: number;
	scale?: number;
};

export type ForeignKeyRef = {
	entityId: string;
	attributeId: string;
};

export type Attribute = {
	id: string;
	name: string;
	/** Emitted as COMMENT ON COLUMN by the generator. */
	description: string;
	dataType: DataType;
	nullable: boolean;
	primaryKey: boolean;
	unique: boolean;
	foreignKey?: ForeignKeyRef;
	defaultValue?: string;
};

export type Entity = {
	id: string;
	name: string;
	/** Emitted as COMMENT ON TABLE by the generator. */
	description: string;
	attributes: Attribute[];
	position: Position;
};

export type Relationship = {
	id: string;
	name: string;
	description: string;
	fromEntityId: string;
	fromAttributeId: string;
	toEntityId: string;
	toAttributeId: string;
	cardinality: Cardinality;
};

export type Schema = {
	id: string;
	name: string;
	description: string;
	entities: Entity[];
	relationships: Relationship[];
	createdAt: string;
	updatedAt: string;
};

export type SchemaSummary = {
	id: string;
	name: string;
	description: string;
	entityCount: number;
	relationshipCount: number;
	createdAt: string;
	updatedAt: string;
};

export type Diagnostic = {
	/** A stable code such as `SF-KEY-MISSING`. Key off this, not the message. */
	code: string;
	severity: Severity;
	message: string;
	/** Ids of the offending entity, attribute, or relationship. */
	elementIds: string[];
	location?: Position;
};

/** The parts of a schema a caller supplies; identity and timestamps are the backend's. */
export type SchemaDraft = {
	name: string;
	description: string;
	entities: Entity[];
	relationships: Relationship[];
};

/**
 * A failed call as the browser receives it. The backend puts its stable
 * application code and any field violations in trailing metadata, and the
 * server functions unpack them into this shape.
 */
export type RpcError = {
	/** The backend's stable application code, for example 1001 for not-found. */
	appCode: number;
	/** The gRPC status name, for example `NOT_FOUND`. */
	status: string;
	message: string;
	/** Keyed by the dotted path that failed, such as `entities[0].name`. */
	violations?: Record<string, string[]>;
};

export const CARDINALITY_LABELS: Record<Cardinality, string> = {
	ONE_TO_ONE: "1:1",
	ONE_TO_MANY: "1:N",
	MANY_TO_MANY: "N:M",
};

export const EMPTY_SCHEMA: Schema = {
	id: "",
	name: "untitled schema",
	description: "",
	entities: [],
	relationships: [],
	createdAt: "",
	updatedAt: "",
};
