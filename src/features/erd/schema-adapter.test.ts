import { expect, test } from "vitest";

import { toDiagram, toDraft } from "@/features/erd/lib/schema-adapter";
import type { ErdEdge, ErdTableNode } from "@/features/erd/types/erd";

const users: ErdTableNode = {
	id: "table-users",
	type: "table",
	position: { x: 0, y: 0 },
	data: {
		id: 1,
		schema: "public",
		name: "users",
		description: "People who can sign in",
		columns: [
			{
				id: "users-id",
				name: "id",
				format: "uuid",
				isPrimary: true,
				isNullable: false,
				isUnique: true,
				isIdentity: false,
			},
			{
				id: "users-email",
				name: "email",
				format: "varchar",
				length: 255,
				isPrimary: false,
				isNullable: false,
				isUnique: true,
				isIdentity: false,
				description: "Used to sign in",
			},
		],
	},
};

const orders: ErdTableNode = {
	id: "table-orders",
	type: "table",
	position: { x: 320, y: 40 },
	data: {
		id: 2,
		schema: "public",
		name: "orders",
		columns: [
			{
				id: "orders-id",
				name: "id",
				format: "uuid",
				isPrimary: true,
				isNullable: false,
				isUnique: true,
				isIdentity: false,
			},
			{
				id: "orders-total",
				name: "total",
				format: "numeric",
				precision: 10,
				scale: 2,
				isPrimary: false,
				isNullable: false,
				isUnique: false,
				isIdentity: false,
			},
			{
				id: "orders-user-id",
				name: "user_id",
				format: "uuid",
				isPrimary: false,
				isNullable: false,
				isUnique: false,
				isIdentity: false,
				isForeignKey: true,
			},
		],
	},
};

const placedBy: ErdEdge = {
	id: "placed-by",
	source: "table-users",
	sourceHandle: "users-id-right",
	target: "table-orders",
	targetHandle: "orders-user-id-left",
	type: "relationship",
	data: {
		relationshipType: "one-to-many",
		name: "places",
		description: "A user places many orders",
	},
};

const roundTrip = () => {
	const result = toDraft("shop", "", [users, orders], [placedBy]);
	if (!result.ok) throw new Error("the diagram should translate");

	return {
		draft: result.draft,
		diagram: toDiagram({
			...result.draft,
			id: "schema-1",
			createdAt: "",
			updatedAt: "",
		}),
	};
};

test("a relationship keeps its name and description through a save", () => {
	const { draft, diagram } = roundTrip();

	expect(draft.relationships[0]).toMatchObject({
		name: "places",
		description: "A user places many orders",
		cardinality: "ONE_TO_MANY",
	});
	expect(diagram.edges[0].data).toEqual(placedBy.data);
});

test("descriptions and type parameters survive a save", () => {
	const { diagram } = roundTrip();
	const [savedUsers, savedOrders] = diagram.nodes as ErdTableNode[];

	expect(savedUsers.data.description).toBe("People who can sign in");
	expect(savedUsers.data.columns[1]).toMatchObject({
		format: "varchar",
		length: 255,
		description: "Used to sign in",
	});
	expect(savedOrders.data.columns[1]).toMatchObject({
		format: "numeric",
		precision: 10,
		scale: 2,
	});
});

test("the foreign key comes from the edge, not from the column mark", () => {
	const { draft } = roundTrip();
	const userId = draft.entities[1].attributes[2];

	expect(userId.foreignKey).toEqual({
		entityId: "table-users",
		attributeId: "users-id",
	});
});

test("a relationship with no name or description saves as empty strings", () => {
	const bare: ErdEdge = {
		...placedBy,
		data: { relationshipType: "one-to-one" },
	};
	const result = toDraft("shop", "", [users, orders], [bare]);
	if (!result.ok) throw new Error("the diagram should translate");

	expect(result.draft.relationships[0]).toMatchObject({
		name: "",
		description: "",
		cardinality: "ONE_TO_ONE",
	});
});
