import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import type { Diagnostic } from "@/features/schema/types/schema";
import { cn } from "@/lib/utils";

import { allPostgresTypes } from "../lib/postgres-types";

const TITLES: Record<string, string> = {
	"SF-DOC-MISSING": "Missing descriptions",
	"SF-TYPE-MISMATCH": "Types don't match",
	"SF-REL-NO-FK": "No foreign key",
	"SF-REL-CARDINALITY": "Cardinality doesn't fit",
};

// A code the list above does not know yet still gets a readable name, so
// SF-SOME-NEW-RULE reads as "Some new rule".
export function problemTitle(code: string) {
	const known = TITLES[code];
	if (known) return known;

	const words = code.replace(/^SF-/, "").replaceAll("-", " ").toLowerCase();

	return words.charAt(0).toUpperCase() + words.slice(1);
}

const TYPES = new Set(allPostgresTypes);

const CHIP = "rounded bg-foreground/8 px-1 py-px font-mono text-2xs";

// Coloured the way an editor colours code: the table in the brand colour, the
// column after it in plain text and a type in a colour of its own.
function Name({ name }: { name: string }) {
	const dot = name.indexOf(".");

	if (dot === -1) return <code className={cn(CHIP, "text-primary!")}>{name}</code>;

	return (
		<code className={cn(CHIP, "text-foreground!")}>
			<span className="text-primary!">{name.slice(0, dot)}</span>
			<span className="text-muted-foreground!">.</span>
			{name.slice(dot + 1)}
		</code>
	);
}

function Type({ name }: { name: string }) {
	return <code className={cn(CHIP, "text-info!")}>{name}</code>;
}

// Types are left bare in the sentence and many of them are plain words too, a
// "line" or a "name", so only one that follows "is" is taken for a type.
function withTypes(text: string, key: number) {
	return text
		.split(/(?<=\bis )([a-z0-9 ]+?)(?=[,.]|$| but\b)/)
		.map((part, index) =>
			index % 2 === 1 && TYPES.has(part) ? <Type key={`${key}-${index}`} name={part} /> : part,
		);
}

// The backend wraps table and column names in backticks, which are drawn as
// chips here so the names stand apart from the sentence around them.
export function ProblemMessage({ text }: { text: string }) {
	const sentence = text.charAt(0).toUpperCase() + text.slice(1);

	return sentence
		.split(/`([^`]+)`/)
		.map((part, index) =>
			index % 2 === 1 ? <Name key={index} name={part} /> : withTypes(part, index),
		);
}

// The colours in here are marked important because a menu item's hover
// repaints everything inside it in one colour.
export function ProblemMark({ severity }: { severity: Diagnostic["severity"] }) {
	const Icon = severity === "ERROR" ? CircleAlertIcon : TriangleAlertIcon;

	return (
		<span
			className={cn(
				"mt-px flex size-6 shrink-0 items-center justify-center rounded-md",
				severity === "ERROR"
					? "bg-destructive/10 text-destructive!"
					: "bg-warning/10 text-warning!",
			)}
		>
			<Icon className="size-3.5 text-current! *:text-inherit!" />
		</span>
	);
}
