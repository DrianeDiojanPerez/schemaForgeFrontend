import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

import { exampleEcommerce, exampleSchema1 } from "@/features/erd/data/examples";
import { toDiagram, toDraft } from "@/features/erd/lib/schema-adapter";
import type { ErdDiagram } from "@/features/erd/types/erd";
import type { Diagnostic, Schema } from "@/features/schema/types/schema";

import type * as Wire from "@/features/schema/lib/wire";

import type { Credentials, SchemaForgeRpcError, calls } from "./client";

// The backend these calls go to. Unset, the whole file is skipped, so `npm
// test` stays green on a machine with nothing running.
const address = process.env.SCHEMAFORGE_TEST_BACKEND;

// Vitest loads no .env, and the client needs the proto directory and the
// session secret from it before it can be imported at all.
function loadDotenv() {
	let file: string;

	try {
		file = readFileSync(resolve(".env"), "utf8");
	} catch {
		return;
	}

	for (const line of file.split("\n")) {
		const match = line.match(/^([A-Z_]+)="?([^"\n]*)"?$/);
		if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
	}
}

const draft: Schema = {
	id: "",
	name: "boundary",
	description: "Saved and read back through the gRPC boundary",
	createdAt: "",
	updatedAt: "",
	entities: [
		{
			id: "users",
			name: "users",
			description: "Everyone who can sign in",
			position: { x: 120, y: 340 },
			attributes: [
				{
					id: "users-id",
					name: "id",
					description: "Surrogate key",
					dataType: { kind: "UUID" },
					nullable: false,
					primaryKey: true,
					unique: true,
				},
				{
					id: "users-email",
					name: "email",
					description: "One per person",
					dataType: { kind: "VARCHAR", length: 255 },
					nullable: false,
					primaryKey: false,
					unique: true,
				},
			],
		},
		{
			id: "posts",
			name: "posts",
			description: "Something a user wrote",
			position: { x: 560, y: 340 },
			attributes: [
				{
					id: "posts-id",
					name: "id",
					description: "Surrogate key",
					dataType: { kind: "UUID" },
					nullable: false,
					primaryKey: true,
					unique: true,
				},
				{
					id: "posts-user-id",
					name: "user_id",
					description: "Who wrote it",
					dataType: { kind: "UUID" },
					nullable: false,
					primaryKey: false,
					unique: false,
					foreignKey: { entityId: "users", attributeId: "users-id" },
				},
			],
		},
	],
	relationships: [
		{
			id: "author",
			name: "author",
			description: "A user writes many posts",
			fromEntityId: "users",
			fromAttributeId: "users-id",
			toEntityId: "posts",
			toAttributeId: "posts-user-id",
			cardinality: "ONE_TO_MANY",
		},
	],
};

// A diagram by the names on it rather than by its ids, since a script carries
// no ids and the backend hands out new ones on import. Keyed by name, so the
// order the tables were drawn in does not count either.
function shape(diagram: ErdDiagram, withRelationshipDetails: boolean) {
	const tables = diagram.nodes
		.filter((node) => node.type === "table")
		.map((node) => ({
			name: node.data.name,
			position: node.position,
			description: node.data.description,
			columns: node.data.columns.map((column) => ({
				name: column.name,
				format: column.format,
				isPrimary: column.isPrimary,
				isNullable: column.isNullable,
				isUnique: column.isUnique,
				length: column.length,
				precision: column.precision,
				scale: column.scale,
				defaultValue: column.defaultValue,
				description: column.description,
			})),
		}));

	const columnName = (nodeId: string, handle: string | null | undefined) => {
		const node = diagram.nodes.find((item) => item.id === nodeId);
		const columnId = handle?.replace(/-(left|right)$/, "");
		const column = node?.type === "table" && node.data.columns.find((item) => item.id === columnId);

		return `${node?.data.name}.${column ? column.name : handle}`;
	};

	const relationships = diagram.edges.map((edge) => ({
		from: columnName(edge.source, edge.sourceHandle),
		to: columnName(edge.target, edge.targetHandle),
		type: edge.data?.relationshipType,
		...(withRelationshipDetails && {
			name: edge.data?.name,
			description: edge.data?.description,
		}),
	}));

	return {
		tables: Object.fromEntries(tables.map((table) => [table.name, table])),
		relationships: Object.fromEntries(
			relationships.map((link) => [`${link.from} > ${link.to}`, link]),
		),
	};
}

const examples: [string, ErdDiagram][] = [
	["blog", exampleSchema1],
	["shop", exampleEcommerce],
];

const errors = (diagnostics: Diagnostic[]) =>
	diagnostics.filter((item) => item.severity === "ERROR").map((item) => item.code);

describe.skipIf(!address)("the gRPC boundary against a running backend", () => {
	let rpc: ReturnType<typeof calls>;
	let wire: typeof Wire;
	let stored: Schema;

	beforeAll(async () => {
		loadDotenv();
		process.env.SCHEMAFORGE_GRPC_ADDRESS = address;

		// Imported here rather than at the top, since the env module reads
		// `process.env` the moment it loads.
		const client = await import("./client");
		wire = await import("@/features/schema/lib/wire");

		// A fresh account each run, so nothing from the last run is in the way
		// and no real account's schemas are touched.
		const stamp = Date.now().toString(36);
		const signedIn = await client.v1.AuthService.register({
			name: "Boundary Test",
			email: `boundary-${stamp}@example.com`,
			password: `Boundary-${stamp}-pass`,
		});

		let tokens = { token: signedIn.token, refreshToken: signedIn.refreshToken };
		const held: Credentials = {
			tokens: () => Promise.resolve(tokens),
			update: (renewed) => {
				tokens = renewed;
				return Promise.resolve();
			},
			signedOut: () => Promise.reject(new Error("the test account was signed out")),
		};

		rpc = client.calls(held);

		const created = await rpc.SchemaService.createSchema({
			name: draft.name,
			description: draft.description,
			entities: draft.entities.map(wire.entityOut),
			relationships: draft.relationships.map(wire.relationshipOut),
		});
		stored = wire.schemaIn(created.schema!);
	}, 30_000);

	test("a schema saved through the boundary reads back as it went", async () => {
		const response = await rpc.SchemaService.getSchema({ id: stored.id });
		const read = wire.schemaIn(response.schema!);

		expect(read.name).toBe(draft.name);
		expect(read.description).toBe(draft.description);
		expect(read.entities).toMatchObject(draft.entities);
		expect(read.relationships).toMatchObject(draft.relationships);
	});

	test("the stored schema is sound, and a draft with no key is not", async () => {
		const sound = await rpc.SchemaService.validateSchema({ id: stored.id });
		expect(sound.valid).toBe(true);
		expect(errors(sound.diagnostics.map(wire.diagnosticIn))).toEqual([]);

		const keyless: Schema = {
			...draft,
			entities: draft.entities.map((entity) => ({
				...entity,
				attributes: entity.attributes.map((attribute) => ({ ...attribute, primaryKey: false })),
			})),
		};
		const unsound = await rpc.SchemaService.validateSchema({ draft: wire.schemaOut(keyless) });

		expect(unsound.valid).toBe(false);
		expect(errors(unsound.diagnostics.map(wire.diagnosticIn))).toContain("SF-KEY-MISSING");
	});

	test("the generated script has the tables, the key, the comments and the layout", async () => {
		const response = await rpc.SchemaService.generateDdl({
			id: stored.id,
			dialect: wire.dialectOut("POSTGRES"),
			includeComments: true,
			includePositions: true,
		});

		expect(response.ddl).toContain('CREATE TABLE "users"');
		expect(response.ddl).toContain('CREATE TABLE "posts"');
		expect(response.ddl).toContain('ADD CONSTRAINT "fk_posts_user_id" FOREIGN KEY ("user_id")');
		expect(response.ddl).toContain("COMMENT ON TABLE \"users\" IS 'Everyone who can sign in'");
		expect(response.ddl).toContain('-- @table "posts" 560 340');
	});

	test("an export reads back in as the same schema", async () => {
		const exported = await rpc.SchemaService.exportSchema({
			id: stored.id,
			format: "EXPORT_FORMAT_JSON",
			includePositions: true,
		});

		expect(exported.contentType).toContain("json");
		expect(() => JSON.parse(exported.content)).not.toThrow();

		const imported = await rpc.SchemaService.importSchema({
			content: exported.content,
			format: "IMPORT_FORMAT_JSON",
			includePositions: true,
		});
		const read = wire.schemaIn(imported.draft!);

		expect(read.entities.map((entity) => entity.name)).toEqual(["users", "posts"]);
		expect(read.entities[0].attributes.map((attribute) => attribute.name)).toEqual(["id", "email"]);
		expect(read.entities[0].position).toEqual({ x: 120, y: 340 });
		expect(read.relationships).toHaveLength(1);
		expect(read.relationships[0].cardinality).toBe("ONE_TO_MANY");
		expect(errors(imported.diagnostics.map(wire.diagnosticIn))).toEqual([]);
	});

	test("the generated script reads back onto the canvas with its key and layout", async () => {
		const generated = await rpc.SchemaService.generateDdl({
			id: stored.id,
			dialect: wire.dialectOut("POSTGRES"),
			includeComments: true,
			includePositions: true,
		});
		const imported = await rpc.SchemaService.importSchema({
			content: generated.ddl,
			format: "IMPORT_FORMAT_SQL",
			includePositions: true,
		});
		const read = wire.schemaIn(imported.draft!);

		const users = read.entities.find((entity) => entity.name === "users");
		const posts = read.entities.find((entity) => entity.name === "posts");
		expect(users).toBeDefined();
		expect(posts).toBeDefined();

		const userId = posts!.attributes.find((attribute) => attribute.name === "user_id");
		expect(userId?.foreignKey).toEqual({
			entityId: users!.id,
			attributeId: users!.attributes.find((attribute) => attribute.name === "id")!.id,
		});
		expect(users!.description).toBe("Everyone who can sign in");
		expect(posts!.position).toEqual({ x: 560, y: 340 });
		expect(read.relationships).toHaveLength(1);
		expect(imported.diagnostics.map(wire.diagnosticIn).map((item) => item.code)).not.toContain(
			"SF-IMPORT-SKIPPED",
		);
	});

	test.each(examples)(
		"the %s drawn on the canvas comes back the same from its own script",
		async (_, diagram) => {
			const result = toDraft("round trip", "", diagram.nodes, diagram.edges);
			if (!result.ok) throw new Error("the example uses a type the backend has no kind for");

			const asSchema: Schema = { ...result.draft, id: "", createdAt: "", updatedAt: "" };
			const generated = await rpc.SchemaService.generateDdl({
				draft: wire.schemaOut(asSchema),
				dialect: wire.dialectOut("POSTGRES"),
				includeComments: true,
				includePositions: true,
			});
			expect(generated.ddl).not.toBe("");

			const imported = await rpc.SchemaService.importSchema({
				content: generated.ddl,
				format: "IMPORT_FORMAT_SQL",
				includePositions: true,
			});
			const back = toDiagram(wire.schemaIn(imported.draft!));

			// What the canvas shows after any save is the baseline, since a save
			// already spells a type alias such as decimal the model's way. A
			// script has nowhere to carry a relationship's name or description,
			// so those two are the one thing this trip is allowed to lose.
			expect(shape(back, false)).toEqual(shape(toDiagram(asSchema), false));
			expect(imported.diagnostics.map(wire.diagnosticIn).map((item) => item.code)).not.toContain(
				"SF-IMPORT-SKIPPED",
			);
		},
	);

	test.each(examples)(
		"the %s drawn on the canvas comes back the same from its export file",
		async (_, diagram) => {
			const result = toDraft("round trip", "", diagram.nodes, diagram.edges);
			if (!result.ok) throw new Error("the example uses a type the backend has no kind for");

			const asSchema: Schema = { ...result.draft, id: "", createdAt: "", updatedAt: "" };
			const exported = await rpc.SchemaService.exportSchema({
				draft: wire.schemaOut(asSchema),
				format: "EXPORT_FORMAT_JSON",
				includePositions: true,
			});
			const imported = await rpc.SchemaService.importSchema({
				content: exported.content,
				format: "IMPORT_FORMAT_JSON",
				includePositions: true,
			});
			const back = toDiagram(wire.schemaIn(imported.draft!));

			expect(shape(back, true)).toEqual(shape(toDiagram(asSchema), true));
		},
	);

	test("a deleted schema is gone", async () => {
		await rpc.SchemaService.deleteSchema({ id: stored.id });

		const gone = await rpc.SchemaService.getSchema({ id: stored.id }).catch(
			(error: SchemaForgeRpcError) => error,
		);

		expect((gone as SchemaForgeRpcError).rpc.status).toBe("NOT_FOUND");
	});
});
