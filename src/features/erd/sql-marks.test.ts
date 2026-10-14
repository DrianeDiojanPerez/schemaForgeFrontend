import { expect, test } from "vitest";

import { findMarks } from "@/features/erd/components/sql-editor";

const SCRIPT = [
	'CREATE TABLE "students" (',
	'    "id" UUID NOT NULL,',
	'    PRIMARY KEY ("id")',
	");",
	"",
	'CREATE TABLE "registrations" (',
	'    "id" UUID NOT NULL,',
	'    "student_id" UUID NOT NULL,',
	'    "grade" NUMERIC(4, 2) DEFAULT 0.00,',
	'    PRIMARY KEY ("id")',
	");",
	"",
	'ALTER TABLE "registrations"',
	'    ADD CONSTRAINT "fk_registrations_student_id" FOREIGN KEY ("student_id") REFERENCES "students" ("id");',
].join("\n");

const at = (from: number, to: number) => SCRIPT.slice(from, to);

test("a table name is marked on its CREATE line", () => {
	const [mark] = findMarks(SCRIPT, [
		{ severity: "WARNING", message: "`registrations` has no description" },
	]);

	expect(at(mark.from, mark.to)).toBe('"registrations"');
	expect(SCRIPT.slice(0, mark.from).split("\n").length).toBe(6);
	expect(mark.severity).toBe("warning");
	expect(mark.message).toBe("registrations has no description");
});

test("a table.column name is marked inside that table's block", () => {
	const [mark] = findMarks(SCRIPT, [
		{ severity: "ERROR", message: "`registrations.id` is unique" },
	]);

	expect(at(mark.from, mark.to)).toBe('"id"');
	expect(SCRIPT.slice(0, mark.from).split("\n").length).toBe(7);
	expect(mark.severity).toBe("error");
});

test("a bare column after a table is looked up in that table", () => {
	const marks = findMarks(SCRIPT, [
		{ severity: "WARNING", message: "`registrations` has no description, and neither do `grade`" },
	]);

	expect(marks).toHaveLength(2);
	expect(at(marks[1].from, marks[1].to)).toBe('"grade"');
});

test("a finding naming nothing in the script lands on the first line", () => {
	const [mark] = findMarks(SCRIPT, [{ severity: "WARNING", message: "`ghost` is missing" }]);

	expect(mark.from).toBe(0);
	expect(at(mark.from, mark.to)).toBe('CREATE TABLE "students" (');
});
