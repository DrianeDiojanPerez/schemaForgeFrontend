import { useEffect, useMemo, useRef, useState } from "react";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import type { SQLNamespace } from "@codemirror/lang-sql";
import { forEachDiagnostic, linter, lintGutter, setDiagnosticsEffect } from "@codemirror/lint";
import type { Diagnostic as LintMark } from "@codemirror/lint";
import { EditorSelection, StateEffect, StateField } from "@codemirror/state";
import { EditorView, RectangleMarker, closeHoverTooltips, layer, tooltips } from "@codemirror/view";
import { getCM, vim } from "@replit/codemirror-vim";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";

import { cn } from "@/lib/utils";

import { sqlThemeOf } from "../lib/sql-themes";
import { showVimNotice, vimNotice } from "../lib/vim-notices";
import type { Palette, SqlTheme } from "../lib/sql-themes";

export type SqlEditorProps = {
	value: string;
	onChange: (value: string) => void;
	vim: boolean;
	theme: SqlTheme;
	/** Tables by name with their columns, offered as completions. */
	tables?: SQLNamespace;
	/** Backend findings, underlined on the names they are about. */
	problems?: EditorProblem[];
	/** Where the caret sits in the visible editor, so what floats over it can step aside. */
	onCaret?: (caret: Caret) => void;
	className?: string;
};

/** `row` counts from the top of the view, not the document, and is 0 when the
    caret is scrolled out of sight. `topInView` says the first lines of the
    document are on screen. */
export type Caret = { row: number; focused: boolean; topInView: boolean };

export type EditorProblem = {
	severity: "ERROR" | "WARNING";
	message: string;
	/** Flies the canvas to what the finding is about, when it names something there. */
	onGoTo?: () => void;
	/** Opens whatever puts the finding right, when there is such a thing. */
	onFix?: () => void;
};

type VimMode = "normal" | "insert" | "visual" | "replace";

const MODES: Record<VimMode, string> = {
	normal: "bg-primary/15 text-primary",
	insert: "bg-info/15 text-info",
	visual: "bg-warning/15 text-warning",
	replace: "bg-destructive/15 text-destructive",
};

const TRIANGLE_SHAPE =
	"<path d='m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'/>";
const CIRCLE_SHAPE = "<circle cx='12' cy='12' r='10'/>";
const TRIANGLE = `${TRIANGLE_SHAPE}<path d='M12 9v4'/><path d='M12 17h.01'/>`;
const CIRCLE = `${CIRCLE_SHAPE}<path d='M12 8v4'/><path d='M12 16h.01'/>`;

// The gutter's mark is the shape filled with the severity's colour and the
// stroke cut out of it in the page's, which stays legible at a few pixels
// where a thin outline would not.
const solid = (shape: string, stroke: string, fill: string, ink: string) =>
	`url("data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${fill}' stroke='${fill}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><g>${shape}</g><g fill='none' stroke='${ink}' stroke-width='2.6'>${stroke}</g></svg>`,
	)}")`;

const BANG_TRIANGLE = "<path d='M12 9v4'/><path d='M12 17h.01'/>";
const BANG_CIRCLE = "<path d='M12 8v4'/><path d='M12 16h.01'/>";

// The wave under a finding is drawn in a layer over the text, one box per
// range and line, because the text itself is split into a span per token
// and a wave set on those starts over in each one.
const waves = layer({
	above: true,
	class: "sf-waves",
	markers(view) {
		const marks: RectangleMarker[] = [];

		forEachDiagnostic(view.state, (finding, from, to) => {
			if (to <= view.viewport.from || from >= view.viewport.to) return;

			marks.push(
				...RectangleMarker.forRange(
					view,
					`sf-wave sf-wave-${finding.severity}`,
					EditorSelection.range(from, to),
				),
			);
		});

		return marks;
	},
	update(update) {
		return (
			update.docChanged ||
			update.viewportChanged ||
			update.geometryChanged ||
			update.transactions.some((tr) => tr.effects.some((e) => e.is(setDiagnosticsEffect)))
		);
	},
});

// The findings in the flavour's own colours: the card on hover, the names in
// it, the underlines and the marks in the gutter. The card is hung off the
// page in a wrapper that carries the editor's theme class, which is what lets
// a theme reach it.
function findingsTheme(c: Palette) {
	return EditorView.theme({
		// No edge on the card: a shadow lifts it, and each finding is a tinted block.
		".cm-tooltip-hover .cm-tooltip-lint, .cm-tooltip.cm-tooltip-lint": {
			backgroundColor: c.base,
			color: c.ink,
			boxShadow: "0 1px 2px rgb(0 0 0 / 0.2), 0 18px 40px -16px rgb(0 0 0 / 0.55)",
		},
		".cm-tooltip .sf-finding": { backgroundColor: c.surface },
		".cm-tooltip .sf-finding-go": {
			color: c.accent,
			backgroundColor: `color-mix(in srgb, ${c.accent} 14%, transparent)`,
		},
		".cm-tooltip .sf-finding-go:hover": {
			backgroundColor: `color-mix(in srgb, ${c.accent} 26%, transparent)`,
		},
		".cm-tooltip .sf-finding-text": { color: c.ink },
		".cm-tooltip .sf-finding-chip": { backgroundColor: c.chip, color: c.ink },
		".cm-tooltip .sf-finding-table": { color: c.name },
		".cm-tooltip .cm-diagnostic-warning .sf-finding-title": { color: c.warning },
		".cm-tooltip .cm-diagnostic-error .sf-finding-title": { color: c.error },
		".cm-lintRange-warning": {
			backgroundColor: `color-mix(in srgb, ${c.warning} 18%, transparent)`,
		},
		".cm-lintRange-error": { backgroundColor: `color-mix(in srgb, ${c.error} 18%, transparent)` },
		".sf-wave-warning": { backgroundColor: c.warning },
		".sf-wave-error": { backgroundColor: c.error },
		".cm-lint-marker-warning": {
			backgroundImage: solid(TRIANGLE_SHAPE, BANG_TRIANGLE, c.warning, c.base),
		},
		".cm-lint-marker-error": { backgroundImage: solid(CIRCLE_SHAPE, BANG_CIRCLE, c.error, c.base) },
	});
}

const isVimMode = (mode: string): mode is VimMode => mode in MODES;

/**
 * Where in the script a finding lands. The message names what it is about
 * in backticks, a table or a `table.column`, and the script quotes every
 * identifier, so the name is looked up inside the table's CREATE block.
 */
// The card a finding opens on hover, built by hand since the editor takes DOM
// rather than React: a severity line, then the message with each name the
// backend put in backticks drawn as a chip, the table part in the brand colour.
const SCAN =
	'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>';
const WRENCH =
	'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>';

function action(label: string, glyph: string, view: EditorView, run: () => void): HTMLElement {
	const button = document.createElement("button");
	button.type = "button";
	button.className = "sf-finding-go";
	button.title = label;
	button.setAttribute("aria-label", label);
	button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyph}</svg>`;
	button.addEventListener("click", (event) => {
		event.preventDefault();
		event.stopPropagation();
		// The card would otherwise sit over what opens until the pointer moved.
		// Hover cards close on this effect; the gutter's closes when it sees
		// the pointer well away from its mark.
		view.dispatch({ effects: closeHoverTooltips });
		window.dispatchEvent(new MouseEvent("mousemove", { clientX: -1000, clientY: -1000 }));
		run();
	});

	return button;
}

function findingCard(problem: EditorProblem, view: EditorView): HTMLElement {
	const root = document.createElement("div");
	root.className = "sf-finding";

	const head = document.createElement("div");
	head.className = "sf-finding-head";

	const title = document.createElement("div");
	title.className = "sf-finding-title";
	const mark = document.createElement("span");
	mark.className = "sf-finding-icon";
	mark.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${problem.severity === "ERROR" ? CIRCLE : TRIANGLE}</svg>`;
	title.append(mark, problem.severity === "ERROR" ? "Error" : "Warning");
	head.append(title);

	const actions = document.createElement("span");
	actions.className = "sf-finding-actions";
	if (problem.onFix) actions.append(action("Quick fix", WRENCH, view, problem.onFix));
	if (problem.onGoTo) actions.append(action("Show me on the canvas", SCAN, view, problem.onGoTo));
	if (actions.childElementCount > 0) head.append(actions);

	root.append(head);

	const text = document.createElement("div");
	text.className = "sf-finding-text";
	const parts = problem.message.split(/`([^`]+)`/);

	parts.forEach((part, index) => {
		if (index % 2 === 0) {
			text.append(index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part);
			return;
		}

		const chip = document.createElement("code");
		const dot = part.indexOf(".");
		if (dot === -1) {
			chip.className = "sf-finding-chip sf-finding-table";
			chip.textContent = part;
		} else {
			chip.className = "sf-finding-chip";
			const table = document.createElement("span");
			table.className = "sf-finding-table";
			table.textContent = part.slice(0, dot);
			chip.append(table, `.${part.slice(dot + 1)}`);
		}
		text.append(chip);
	});

	root.append(text);
	return root;
}

export function findMarks(text: string, problems: EditorProblem[]): LintMark[] {
	const lines = text.split("\n");
	const starts: number[] = [];
	let offset = 0;
	for (const line of lines) {
		starts.push(offset);
		offset += line.length + 1;
	}

	const quoted = (name: string, from = 0, to = lines.length) => {
		const needle = `"${name}"`;
		for (let i = from; i < to; i++) {
			const at = lines[i].indexOf(needle);
			if (at !== -1) return { from: starts[i] + at, to: starts[i] + at + needle.length };
		}
		return null;
	};

	const tableBlock = (table: string) => {
		const head = lines.findIndex((line) => line.startsWith(`CREATE TABLE "${table}"`));
		if (head === -1) return null;
		let end = head + 1;
		while (end < lines.length && !lines[end].startsWith(")")) end++;
		return { head, end };
	};

	const marks: LintMark[] = [];

	for (const problem of problems) {
		const names = [...problem.message.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
		const message = problem.message.replaceAll("`", "");
		const severity = problem.severity === "ERROR" ? "error" : "warning";
		const renderMessage = (view: EditorView) => findingCard(problem, view);
		let placed = false;
		// A bare name after a table is one of that table's columns.
		let within: { head: number; end: number } | null = null;

		for (const name of names) {
			const dot = name.indexOf(".");
			const table = dot === -1 ? name : name.slice(0, dot);
			const block = tableBlock(table);
			let range: { from: number; to: number } | null = null;

			if (block && dot === -1) {
				range = quoted(table, block.head, block.head + 1);
				within = block;
			} else if (block) {
				range = quoted(name.slice(dot + 1), block.head + 1, block.end);
				within = block;
			} else if (within) {
				range = quoted(name, within.head + 1, within.end);
			} else {
				range = quoted(name);
			}

			if (!range) continue;

			marks.push({ ...range, severity, message, renderMessage });
			placed = true;
		}

		// A finding that names nothing the script has still shows, at the top.
		if (!placed && lines.length > 0) {
			marks.push({ from: 0, to: lines[0].length, severity, message, renderMessage });
		}
	}

	return marks;
}

// The findings live in the editor's own state, so a new set is a dispatch
// rather than a rebuild of the extensions, and the lint source re-runs on
// that dispatch as it does on an edit.
const setProblems = StateEffect.define<EditorProblem[]>();

const problemsField = StateField.define<EditorProblem[]>({
	create: () => [],
	update(problems, tr) {
		for (const effect of tr.effects) if (effect.is(setProblems)) return effect.value;
		return problems;
	},
});

const findingsLint = linter(
	(view) => findMarks(view.state.doc.toString(), view.state.field(problemsField)),
	{
		delay: 100,
		needsRefresh: (update) =>
			update.transactions.some((tr) => tr.effects.some((effect) => effect.is(setProblems))),
	},
);

export function SqlEditor({
	value,
	onChange,
	vim: vimOn,
	theme,
	tables,
	problems,
	onCaret,
	className,
}: SqlEditorProps) {
	const editor = useRef<ReactCodeMirrorRef>(null);
	const [mode, setMode] = useState<VimMode>("normal");

	const look = sqlThemeOf(theme);

	// The editor is given the text once. A later script is written in as the
	// edit that turns one into the other, which leaves the scroll and the
	// cursor where they were, where swapping the whole document would not.
	const [initial] = useState(value);
	useEffect(() => {
		const view = editor.current?.view;
		if (!view) return;

		const current = view.state.doc.toString();
		if (current === value) return;

		let head = 0;
		while (head < current.length && head < value.length && current[head] === value[head]) head++;
		let tail = 0;
		while (
			tail < current.length - head &&
			tail < value.length - head &&
			current[current.length - 1 - tail] === value[value.length - 1 - tail]
		)
			tail++;

		view.dispatch({
			changes: {
				from: head,
				to: current.length - tail,
				insert: value.slice(head, value.length - tail),
			},
		});
	}, [value]);

	// On a fresh open the editor is not there yet when this first runs, so a
	// new editor is handed the findings as it is created as well.
	useEffect(() => {
		const view = editor.current?.view;
		if (!view || !problems?.length) return;

		view.dispatch({ effects: setProblems.of(problems) });
	}, [problems]);
	const seed = (view: EditorView) => {
		if (problems?.length) view.dispatch({ effects: setProblems.of(problems) });
	};
	const hasProblems = (problems?.length ?? 0) > 0;

	const extensions = useMemo(() => {
		const language = sql({ dialect: PostgreSQL, schema: tables, upperCaseKeywords: true });
		// The card for a finding is hung off the page rather than the editor, so
		// the panel's edges cannot cut it off.
		const findings = hasProblems
			? [
					problemsField,
					findingsLint,
					lintGutter(),
					waves,
					tooltips({ parent: document.body }),
					findingsTheme(look.palette),
				]
			: [];
		const report = (view: EditorView) => {
			const coords = view.coordsAtPos(view.state.selection.main.head);
			const top = view.scrollDOM.getBoundingClientRect().top;
			const row = coords ? Math.floor((coords.top - top) / view.defaultLineHeight) + 1 : 0;

			onCaret?.({
				row: row > 0 ? row : 0,
				focused: view.hasFocus,
				topInView: view.scrollDOM.scrollTop < view.defaultLineHeight * 3,
			});
		};
		const watch = [
			EditorView.updateListener.of((update) => {
				if (update.selectionSet || update.focusChanged) report(update.view);
			}),
			EditorView.domEventHandlers({ scroll: (_event, view) => report(view) }),
		];
		return vimOn ? [vim(), language, ...watch, ...findings] : [language, ...watch, ...findings];
	}, [vimOn, tables, hasProblems, look, onCaret]);

	useEffect(() => {
		if (!vimOn) return;

		const view = editor.current?.view;
		if (!view) return;

		const cm = getCM(view);
		if (!cm) return;

		const handler = (event: { mode: string }) => {
			if (isVimMode(event.mode)) setMode(event.mode);
		};

		// Vim starts in normal mode each time it is switched on, whatever mode
		// the badge was left showing when it went off.
		setMode("normal");
		cm.on("vim-mode-change", handler);

		// Vim's one-liners go to the toaster. The long ones, which wait for
		// Enter, keep the panel under the editor.
		const panel = cm.openNotification;
		cm.openNotification = (template, options) => {
			const notice = options.duration === 0 ? null : vimNotice(template.textContent ?? "");
			if (!notice) return panel.call(cm, template, options);

			showVimNotice(notice, options.duration);
			return () => {};
		};

		return () => {
			cm.off("vim-mode-change", handler);
			cm.openNotification = panel;
		};
	}, [vimOn]);

	return (
		<div className={cn("relative overflow-hidden", className)}>
			<CodeMirror
				ref={editor}
				value={initial}
				onChange={onChange}
				onCreateEditor={seed}
				height="100%"
				theme={look.editor}
				extensions={extensions}
				basicSetup={{
					lineNumbers: true,
					foldGutter: true,
					autocompletion: true,
					// The active line's wash sits on top of vim's visual selection
					// and hides where it starts and ends.
					highlightActiveLine: !vimOn,
					highlightActiveLineGutter: !vimOn,
				}}
				className="h-full text-sm *:h-full"
			/>
			{vimOn && (
				<span
					className={cn(
						"pointer-events-none absolute right-4 bottom-2 rounded px-1.5 py-0.5 font-mono text-2xs font-semibold tracking-wider uppercase",
						MODES[mode],
					)}
				>
					{mode}
				</span>
			)}
		</div>
	);
}
