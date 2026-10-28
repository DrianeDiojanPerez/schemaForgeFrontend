import { expect, test } from "vitest";

import { plainTypes } from "@/features/erd/lib/export-diagram";

test("the type pickers become plain writing in the picture", () => {
	const svg =
		'<div><button type="button" data-export="compact" style="display: flex;">varchar</button>' +
		'<button type="button" class="other">keep</button></div>';

	expect(plainTypes(svg)).toBe(
		'<div><span type="button" data-export="compact" style="display: flex;">varchar</span>' +
			'<button type="button" class="other">keep</button></div>',
	);
});
