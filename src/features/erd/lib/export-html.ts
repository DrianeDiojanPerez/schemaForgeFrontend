import { isTableNode } from "./node-guards";
import type { ErdEdge, ErdNode, ErdTableNode, TableColumn } from "../types/erd";

type Report = {
	name: string;
	description?: string;
	nodes: ErdNode[];
	edges: ErdEdge[];
	/** The diagram, inlined at the top of the page. */
	svg: string;
};

const RELATIONSHIP_LABELS = {
	"one-to-one": "One to one",
	"one-to-many": "One to many",
	"many-to-many": "Many to many",
} as const;

function escape(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function typeOf(column: TableColumn): string {
	if (column.length !== undefined) return `${column.format}(${column.length})`;
	if (column.precision !== undefined) {
		return column.scale === undefined
			? `${column.format}(${column.precision})`
			: `${column.format}(${column.precision}, ${column.scale})`;
	}

	return column.format;
}

function keyOf(column: TableColumn): string {
	const parts = [];
	if (column.isPrimary) parts.push("primary");
	if (column.isForeignKey) parts.push("foreign");
	if (column.isUnique && !column.isPrimary) parts.push("unique");

	return parts.join(", ");
}

function columnRow(column: TableColumn): string {
	return `<tr>
<td><code>${escape(column.name)}</code></td>
<td><code>${escape(typeOf(column))}</code></td>
<td>${column.isNullable ? "yes" : "no"}</td>
<td>${escape(keyOf(column))}</td>
<td>${escape(column.description ?? "")}</td>
</tr>`;
}

function tableSection(table: ErdTableNode): string {
	return `<section>
<h2 id="${escape(table.data.name)}">${escape(table.data.name)}<a href="#diagram">Back to the diagram</a></h2>
${table.data.description ? `<p>${escape(table.data.description)}</p>` : ""}
<table>
<thead><tr><th>Column</th><th>Type</th><th>Nullable</th><th>Key</th><th>Description</th></tr></thead>
<tbody>
${table.data.columns.map(columnRow).join("\n")}
</tbody>
</table>
</section>`;
}

function endOf(nodes: ErdTableNode[], nodeId: string, handle: string | null | undefined): string {
	const table = nodes.find((node) => node.id === nodeId);
	const columnId = handle?.replace(/-(left|right)$/, "");
	const column = table?.data.columns.find((item) => item.id === columnId);

	return table ? `${table.data.name}${column ? `.${column.name}` : ""}` : "?";
}

function relationshipRow(tables: ErdTableNode[], edge: ErdEdge): string {
	const type = RELATIONSHIP_LABELS[edge.data?.relationshipType ?? "one-to-many"];

	return `<tr>
<td><code>${escape(endOf(tables, edge.source, edge.sourceHandle))}</code></td>
<td>${type}</td>
<td><code>${escape(endOf(tables, edge.target, edge.targetHandle))}</code></td>
<td>${escape(edge.data?.name ?? "")}</td>
<td>${escape(edge.data?.description ?? "")}</td>
</tr>`;
}

const STYLE = `
:root { color-scheme: light dark; }
html { scroll-behavior: smooth; }
body { margin: 0; font: 15px/1.5 system-ui, sans-serif; color: #1a1a1a; background: #fff; }
header { position: fixed; inset: 0 0 auto; z-index: 1; display: flex; flex-wrap: wrap; align-items: baseline; gap: .25rem 1.25rem; padding: .6rem 1.5rem; background: rgba(255, 255, 255, .86); backdrop-filter: blur(8px); border-bottom: 1px solid #ddd; }
header h1 { font-size: 1.1rem; margin: 0; }
header nav { font-size: .9rem; color: #555; }
header nav a { color: inherit; margin-right: .75rem; }
figure { margin: 0; height: 100vh; }
figure svg { display: block; width: 100%; height: 100%; }
main { max-width: 64rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
section, h2 { scroll-margin-top: 4.5rem; }
h2 { display: flex; align-items: baseline; gap: 1rem; font-size: 1.2rem; margin: 2.5rem 0 .25rem; }
h2 a { margin-left: auto; font-size: .8rem; font-weight: normal; color: #555; }
p { margin: 0 0 1rem; color: #555; }
table { width: 100%; border-collapse: collapse; font-size: .92rem; }
th, td { text-align: left; vertical-align: top; padding: .4rem .6rem; border-bottom: 1px solid #e5e5e5; }
th { font-weight: 600; color: #444; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
@media (prefers-color-scheme: dark) {
  body { color: #e6e6e6; background: #111; }
  header { background: rgba(17, 17, 17, .86); border-bottom-color: #333; }
  p, th, h2 a, header nav { color: #aaa; }
  th, td { border-bottom-color: #2a2a2a; }
}
`;

/** The colour the picture was drawn on, so the screen round it matches. */
function ground(svg: string): string | undefined {
	return /<rect width="100%" height="100%" fill="([^"]+)"\/>/.exec(svg)?.[1];
}

/**
 * A page that stands on its own: the diagram filling the first screen, then
 * every table with its columns, then the relationships, readable with
 * nothing but a browser.
 */
export function diagramHtml({ name, description, nodes, edges, svg }: Report): string {
	const tables = nodes.filter(isTableNode);
	const title = escape(name);
	const base = ground(svg);

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${STYLE}${base ? `figure { background: ${base}; }` : ""}</style>
</head>
<body>
<header>
<h1>${title}</h1>
<nav>${tables.map((table) => `<a href="#${escape(table.data.name)}">${escape(table.data.name)}</a>`).join("")}</nav>
</header>
<figure id="diagram">${svg}</figure>
<main>
${description ? `<p>${escape(description)}</p>` : ""}
${tables.map(tableSection).join("\n")}
${
	edges.length > 0
		? `<section>
<h2 id="relationships">Relationships<a href="#diagram">Back to the diagram</a></h2>
<table>
<thead><tr><th>From</th><th>Kind</th><th>To</th><th>Name</th><th>Description</th></tr></thead>
<tbody>
${edges.map((edge) => relationshipRow(tables, edge)).join("\n")}
</tbody>
</table>
</section>`
		: ""
}
</main>
</body>
</html>
`;
}
