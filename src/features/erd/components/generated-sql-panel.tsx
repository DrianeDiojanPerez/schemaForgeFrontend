import type * as React from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { SiVim } from "@icons-pack/react-simple-icons";
import { AnimatePresence, motion } from "motion/react";
import { useReactFlow } from "@xyflow/react";
import {
	CheckIcon,
	CopyIcon,
	DownloadIcon,
	FileCodeIcon,
	MapPinIcon,
	MessageSquareTextIcon,
	PaletteIcon,
	ScanSearchIcon,
	SettingsIcon,
	WrenchIcon,
	XIcon,
} from "lucide-react";

import { useTour } from "@/components/tour";
import type { TourStep } from "@/components/tour";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Diagnostic } from "@/features/schema/types/schema";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { useReveal } from "../hooks/use-reveal";
import type { Generated } from "../hooks/use-schema-sync";
import {
	SQL_PANEL_WIDTH,
	setCanvasPreference,
	useCanvasPreferences,
} from "../lib/canvas-preferences";
import { SQL_THEMES, SQL_THEME_ENTRIES, SQL_THEME_GROUPS, sqlThemeOf } from "../lib/sql-themes";
import type { Palette, SqlTheme } from "../lib/sql-themes";
import { downloadText } from "../lib/download";
import { PANEL_IN, PANEL_OUT, panelReach } from "../lib/side-panel";
import { nodeAnchor } from "../lib/tour";
import type { ErdTableNode } from "../types/erd";
import { DescribeDialog } from "./describe-dialog";
import type { Described } from "./describe-dialog";
import { ProblemMark, ProblemMessage, problemTitle } from "./problem-text";
import { SqlEditor } from "./sql-editor";
import type { Caret } from "./sql-editor";

export type GeneratedSqlPanelProps = {
	result: Generated | null;
	generating: boolean;
	tables: Record<string, string[]>;
	onClose: () => void;
	onOptionsChange: (options: { includeComments: boolean; includePositions: boolean }) => void;
};

const setSqlVim = (on: boolean) => setCanvasPreference("sqlVim", on);
const setSqlTheme = (theme: SqlTheme) => setCanvasPreference("sqlTheme", theme);

const THEME_ITEMS = SQL_THEMES.map((item) => ({ value: item.id, label: item.label }));

const CODE_CHIP = "rounded bg-foreground/8 px-1 py-px font-mono text-2xs text-muted-foreground";

const UNFOLD = { duration: 0.5, ease: [0.16, 1, 0.3, 1] } as const;

// How long the tools stay out after the pointer leaves, so a hand on its way
// to the next button is not left holding nothing, and how long a fresh panel
// shows them all before folding.
const LINGER = 600;
const INTRO = 3000;

export const GeneratedSqlPanel = memo(function GeneratedSqlPanel({
	result,
	generating,
	tables,
	onClose,
	onOptionsChange,
}: GeneratedSqlPanelProps) {
	const [copied, setCopied] = useState(false);
	// Edits are remembered against the script they were made to, so a fresh
	// script from the backend replaces them rather than being overwritten.
	const [edit, setEdit] = useState<{ of: string; text: string } | null>(null);
	const { sqlVim, sqlTheme, sqlPanelWidth } = useCanvasPreferences();
	// The width while the edge is being dragged, and the saved one otherwise.
	const [dragWidth, setDragWidth] = useState<number | null>(null);
	const width = dragWidth ?? sqlPanelWidth;
	const { problemTable, goToProblem } = useReveal();
	const { show } = useTour();
	const [settingsOpen, setSettingsOpen] = useState(false);
	// One sample beside the theme list, following whichever option is under
	// the pointer, rather than a card per option coming and going.
	const [themesOpen, setThemesOpen] = useState(false);
	const [hovered, setHovered] = useState<SqlTheme | null>(null);
	const [caret, setCaret] = useState<Caret>({ row: 1, focused: false, topInView: true });
	const ddl = result?.ddl ?? "";
	const diagnostics = result?.diagnostics ?? [];
	const errors = diagnostics.filter((item) => item.severity === "ERROR");
	const blocked = ddl === "";
	const text = edit?.of === ddl ? edit.text : ddl;

	const copy = async () => {
		if (!text) return;

		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
		notify.success({ title: "Copied", description: "The SQL is on your clipboard." });
	};

	const download = () => {
		if (!result) return;

		downloadText(result.file, text, "application/sql");
		notify.success({ title: "Downloaded", description: result.file });
	};

	// The canvas flies to the table the problem is about, framed beside the
	// panel, and a card next to it says what is wrong. The panel stays open.
	const pointAt = (diagnostic: Diagnostic) => {
		const table = problemTable(diagnostic);
		if (!table) {
			void goToProblem(diagnostic, { right: width });
			return;
		}

		const stop: TourStep = {
			target: nodeAnchor(table.id),
			side: "right",
			reveal: () => goToProblem(diagnostic, { right: width }),
			content: <ProblemStop diagnostic={diagnostic} />,
		};
		show([stop]);
	};

	// The one finding with a fix on hand: the table it is about and the
	// columns it names get described together, and the script is written again.
	const { updateNodeData } = useReactFlow<ErdTableNode>();
	const [describing, setDescribing] = useState<{ table: ErdTableNode; columnIds: string[] } | null>(
		null,
	);
	// The script is written again once the describing has landed in the
	// nodes, which is a render later than the save.
	const [saves, setSaves] = useState(0);
	const rewritten = useRef(0);

	const fixFor = (diagnostic: Diagnostic): (() => void) | undefined => {
		if (diagnostic.code !== "SF-DOC-MISSING") return undefined;

		const table = problemTable(diagnostic);
		if (!table) return undefined;

		const columnIds = diagnostic.elementIds.filter((id) =>
			table.data.columns.some((column) => column.id === id),
		);
		return () => setDescribing({ table, columnIds });
	};

	const describe = (table: ErdTableNode, { description, columns }: Described) => {
		updateNodeData(table.id, (node) => ({
			...(description ? { description } : {}),
			columns: node.data.columns.map((column) => {
				const given = column.id in columns ? columns[column.id].trim() : "";
				return given ? { ...column, description: given } : column;
			}),
		}));
		setSaves((count) => count + 1);
	};

	useEffect(() => {
		if (saves === rewritten.current || !result) return;

		rewritten.current = saves;
		// The canvas hands its newest generate over in an effect of its own,
		// which runs after this one, so the call waits until both have run.
		const { includeComments, includePositions } = result;
		queueMicrotask(() => onOptionsChange({ includeComments, includePositions }));
	}, [saves, result, onOptionsChange]);

	// The editor's cards carry the same flight and fix. They are built once
	// per answer, so the editor is not reconfigured on every render, and reach
	// the latest handlers through a ref.
	const handlers = useRef({ pointAt, fixFor });
	useEffect(() => {
		handlers.current = { pointAt, fixFor };
	});
	const reported = result?.diagnostics;
	const findings = useMemo(
		() =>
			(reported ?? []).map((diagnostic) => ({
				severity: diagnostic.severity,
				message: diagnostic.message,
				onGoTo:
					diagnostic.elementIds.length > 0 || diagnostic.location !== undefined
						? () => handlers.current.pointAt(diagnostic)
						: undefined,
				onFix:
					diagnostic.code === "SF-DOC-MISSING"
						? () => handlers.current.fixFor(diagnostic)?.()
						: undefined,
			})),
		[reported],
	);

	// The left edge drags to resize. The width is kept here while the hand is
	// on it and written to the preferences once it lets go.
	const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
		const handle = event.currentTarget;
		const startX = event.clientX;
		const startWidth = width;
		let next = startWidth;

		event.preventDefault();
		handle.setPointerCapture(event.pointerId);
		document.body.classList.add("resizing-columns");

		const reach = panelReach(handle.parentElement?.parentElement);

		const move = (e: PointerEvent) => {
			next = Math.min(
				SQL_PANEL_WIDTH.max,
				reach,
				Math.max(SQL_PANEL_WIDTH.min, startWidth + (startX - e.clientX)),
			);
			setDragWidth(next);
		};
		const stop = () => {
			handle.removeEventListener("pointermove", move);
			handle.removeEventListener("pointerup", stop);
			handle.removeEventListener("pointercancel", stop);
			document.body.classList.remove("resizing-columns");
			setCanvasPreference("sqlPanelWidth", next);
			setDragWidth(null);
		};

		handle.addEventListener("pointermove", move);
		handle.addEventListener("pointerup", stop);
		handle.addEventListener("pointercancel", stop);
	};

	return (
		<AnimatePresence>
			{result && (
				<motion.aside
					key="sql"
					initial={{ x: "100%" }}
					animate={{ x: 0, transition: PANEL_IN }}
					exit={{ x: "100%", transition: PANEL_OUT }}
					style={{ width }}
					aria-label="Generated SQL"
					className="absolute inset-y-0 right-0 z-30 flex max-w-(--side-panel-reach) flex-col overflow-hidden rounded-l-lg border-l border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl will-change-transform"
				>
					<div
						role="separator"
						aria-orientation="vertical"
						aria-label="Resize the SQL panel"
						onPointerDown={startResize}
						className="absolute inset-y-0 left-0 z-10 w-px cursor-col-resize touch-none bg-border transition-colors delay-75 after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 hover:bg-primary active:bg-primary"
					/>

					<PanelTitle
						hidden={caret.topInView || (caret.focused && caret.row >= 1 && caret.row <= 3)}
					>
						{blocked ? "No SQL generated" : "Generated SQL"}
					</PanelTitle>
					<PanelTools held={settingsOpen} onClose={onClose}>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={copied ? "Copied" : "Copy SQL"}
							title={copied ? "Copied" : "Copy"}
							disabled={blocked}
							onClick={() => void copy()}
						>
							{copied ? <CheckIcon className="text-primary" /> : <CopyIcon />}
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Download SQL"
							title="Download"
							disabled={blocked}
							onClick={download}
						>
							<DownloadIcon />
						</Button>
						<Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
							<PopoverTrigger
								render={
									<Button
										variant={settingsOpen ? "secondary" : "ghost"}
										size="icon-sm"
										aria-label="Editor settings"
										title="Settings"
									/>
								}
							>
								<SettingsIcon />
							</PopoverTrigger>
							<PopoverContent align="end" className="relative w-88 gap-3">
								<PopoverHeader>
									<PopoverTitle>Editor</PopoverTitle>
									<PopoverDescription>How the script is written and shown.</PopoverDescription>
								</PopoverHeader>
								<div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-muted/30">
									<SettingRow
										id="sql-vim"
										icon={SiVim}
										label="Vim keys"
										hint="Normal, insert and visual modes."
										checked={sqlVim}
										onCheckedChange={setSqlVim}
									/>
									<SettingRow
										id="sql-comments"
										icon={MessageSquareTextIcon}
										label="Include comments"
										hint="A comment on each description."
										checked={result.includeComments}
										disabled={generating}
										onCheckedChange={(includeComments) =>
											onOptionsChange({
												includeComments,
												includePositions: result.includePositions,
											})
										}
									/>
									<SettingRow
										id="sql-positions"
										icon={MapPinIcon}
										label="Table positions"
										hint="Where each table sits, as comments at the end."
										checked={result.includePositions}
										disabled={generating}
										onCheckedChange={(includePositions) => {
											setCanvasPreference("sqlPositions", includePositions);
											onOptionsChange({
												includeComments: result.includeComments,
												includePositions,
											});
										}}
									/>
									<Setting id="sql-theme" icon={PaletteIcon} label="Theme">
										<Select
											value={sqlTheme}
											onValueChange={(next) => setSqlTheme(next as SqlTheme)}
											onOpenChange={(open) => {
												setThemesOpen(open);
												if (!open) setHovered(null);
											}}
											items={THEME_ITEMS}
										>
											<SelectTrigger id="sql-theme" size="sm" className="w-44 shrink-0">
												<SelectValue>
													{(value: SqlTheme) => <ThemeOption theme={value} />}
												</SelectValue>
											</SelectTrigger>
											<SelectContent alignItemWithTrigger={false} className="max-h-44">
												{SQL_THEME_GROUPS.map((group) => (
													<SelectGroup key={group}>
														<SelectLabel>{group}</SelectLabel>
														{SQL_THEME_ENTRIES.filter((entry) => entry.group === group).map(
															(entry) => (
																<SelectItem
																	key={entry.id}
																	value={entry.id}
																	onMouseEnter={() => setHovered(entry.id)}
																>
																	<ThemeOption theme={entry.id} />
																</SelectItem>
															),
														)}
													</SelectGroup>
												))}
											</SelectContent>
										</Select>
									</Setting>
								</div>
								<AnimatePresence>
									{themesOpen && (
										<motion.div
											key="sample"
											initial={{ opacity: 0, x: 8 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 8 }}
											transition={{ duration: 0.15 }}
											className="absolute right-full bottom-4 mr-3 w-72"
										>
											<ThemePreview palette={sqlThemeOf(hovered ?? sqlTheme).palette} />
										</motion.div>
									)}
								</AnimatePresence>
							</PopoverContent>
						</Popover>
					</PanelTools>

					{blocked ? (
						<div className="flex min-h-0 flex-1 flex-col gap-3 p-3 pt-12">
							<p className="text-sm text-muted-foreground">
								{errors.length > 0
									? "The backend writes no SQL a database would refuse. Fix these first."
									: "There is nothing on the canvas to write SQL for."}
							</p>
							{errors.length > 0 && (
								<ProblemList items={errors} onShow={pointAt} onFix={fixFor} grow />
							)}
						</div>
					) : (
						<SqlEditor
							value={text}
							onChange={(next) => setEdit({ of: ddl, text: next })}
							vim={sqlVim}
							theme={sqlTheme}
							tables={tables}
							problems={findings}
							onCaret={setCaret}
							className="min-h-0 flex-1"
						/>
					)}
				</motion.aside>
			)}
			{describing && (
				<DescribeDialog
					table={describing.table}
					columnIds={describing.columnIds}
					onSave={(next) => describe(describing.table, next)}
					onClose={() => setDescribing(null)}
				/>
			)}
		</AnimatePresence>
	);
});

function ThemeOption({ theme }: { theme: SqlTheme }) {
	const palette = sqlThemeOf(theme).palette;

	return (
		<>
			<span
				aria-hidden
				className="flex h-4 shrink-0 items-center gap-0.5 rounded-sm bg-(--base) px-1 ring-1 ring-foreground/15"
				style={
					{
						"--base": palette.base,
						"--keyword": palette.keyword,
						"--type": palette.type,
						"--string": palette.string,
						"--number": palette.number,
					} as React.CSSProperties
				}
			>
				<span className="size-1.5 rounded-full bg-(--keyword)" />
				<span className="size-1.5 rounded-full bg-(--type)" />
				<span className="size-1.5 rounded-full bg-(--string)" />
				<span className="size-1.5 rounded-full bg-(--number)" />
			</span>
			{SQL_THEMES.find((item) => item.id === theme)?.label}
		</>
	);
}

const INK = "transition-colors duration-200";
const K = `${INK} text-(--keyword)`;
const T = `${INK} text-(--type)`;
const S = `${INK} text-(--string)`;
const N = `${INK} text-(--number)`;
const M = `${INK} text-(--mark)`;

function ThemePreview({ palette }: { palette: Palette }) {
	return (
		<pre
			aria-hidden
			className="overflow-hidden rounded-md bg-(--base) px-3 py-2 font-mono text-xs leading-5 text-(--ink) shadow-md ring-1 ring-foreground/10 transition-colors duration-200"
			style={
				{
					"--base": palette.base,
					"--ink": palette.ink,
					"--keyword": palette.keyword,
					"--type": palette.type,
					"--string": palette.string,
					"--number": palette.number,
					"--mark": palette.mark,
				} as React.CSSProperties
			}
		>
			<span className={K}>CREATE TABLE</span> "users" <span className={M}>(</span>
			{"\n  "}id <span className={T}>uuid</span> <span className={K}>PRIMARY KEY</span>
			<span className={M}>,</span>
			{"\n  "}name <span className={T}>text</span> <span className={K}>DEFAULT</span>{" "}
			<span className={S}>'new'</span>
			<span className={M}>,</span>
			{"\n  "}age <span className={T}>int</span> <span className={K}>CHECK</span>{" "}
			<span className={M}>(</span>age <span className={M}>&gt;</span> <span className={N}>0</span>
			<span className={M}>)</span>
			{"\n"}
			<span className={M}>);</span>
		</pre>
	);
}

// Only the close button stays out. The rest show for a moment on a fresh
// panel, then fold in beside it until the pointer or focus comes back.
function PanelTools({
	held,
	onClose,
	children,
}: {
	held: boolean;
	onClose: () => void;
	children: React.ReactNode;
}) {
	const [wanted, setWanted] = useState(true);
	const folding = useRef<number | undefined>(undefined);

	const show = () => {
		window.clearTimeout(folding.current);
		setWanted(true);
	};

	const hide = (after: number) => {
		window.clearTimeout(folding.current);
		folding.current = window.setTimeout(() => setWanted(false), after);
	};

	useEffect(() => {
		folding.current = window.setTimeout(() => setWanted(false), INTRO);
		return () => window.clearTimeout(folding.current);
	}, []);

	const out = wanted || held;

	return (
		<div
			className="absolute top-2 right-3 z-10 flex items-center rounded-lg bg-sidebar/85 p-0.5 shadow-md ring-1 ring-foreground/10 backdrop-blur"
			onMouseEnter={show}
			onMouseLeave={() => hide(LINGER)}
			onFocus={show}
			onBlur={() => hide(LINGER)}
		>
			<motion.div
				initial={false}
				animate={{ width: out ? "auto" : 0, opacity: out ? 1 : 0 }}
				transition={UNFOLD}
				className="flex items-center justify-end gap-0.5 overflow-hidden"
			>
				{children}
				<span className="w-0.5 shrink-0" />
			</motion.div>
			<Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}>
				<XIcon />
			</Button>
		</div>
	);
}

// A fresh panel holds the title up long enough to be read before it is
// allowed to step aside.
function PanelTitle({ hidden, children }: { hidden: boolean; children: React.ReactNode }) {
	const [introducing, setIntroducing] = useState(true);

	useEffect(() => {
		const done = window.setTimeout(() => setIntroducing(false), 3000);
		return () => window.clearTimeout(done);
	}, []);

	return (
		<span
			className={cn(
				"pointer-events-none absolute top-2 left-3 z-10 flex h-8 items-center gap-1.5 rounded-lg bg-sidebar/70 px-2.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 backdrop-blur transition",
				hidden && !introducing
					? "-translate-y-12 opacity-0 duration-700 ease-glide"
					: "duration-500 ease-out-expo",
			)}
		>
			<FileCodeIcon className="size-3.5 shrink-0" />
			{children}
		</span>
	);
}

function Setting({
	id,
	icon: Icon,
	label,
	hint,
	children,
}: {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-3 px-3 py-2.5">
			<span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-xs ring-1 ring-foreground/10">
				<Icon className="size-4" />
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<Label htmlFor={id} className="cursor-pointer">
					{label}
				</Label>
				{hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
			</div>
			{children}
		</div>
	);
}

function SettingRow({
	id,
	icon,
	label,
	hint,
	checked,
	disabled,
	onCheckedChange,
}: {
	id: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	hint: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<Setting id={id} icon={icon} label={label} hint={hint}>
			<Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
		</Setting>
	);
}

// Shaped like a tour stop, which it is: a title and one sentence, with the
// names in it drawn as chips the way the list draws them.
function ProblemStop({ diagnostic }: { diagnostic: Diagnostic }) {
	return (
		<div className="space-y-1.5 pr-6">
			<h3 className="text-base font-semibold tracking-snug">{problemTitle(diagnostic.code)}</h3>
			<p className="leading-relaxed text-muted-foreground">
				<ProblemMessage text={diagnostic.message} />
			</p>
		</div>
	);
}

function ProblemList({
	items,
	onShow,
	onFix,
	grow = false,
}: {
	items: Diagnostic[];
	onShow: (diagnostic: Diagnostic) => void;
	onFix: (diagnostic: Diagnostic) => (() => void) | undefined;
	/** Fill the panel rather than stopping at a few rows. */
	grow?: boolean;
}) {
	return (
		<ScrollArea
			className={cn(grow ? "min-h-0 flex-1" : "*:data-[slot=scroll-area-viewport]:max-h-64")}
		>
			<ul className="flex flex-col gap-1">
				{items.map((diagnostic, index) => {
					const placed = diagnostic.elementIds.length > 0 || diagnostic.location !== undefined;
					const fix = onFix(diagnostic);

					return (
						<li
							key={`${diagnostic.code}-${index}`}
							className="flex items-start gap-3 rounded-md px-2 py-2"
						>
							<ProblemMark severity={diagnostic.severity} />
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-2 text-sm font-medium">
									{problemTitle(diagnostic.code)}
									<code className={CODE_CHIP}>{diagnostic.code}</code>
								</span>
								<span className="text-xs leading-relaxed text-muted-foreground">
									<ProblemMessage text={diagnostic.message} />
								</span>
							</span>
							<span className="flex shrink-0 items-center gap-1">
								{fix && (
									<Button variant="ghost" size="sm" onClick={fix}>
										<WrenchIcon />
										Quick fix
									</Button>
								)}
								{placed && (
									<Button variant="ghost" size="sm" onClick={() => onShow(diagnostic)}>
										<ScanSearchIcon />
										Show me
									</Button>
								)}
							</span>
						</li>
					);
				})}
			</ul>
		</ScrollArea>
	);
}
