import { expect, test } from "vitest";

import { keepShown, keepShownByElement } from "@/features/erd/lib/problems-shown";

const error = { severity: "ERROR" as const, code: "SF-KEY-MISSING" };
const warning = { severity: "WARNING" as const, code: "SF-DOC-MISSING" };

test("everything, only the errors, or nothing", () => {
	expect(keepShown([error, warning], "all")).toEqual([error, warning]);
	expect(keepShown([error, warning], "errors")).toEqual([error]);
	expect(keepShown([error, warning], "none")).toEqual([]);
});

test("a table left with nothing to show is dropped from the map", () => {
	const grouped = new Map([
		["users", [warning]],
		["posts", [error, warning]],
	]);

	expect([...keepShownByElement(grouped, "errors")]).toEqual([["posts", [error]]]);
	expect(keepShownByElement(grouped, "none").size).toBe(0);
	expect(keepShownByElement(grouped, "all")).toBe(grouped);
});
