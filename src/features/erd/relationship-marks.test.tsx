// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ProblemCount } from "@/features/erd/components/problem-text";
import { problemStroke } from "@/features/erd/components/relationship-edge";
import { problemsByTable } from "@/features/erd/lib/schema-adapter";
import type { Diagnostic, SchemaDraft } from "@/features/schema/types/schema";

afterEach(cleanup);

const noKey: Diagnostic = {
	code: "SF-REL-NO-FK",
	severity: "ERROR",
	message: "relationship `orders.user_id` to `users.id` has no foreign key behind it",
	elementIds: ["rel-1", "orders-user-id", "users-id"],
};

const undocumented: Diagnostic = {
	code: "SF-DOC-MISSING",
	severity: "WARNING",
	message: "relationship `orders` to `users` has no description",
	elementIds: ["rel-1"],
};

const schema: SchemaDraft = {
	name: "shop",
	description: "",
	entities: [
		{
			id: "users",
			name: "users",
			description: "",
			position: { x: 0, y: 0 },
			attributes: [
				{
					id: "users-id",
					name: "id",
					description: "",
					dataType: { kind: "UUID" },
					nullable: false,
					primaryKey: true,
					unique: true,
				},
			],
		},
		{
			id: "orders",
			name: "orders",
			description: "",
			position: { x: 300, y: 0 },
			attributes: [
				{
					id: "orders-user-id",
					name: "user_id",
					description: "",
					dataType: { kind: "UUID" },
					nullable: false,
					primaryKey: false,
					unique: false,
				},
			],
		},
	],
	relationships: [],
};

test("a relationship problem is kept under the line as well as under both tables", () => {
	const grouped = problemsByTable(schema, [noKey]);

	expect(grouped.get("rel-1")).toEqual([noKey]);
	expect(grouped.get("orders")).toEqual([noKey]);
	expect(grouped.get("users")).toEqual([noKey]);
});

test("a line turns red for an error and keeps its colour for a warning", () => {
	expect(problemStroke([], "var(--primary)")).toBe("var(--primary)");
	expect(problemStroke([undocumented], "var(--primary)")).toBe("var(--primary)");
	expect(problemStroke([undocumented, noKey], "var(--primary)")).toBe("var(--destructive)");
});

test("the count on a line opens to the problems behind it", () => {
	render(<ProblemCount problems={[noKey, undocumented]} />);

	const pill = screen.getByRole("button", { name: "2 problems" });
	expect(pill.className).toContain("text-destructive");

	fireEvent.click(pill);

	expect(screen.getByText("No foreign key")).toBeTruthy();
	expect(screen.getByText("Missing descriptions")).toBeTruthy();
});
