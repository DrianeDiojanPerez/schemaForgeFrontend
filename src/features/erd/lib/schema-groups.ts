import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH } from "./node-dimensions";
import { isTableNode } from "./node-guards";
import { DEFAULT_SCHEMA } from "./schema-adapter";
import type { ErdNode, ErdSchemaNode, ErdTableNode, SchemaAccent } from "../types/erd";

export const SCHEMA_ACCENTS: SchemaAccent[] = [
	"chart-1",
	"chart-2",
	"chart-3",
	"chart-4",
	"chart-5",
];

export type SchemaGroup = {
	name: string;
	accent: SchemaAccent;
	tables: ErdTableNode[];
};

/** The tables of each schema, in the order the schema was first seen. */
export function schemaGroups(nodes: ErdNode[]): SchemaGroup[] {
	const bySchema = new Map<string, ErdTableNode[]>();

	for (const node of nodes) {
		if (!isTableNode(node)) continue;

		const tables = bySchema.get(node.data.schema);
		if (tables) tables.push(node);
		else bySchema.set(node.data.schema, [node]);
	}

	return [...bySchema].map(([name, tables], index) => ({
		name,
		accent: SCHEMA_ACCENTS[index % SCHEMA_ACCENTS.length],
		tables,
	}));
}

/**
 * What a group is called on screen.
 *
 * A table only belongs to a named schema when its name carries the prefix, so
 * the rest fall into `public` on the way in. That is the backend's word, not
 * one the user chose, and the schema they did name is the whole diagram.
 */
export function schemaLabel(group: string, diagram: string): string {
	return group === DEFAULT_SCHEMA ? diagram : group;
}

const BOX_ID = "schema-box-";

/** The boxes are drawn from the tables, so nothing about one is worth keeping. */
export function isSchemaBoxId(id: string): boolean {
	return id.startsWith(BOX_ID);
}

// Room left around the tables, with the extra on top for the title bar.
const PADDING = 28;
const TITLE_BAR = 26;

function sizeOf(node: ErdTableNode) {
	return {
		width: node.measured?.width ?? TABLE_NODE_WIDTH,
		height: node.measured?.height ?? TABLE_NODE_ROW_HEIGHT * (node.data.columns.length + 1),
	};
}

/**
 * A box drawn around each schema's tables.
 *
 * Worked out from where the tables are rather than stored, because the schema
 * a table belongs to already travels with the table and survives a save. A box
 * the user drew by hand would not: the backend has no node to keep it in.
 */
export function schemaBoxes(nodes: ErdNode[], diagram: string): ErdSchemaNode[] {
	return schemaGroups(nodes).map(({ name, accent, tables }) => {
		const left = Math.min(...tables.map((node) => node.position.x));
		const top = Math.min(...tables.map((node) => node.position.y));
		const right = Math.max(...tables.map((node) => node.position.x + sizeOf(node).width));
		const bottom = Math.max(...tables.map((node) => node.position.y + sizeOf(node).height));

		return {
			id: `${BOX_ID}${name}`,
			type: "schema",
			position: { x: left - PADDING, y: top - PADDING - TITLE_BAR },
			// Given rather than left to be measured. A box is rebuilt every time a
			// table moves, and React Flow hides a node it has no size for until it
			// has measured it, which is a frame late and reads as a blink.
			width: right - left + PADDING * 2,
			height: bottom - top + PADDING * 2 + TITLE_BAR,
			// Behind the tables and inert. Moving or deleting the box would have
			// nothing to change, since the tables are what put it there. Clicks fall
			// through it too, or a large box would swallow panning and right-clicks
			// over everything it covers. The title bar takes its own back.
			className: "pointer-events-none",
			zIndex: -1,
			draggable: false,
			selectable: false,
			deletable: false,
			data: {
				name,
				label: schemaLabel(name, diagram),
				accent,
				tables: tables.length,
			},
		};
	});
}
