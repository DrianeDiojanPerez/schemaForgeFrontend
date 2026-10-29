import { useSyncExternalStore } from "react";

import { BACKGROUNDS, DEFAULT_BACKGROUND } from "./backgrounds";
import type { BackgroundStyle } from "./backgrounds";
import { DEFAULT_EDGE_DASH, DEFAULT_EDGE_LINE, EDGE_DASHES, EDGE_LINES } from "./edge-lines";
import type { EdgeDash, EdgeLine } from "./edge-lines";
import { SQL_THEMES } from "./sql-themes";
import type { SqlTheme } from "./sql-themes";

/**
 * Canvas settings that outlive the tab, kept under one key so adding the next
 * one is a field here rather than another entry in storage.
 *
 * Read through `useSyncExternalStore` for the same reason the theme is: the
 * server has no storage to read, and a `useState` initialiser that reaches for
 * it would render one thing on the server and another on hydration.
 */
export type CanvasPreferences = {
	background: BackgroundStyle;
	tableStyle: TableStyle;
	schemaGrouping: SchemaGrouping;
	/** Whether the list panel is unfolded. Kept apart from the grouping so
      putting the panel away for a moment is not the same as sending the
      schemas back to the boxes. */
	schemaListOpen: boolean;
	schemaListWidth: number;
	edgeLine: EdgeLine;
	edgeDash: EdgeDash;
	edgeLabels: boolean;
	autoSave: boolean;
	autoValidate: boolean;
	problemsShown: ProblemsShown;
	/** Whether the bar at the foot of the canvas drops out of the way until the pointer comes near. */
	toolbarHides: boolean;
	sqlVim: boolean;
	sqlPositions: boolean;
	sqlTheme: SqlTheme;
	sqlPanelWidth: number;
};

/**
 * Where the tables are gathered by schema. Both places at once is the same
 * grouping drawn twice, and neither is a diagram with the schemas left out,
 * so it is one value with two choices rather than a switch each.
 */
export type SchemaGrouping = "boxes" | "list";

export const SCHEMA_GROUPINGS = [
	{ id: "boxes", label: "Boxes on the canvas" },
	{ id: "list", label: "List down the side" },
] as const satisfies readonly { id: SchemaGrouping; label: string }[];

export const SCHEMA_LIST_WIDTH = { min: 200, max: 560, start: 256 };

/** Which of the backend's findings are drawn on the canvas and listed in the toolbar. */
export type ProblemsShown = "all" | "errors" | "none";

export const PROBLEMS_SHOWN = [
	{ id: "all", label: "Errors and warnings", detail: "Mark every finding" },
	{ id: "errors", label: "Errors only", detail: "Mark only what would break the SQL" },
	{ id: "none", label: "Nothing", detail: "Keep checking, but mark nothing" },
] as const satisfies readonly { id: ProblemsShown; label: string; detail: string }[];

/** Filled is the card look. Outline keeps only the lines, in the text colour, over a clear ground. */
export type TableStyle = "filled" | "outline";

export const TABLE_STYLES = [
	{ id: "filled", label: "Filled" },
	{ id: "outline", label: "Outline" },
] as const satisfies readonly { id: TableStyle; label: string }[];

export const SQL_PANEL_WIDTH = { min: 360, max: 960, start: 540 };

const STORAGE_KEY = "erd-canvas";

const DEFAULTS: CanvasPreferences = {
	background: DEFAULT_BACKGROUND,
	tableStyle: "filled",
	schemaGrouping: "list",
	schemaListOpen: true,
	schemaListWidth: SCHEMA_LIST_WIDTH.start,
	edgeLine: DEFAULT_EDGE_LINE,
	edgeDash: DEFAULT_EDGE_DASH,
	edgeLabels: false,
	autoSave: true,
	autoValidate: false,
	problemsShown: "all",
	toolbarHides: false,
	sqlVim: false,
	sqlPositions: true,
	sqlTheme: "mocha",
	sqlPanelWidth: SQL_PANEL_WIDTH.start,
};

const listeners = new Set<() => void>();

// Held rather than rebuilt per read, because useSyncExternalStore compares the
// snapshot by identity and a fresh object every time is an endless render.
let current = DEFAULTS;
let read = false;

/** A stored id that no longer names an option falls back to the default. */
function known<T extends string>(value: unknown, options: readonly { id: T }[], fallback: T): T {
	return options.some((option) => option.id === value) ? (value as T) : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function width(value: unknown, bounds: { min: number; max: number }, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

	return Math.min(bounds.max, Math.max(bounds.min, value));
}

/** Settings saved when the two were a switch each, which allowed both and
    neither. Only the list on its own meant the list. */
function grouping(saved: Record<string, unknown>): SchemaGrouping {
	const legacy =
		saved.schemaBoxes === true
			? "boxes"
			: saved.schemaList === true
				? "list"
				: DEFAULTS.schemaGrouping;

	return known(saved.schemaGrouping, SCHEMA_GROUPINGS, legacy);
}

function snapshot(): CanvasPreferences {
	if (read) return current;
	read = true;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return current;

		const saved = JSON.parse(stored) as Partial<CanvasPreferences>;

		current = {
			background: known(saved.background, BACKGROUNDS, DEFAULTS.background),
			tableStyle: known(saved.tableStyle, TABLE_STYLES, DEFAULTS.tableStyle),
			schemaGrouping: grouping(saved),
			schemaListOpen: flag(saved.schemaListOpen, DEFAULTS.schemaListOpen),
			schemaListWidth: width(saved.schemaListWidth, SCHEMA_LIST_WIDTH, DEFAULTS.schemaListWidth),
			edgeLine: known(saved.edgeLine, EDGE_LINES, DEFAULTS.edgeLine),
			edgeDash: known(saved.edgeDash, EDGE_DASHES, DEFAULTS.edgeDash),
			edgeLabels: flag(saved.edgeLabels, DEFAULTS.edgeLabels),
			autoSave: flag(saved.autoSave, DEFAULTS.autoSave),
			autoValidate: flag(saved.autoValidate, DEFAULTS.autoValidate),
			problemsShown: known(saved.problemsShown, PROBLEMS_SHOWN, DEFAULTS.problemsShown),
			toolbarHides: flag(saved.toolbarHides, DEFAULTS.toolbarHides),
			sqlVim: flag(saved.sqlVim, DEFAULTS.sqlVim),
			sqlPositions: flag(saved.sqlPositions, DEFAULTS.sqlPositions),
			sqlTheme: known(saved.sqlTheme, SQL_THEMES, DEFAULTS.sqlTheme),
			sqlPanelWidth: width(saved.sqlPanelWidth, SQL_PANEL_WIDTH, DEFAULTS.sqlPanelWidth),
		};
	} catch {
		// Unreadable storage or leftover nonsense from an older shape. The
		// defaults still draw a canvas.
	}

	return current;
}

export function setCanvasPreference<TKey extends keyof CanvasPreferences>(
	key: TKey,
	value: CanvasPreferences[TKey],
) {
	current = { ...snapshot(), [key]: value };

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
	} catch {
		// Private browsing can refuse storage. The setting still applies.
	}

	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useCanvasPreferences(): CanvasPreferences {
	return useSyncExternalStore(subscribe, snapshot, () => DEFAULTS);
}
