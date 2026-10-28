import { expect, test } from "vitest";

import { exampleSchema1 } from "@/features/erd/data/examples";
import { diagramHtml } from "@/features/erd/lib/export-html";

const page = diagramHtml({
	name: "blog <draft>",
	description: "Posts & comments",
	nodes: exampleSchema1.nodes,
	edges: exampleSchema1.edges,
	svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
});

test("the page carries the name, the diagram and every table", () => {
	expect(page).toContain("<title>blog &lt;draft&gt;</title>");
	expect(page).toContain("<p>Posts &amp; comments</p>");
	expect(page).toContain('<figure><svg xmlns="http://www.w3.org/2000/svg"');

	for (const node of exampleSchema1.nodes) {
		if (node.type !== "table") continue;
		expect(page).toContain(`<h2 id="${node.data.name}">${node.data.name}</h2>`);
		for (const column of node.data.columns) expect(page).toContain(`<code>${column.name}</code>`);
	}
});

test("a relationship names both of its columns and its kind", () => {
	expect(page).toContain('<h2 id="relationships">Relationships</h2>');
	expect(page).toMatch(
		/<code>users\.id<\/code><\/td>\n<td>One to many<\/td>\n<td><code>posts\.user_id<\/code>/,
	);
});

test("a key column says which kind of key it is", () => {
	expect(page).toMatch(
		/<code>id<\/code><\/td>\n<td><code>uuid<\/code><\/td>\n<td>no<\/td>\n<td>primary<\/td>/,
	);
});
