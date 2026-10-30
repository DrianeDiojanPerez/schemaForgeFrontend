import { BugIcon, CircleAlertIcon, TriangleAlertIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

function plural(count: number) {
	return `${count} ${count === 1 ? "problem" : "problems"}`;
}

/**
 * The count of problems on a table or a line. Hover to glance, click to
 * hold it open while working.
 */
export function ProblemCount({
	problems,
	align = "end",
	iconOnly = false,
}: {
	problems: Diagnostic[];
	align?: React.ComponentProps<typeof PopoverContent>["align"];
	/** Only the icon, for where there is no room for the number. */
	iconOnly?: boolean;
}) {
	const failing = problems.some((problem) => problem.severity === "ERROR");
	const Icon = failing ? CircleAlertIcon : TriangleAlertIcon;

	return (
		<Popover>
			{/* The click stays here, or the canvas would zoom in on the table. */}
			<PopoverTrigger
				openOnHover
				delay={150}
				onClick={(event) => event.stopPropagation()}
				aria-label={plural(problems.length)}
				render={
					<button
						type="button"
						className={cn(
							"nodrag flex h-4 shrink-0 items-center gap-0.5 rounded-full tabular-nums transition-colors",
							iconOnly ? "w-4 justify-center" : "pr-1.5 pl-1",
							failing
								? "text-destructive hover:bg-destructive/10 data-popup-open:bg-destructive/10"
								: "text-warning hover:bg-warning/10 data-popup-open:bg-warning/10",
						)}
					/>
				}
			>
				<Icon strokeWidth={2} size={10} />
				{!iconOnly && problems.length}
			</PopoverTrigger>

			<PopoverContent align={align} sideOffset={6} className="w-80 gap-0 p-0">
				<header className="flex items-center gap-2 border-b border-border px-3 py-2">
					<span className="flex items-center gap-1.5 text-sm font-medium">
						<BugIcon className="size-3.5" />
						Diagnostics
					</span>
					<span className="ml-auto text-xs text-muted-foreground">{plural(problems.length)}</span>
				</header>
				<ul className="flex flex-col gap-0.5 p-1">
					{problems.map((problem) => (
						<li
							key={problem.code + problem.message}
							className="flex items-start gap-3 rounded-sm px-2.5 py-2.5"
						>
							<ProblemMark severity={problem.severity} />
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="text-sm font-medium">{problemTitle(problem.code)}</span>
								<span className="text-xs leading-relaxed text-muted-foreground">
									<ProblemMessage text={problem.message} />
								</span>
							</span>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}
