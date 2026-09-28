import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Layers } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { ErdSchemaNode, SchemaAccent } from "../types/erd";
import { useGraphActions } from "./graph-actions-context";

// Spelled out per accent so Tailwind's scanner can find the text class.
const ACCENTS: Record<SchemaAccent, { text: string; color: string }> = {
	"chart-1": { text: "text-chart-1", color: "var(--chart-1)" },
	"chart-2": { text: "text-chart-2", color: "var(--chart-2)" },
	"chart-3": { text: "text-chart-3", color: "var(--chart-3)" },
	"chart-4": { text: "text-chart-4", color: "var(--chart-4)" },
	"chart-5": { text: "text-chart-5", color: "var(--chart-5)" },
};

/** The tab colour, for lists that name a schema away from its box. */
export function schemaAccentText(accent: SchemaAccent = "chart-1"): string {
	return ACCENTS[accent].text;
}

const TAB = 26;
const CORNER = 6;
/** The inside curve where the tab runs into the body. */
const JOIN = 7;

/**
 * The folder outline, clockwise from the top left.
 *
 * Drawn as one path rather than as bordered boxes. The shape needs a border
 * that stops partway along an edge and an inside corner that curves the other
 * way, and neither is something a border can be asked for: every attempt left
 * a seam where two elements met or a half drawn arc where one lacked the
 * neighbouring side to finish it.
 */
function outline(width: number, height: number, tab: number): string {
	// Half a pixel in, so a one pixel stroke lands on a pixel instead of across two.
	const left = 0.5;
	const top = 0.5;
	const right = width - 0.5;
	const bottom = height - 0.5;
	const mid = TAB + 0.5;
	const edge = Math.min(tab + 0.5, right - CORNER - JOIN);

	return [
		`M ${left} ${top + CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${left + CORNER} ${top}`,
		`H ${edge - CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${edge} ${top + CORNER}`,
		`V ${mid - JOIN}`,
		`A ${JOIN} ${JOIN} 0 0 0 ${edge + JOIN} ${mid}`,
		`H ${right - CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${right} ${mid + CORNER}`,
		`V ${bottom - CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${right - CORNER} ${bottom}`,
		`H ${left + CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${left} ${bottom - CORNER}`,
		"Z",
	].join(" ");
}

/** The tab on its own, so it can be tinted darker than the body under it. */
function tabFill(width: number, tab: number): string {
	const left = 0.5;
	const top = 0.5;
	const mid = TAB + 0.5;
	const edge = Math.min(tab + 0.5, width - 0.5 - CORNER - JOIN);

	return [
		`M ${left} ${mid}`,
		`V ${top + CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${left + CORNER} ${top}`,
		`H ${edge - CORNER}`,
		`A ${CORNER} ${CORNER} 0 0 1 ${edge} ${top + CORNER}`,
		`V ${mid - JOIN}`,
		`A ${JOIN} ${JOIN} 0 0 0 ${edge + JOIN} ${mid}`,
		"Z",
	].join(" ");
}

export const SchemaNode = ({ data, width = 0, height = 0 }: NodeProps<ErdSchemaNode>) => {
	const { renameSchema } = useGraphActions();
	const accent = ACCENTS[data.accent ?? "chart-1"];
	const tables = data.tables ?? 0;
	const label = data.label ?? data.name;
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(label);
	const inputRef = useRef<HTMLInputElement>(null);

	// The tab is as wide as the name it holds, and the outline has to turn where
	// it ends, so the path cannot be drawn until the name has been laid out.
	const tabRef = useRef<HTMLDivElement>(null);
	const [tab, setTab] = useState(0);

	// Before the paint, not after. A box is built afresh under a new id whenever
	// the schema is renamed, and waiting on the observer to say how wide the tab
	// is leaves a frame with no box drawn at all.
	useLayoutEffect(() => {
		const element = tabRef.current;
		if (!element) return;

		setTab(element.offsetWidth);

		const watch = new ResizeObserver(() => setTab(element.offsetWidth));
		watch.observe(element);

		return () => watch.disconnect();
	}, []);

	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editing]);

	const save = () => {
		const next = draft.trim();
		if (next && next !== label) renameSchema(next);
		setEditing(false);
	};

	const drawable = tab > 0 && width > 0 && height > 0;

	return (
		<div className="relative h-full w-full">
			{drawable && (
				<svg width={width} height={height} className="pointer-events-none absolute inset-0">
					<path d={outline(width, height, tab)} fill={accent.color} opacity={0.05} />
					<path d={tabFill(width, tab)} fill={accent.color} opacity={0.15} />
					<path
						d={outline(width, height, tab)}
						fill="none"
						stroke={accent.color}
						strokeOpacity={0.4}
					/>
				</svg>
			)}

			<div
				ref={tabRef}
				// nopan, or the pane's own double-click zoom swallows the event before
				// React sees it. React Flow adds that class itself, but only to nodes it
				// lets you drag, and the box is not one.
				className="nopan pointer-events-auto absolute top-0 left-0 flex h-[26px] max-w-[70%] items-center gap-x-1 px-2 select-none"
			>
				<Layers size={12} strokeWidth={1.5} className={accent.text} />
				<span className="relative inline-block h-5 overflow-hidden leading-5">
					<span
						aria-hidden="true"
						className="invisible block text-[0.55rem] font-medium whitespace-pre"
					>
						{(editing ? draft : label) || " "}
					</span>
					{editing ? (
						<input
							ref={inputRef}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							onBlur={save}
							onKeyDown={(e) => {
								if (e.key === "Enter") save();
								else if (e.key === "Escape") setEditing(false);
							}}
							onClick={(e) => e.stopPropagation()}
							// A pixel of padding, so the name does not drop as the label
							// gives way to the input. See the table's own name for why.
							className={cn(
								"absolute inset-0 m-0 h-full w-full border-0 bg-transparent p-0 pb-px text-[0.55rem] leading-5 font-medium outline-none",
								accent.text,
							)}
							style={{ caretColor: "currentColor" }}
						/>
					) : (
						<Tooltip>
							<TooltipTrigger
								render={
									<span
										className={cn(
											"absolute inset-0 cursor-pointer truncate text-[0.55rem] leading-5 font-medium",
											accent.text,
										)}
										onDoubleClick={() => {
											setDraft(label);
											setEditing(true);
										}}
									/>
								}
							>
								{label}
							</TooltipTrigger>
							{/* Stacked. The popup lays its children out in a row, which
                  puts these three side by side and breaks the count in two. */}
							<TooltipContent className="max-w-60 flex-col items-start gap-0.5">
								{/* The name again, because the one on the box is truncated as
                    soon as the tables under it sit close together. */}
								<p className="font-medium">{label}</p>
								<p className="opacity-70">
									{tables} {tables === 1 ? "table" : "tables"}
								</p>
								<p className="opacity-70">Double-click to rename</p>
							</TooltipContent>
						</Tooltip>
					)}
				</span>
			</div>
		</div>
	);
};
