import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { AnimatePresence, motion } from "motion/react";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	DatabaseIcon,
	FilePlusIcon,
	KeyIcon,
	LayersIcon,
	LinkIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	SearchIcon,
	Table2Icon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "@tanstack/react-query";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { schemaQueries } from "@/features/schema/api/queries";
import { cn } from "@/lib/utils";

import { useReveal } from "../hooks/use-reveal";
import { SCHEMA_LIST_WIDTH } from "../lib/canvas-preferences";
import { HOTKEYS } from "../lib/hotkeys";
import { TOUR } from "../lib/tour";
import { DEFAULT_SCHEMA } from "../lib/schema-adapter";
import { PANEL_IN, PANEL_OUT, panelReach } from "../lib/side-panel";
import { schemaGroups, schemaLabel } from "../lib/schema-groups";
import type { SchemaGroup } from "../lib/schema-groups";
import type { ErdNode, ErdTableNode } from "../types/erd";
import { schemaAccentText } from "./schema-node";

// The list crossfades over the same curve the panels slide on, quick out
// and soft in, short enough to be over before the loader lifts.
const LIST_SWAP = { duration: 0.2, ease: [0.16, 1, 0.3, 1] } as const;

const CARET = "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200";

const ROW =
	"flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

type Choice = {
	id: string;
	label: string;
	count: number;
};

function Count({ children }: { children: React.ReactNode }) {
	return <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{children}</span>;
}

function Columns({ table }: { table: ErdTableNode }) {
	if (table.data.columns.length === 0) {
		return (
			<p className="mx-3.5 my-0.5 border-l border-sidebar-border py-1.5 pl-4 text-sm text-muted-foreground">
				No columns
			</p>
		);
	}

	return (
		<ul className="mx-3.5 my-0.5 flex flex-col gap-0.5 border-l border-sidebar-border py-0.5 pl-2.5">
			{table.data.columns.map((column) => (
				<li key={column.id} className="flex h-7 min-w-0 items-center gap-2 rounded-md px-2 text-sm">
					{column.isPrimary ? (
						<KeyIcon className="size-3.5 shrink-0 text-chart-4" />
					) : column.isForeignKey ? (
						<LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
					) : (
						<span className="size-3.5 shrink-0" />
					)}
					<span className="truncate">{column.name}</span>
					<Count>{column.format}</Count>
				</li>
			))}
		</ul>
	);
}

function Trigger({ open, onClick }: { open: boolean; onClick: () => void }) {
	const label = open ? "Hide schema list" : "Show schema list";

	return (
		<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
			{open ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
		</Button>
	);
}

export type SchemaSidebarProps = {
	/** Name of the whole diagram, which the tables with no schema of their own
      are listed under. */
	name: string;
	nodes: ErdNode[];
	/** Whether the list is the chosen place for the schemas. Off leaves
      nothing of it on screen, not even the button, because the boxes have the
      canvas instead. */
	active: boolean;
	/** Folding the panel away is the button's doing and nothing else's, so it
      is held out here where the toolbar can step aside for the button. */
	open: boolean;
	onOpenChange: (open: boolean) => void;
	width: number;
	onWidthChange: (width: number) => void;
	/** The canvas, which the list lies over. */
	children: React.ReactNode;
	/** What sits in the canvas's bottom-left corner and steps right of the list. */
	corner?: React.ReactNode;
	/** Id of the stored schema on the canvas. Empty for one not saved yet. */
	schemaId: string;
	/** Goes up each time another diagram is put on the canvas. */
	swap: number;
	onOpenSchema?: (id: string) => void;
	onNewSchema?: () => void;
	/** Deletes the stored schema on the canvas, once the person has agreed to it. */
	onDeleteSchema?: (id: string) => void;
};

/**
 * The same tables as the canvas, listed the way a database client lists them.
 * Reading a wide diagram means panning around it; reading this means scrolling.
 */
// One row per table, kept apart so selecting a table on the canvas redraws
// the two rows that changed rather than every row in the list.
const TableRow = memo(function TableRow({
	table,
	open,
	onToggle,
	onReveal,
}: {
	table: ErdTableNode;
	open: boolean;
	onToggle: (id: string, open: boolean) => void;
	onReveal: (table: ErdTableNode) => void;
}) {
	return (
		<Collapsible open={open} onOpenChange={(next) => onToggle(table.id, next)}>
			<div
				className={cn(
					"flex h-8 items-center rounded-md pr-2 transition-colors",
					table.selected ? "bg-primary/10" : "hover:bg-sidebar-accent",
				)}
			>
				<CollapsibleTrigger
					aria-label={open ? `Hide ${table.data.name} columns` : `Show ${table.data.name} columns`}
					render={
						<button
							type="button"
							className="group/table flex h-full shrink-0 items-center gap-2 rounded-md pl-2 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
						/>
					}
				>
					<ChevronRightIcon className={cn(CARET, "group-data-panel-open/table:rotate-90")} />
					<Table2Icon
						className={cn(
							"size-4 shrink-0 transition-colors",
							table.selected ? "text-primary" : "text-muted-foreground",
						)}
					/>
				</CollapsibleTrigger>

				<button
					type="button"
					onClick={() => onReveal(table)}
					title={`Show ${table.data.name} on the canvas`}
					className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-md pl-2 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
				>
					<span className={cn("truncate text-sm", table.selected && "font-medium")}>
						{table.data.name}
					</span>
					<Count>{table.data.columns.length}</Count>
				</button>
			</div>

			<CollapsibleContent>
				<Columns table={table} />
			</CollapsibleContent>
		</Collapsible>
	);
});

type SchemaListProps = {
	name: string;
	nodes: ErdNode[];
	schemaId: string;
	swap: number;
	onOpenSchema?: (id: string) => void;
	onNewSchema?: () => void;
	onDeleteSchema?: (id: string) => void;
};

const SchemaList = memo(function SchemaList({
	name,
	nodes,
	schemaId,
	swap,
	onOpenSchema,
	onNewSchema,
	onDeleteSchema,
}: SchemaListProps) {
	const { setNodes } = useReactFlow();
	const { goTo, frame } = useReveal();
	const groups = useMemo(() => schemaGroups(nodes), [nodes]);
	const [folded, setFolded] = useState<string[]>([]);
	const [openTable, setOpenTable] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [picking, setPicking] = useState(false);
	// The schema a delete is being asked about stays known after the answer,
	// so the dialog still has a name to show while it fades out.
	const [asked, setAsked] = useState<Choice | null>(null);
	const [confirming, setConfirming] = useState(false);
	const box = useRef<HTMLInputElement>(null);

	const toggleSchema = (schema: string) => {
		setFolded((current) =>
			current.includes(schema) ? current.filter((item) => item !== schema) : [...current, schema],
		);
	};

	const reveal = useCallback(
		(table: ErdTableNode) => {
			setNodes((current) =>
				current.map((node) =>
					node.selected === (node.id === table.id)
						? node
						: { ...node, selected: node.id === table.id },
				),
			);
			goTo(table);
		},
		[setNodes, goTo],
	);

	const toggleTable = useCallback((id: string, next: boolean) => {
		setOpenTable(next ? id : null);
	}, []);

	const revealSchema = (group: SchemaGroup) => {
		frame(group.tables.map((table) => table.id));
	};

	const pick = (id: string) => {
		setPicking(false);
		if (id !== schemaId) onOpenSchema?.(id);
	};

	const term = query.trim().toLowerCase();

	// A table matches on its own name or on any column's, so searching for a
	// field finds the table holding it.
	const found = useMemo(() => {
		if (!term) return groups;

		return groups
			.map((group) => ({
				...group,
				tables: group.tables.filter(
					(table) =>
						table.data.name.toLowerCase().includes(term) ||
						table.data.columns.some((column) => column.name.toLowerCase().includes(term)),
				),
			}))
			.filter((group) => group.tables.length > 0);
	}, [groups, term]);

	// Every schema stored, with the open one counted from the canvas since it
	// can hold tables the backend has not been sent yet. One not stored at
	// all, such as a file just opened, is known to the canvas alone.
	const { data: stored } = useQuery(schemaQueries.list(1, 50));
	const tables = groups.reduce((sum, group) => sum + group.tables.length, 0);

	const choices: Choice[] = useMemo(() => {
		const listed = (stored?.schemas ?? []).map((summary) => ({
			id: summary.id,
			label: summary.name,
			count: summary.id === schemaId ? tables : summary.entityCount,
		}));
		return listed.some((choice) => choice.id === schemaId)
			? listed
			: [{ id: schemaId, label: name, count: tables }, ...listed];
	}, [stored, schemaId, name, tables]);

	// The filter is the one thing in here worth reaching for without the mouse.
	useHotkey(HOTKEYS.findTable, () => box.current?.select());

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Left clear for the button, which stays put while this moves. */}
			<header className="flex h-15.75 shrink-0 items-center border-b border-sidebar-border pr-2 pl-14.5">
				<Popover open={picking} onOpenChange={setPicking}>
					<PopoverTrigger
						id={TOUR.schemaPicker}
						render={
							<button
								type="button"
								className={cn(
									ROW,
									"flex-1 border border-sidebar-border bg-background font-medium hover:bg-sidebar-accent",
								)}
							/>
						}
					>
						<DatabaseIcon className="size-4 shrink-0 text-primary" />
						<span className="flex-1 truncate">{name}</span>
						{/* Turns without a transition. Animating it put the icon on a
                compositor layer of its own for the turn, and the panel's
                own layer was redrawn around it, which flashed the text. */}
						<ChevronDownIcon
							className={cn("size-3.5 shrink-0 text-muted-foreground", picking && "rotate-180")}
						/>
					</PopoverTrigger>

					{/* Held to the trigger width so the list lines up with the button
          instead of hanging over the canvas. */}
					<PopoverContent align="start" sideOffset={6} className="w-(--anchor-width) gap-0 p-0">
						<Command>
							{/* A handful of schemas is read faster than it is searched. */}
							{choices.length > 4 && <CommandInput placeholder="Search schemas" />}
							<CommandList className={cn("max-h-55", choices.length > 4 && "mt-1")}>
								<CommandEmpty className="py-4">No schema found.</CommandEmpty>

								{/* Keyed by id, since two schemas can share a name. The name
                    is what the search reads. */}
								{choices.map((choice) => (
									<CommandItem
										key={choice.id}
										value={choice.id || "unsaved"}
										keywords={[choice.label]}
										onSelect={() => pick(choice.id)}
										className="h-8"
									>
										{/* The open one is told by its colour and weight, the way the
                        button above shows it, rather than by a tick. */}
										<DatabaseIcon
											className={cn(
												choice.id === schemaId ? "text-primary!" : "text-muted-foreground",
											)}
										/>
										<span
											className={cn(
												"min-w-0 flex-1 truncate",
												choice.id === schemaId && "font-medium",
											)}
										>
											{choice.label}
										</span>
										{onDeleteSchema && choice.id && (
											<button
												type="button"
												aria-label={`Delete ${choice.label}`}
												title="Delete"
												onClick={(event) => {
													event.stopPropagation();
													setPicking(false);
													setAsked(choice);
													setConfirming(true);
												}}
												className="-my-1 -ml-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/command-item:opacity-100 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none"
											>
												<Trash2Icon className="size-3.5" />
											</button>
										)}
										{/* The shortcut slot, so the row's own tick stays out of the end. */}
										<span
											data-slot="command-shortcut"
											className="shrink-0 text-xs text-muted-foreground tabular-nums"
										>
											{choice.count} {choice.count === 1 ? "table" : "tables"}
										</span>
									</CommandItem>
								))}

								{onNewSchema && (
									<>
										<CommandSeparator className="my-1" />
										{/* Stays put while the search is on, since it is a way out
                    of the list rather than one of its entries. */}
										<CommandItem
											data-tour={TOUR.newSchema}
											forceMount
											value="new-schema"
											onSelect={() => {
												setPicking(false);
												onNewSchema();
											}}
											className="h-8"
										>
											<FilePlusIcon className="text-muted-foreground" />
											<span className="flex-1 truncate">New schema</span>
										</CommandItem>
									</>
								)}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>

				{onDeleteSchema && (
					<AlertDialog open={confirming} onOpenChange={setConfirming}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete this schema?</AlertDialogTitle>
								<AlertDialogDescription>
									The schema and every table in it are removed for everyone. There is no undo.
								</AlertDialogDescription>
							</AlertDialogHeader>

							{/* What is about to go, named, so a slip of the pointer in the
                  list is caught here rather than found out later. */}
							<div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-xs ring-1 ring-foreground/10">
									<DatabaseIcon className="size-4" />
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate text-sm font-medium">{asked?.label}</span>
									<span className="text-xs text-muted-foreground">
										{asked?.count === 0
											? "No tables yet"
											: `${asked?.count} table${asked?.count === 1 ? "" : "s"}`}
									</span>
								</span>
							</div>

							<AlertDialogFooter>
								<AlertDialogCancel>Keep it</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onClick={() => {
										setConfirming(false);
										if (asked) onDeleteSchema(asked.id);
									}}
								>
									<Trash2Icon />
									Delete schema
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</header>

			<div className="shrink-0 border-b border-sidebar-border p-2">
				<InputGroup id={TOUR.search} variant="flat" className="h-8">
					<InputGroupAddon>
						<SearchIcon className="size-4" />
					</InputGroupAddon>
					<InputGroupInput
						ref={box}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search tables"
						aria-label="Search tables"
						className="h-8 text-sm md:text-sm"
					/>
					{query && (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								aria-label="Clear search"
								onClick={() => setQuery("")}
							>
								<XIcon />
							</InputGroupButton>
						</InputGroupAddon>
					)}
				</InputGroup>
			</div>

			<ScrollArea id={TOUR.tableList} className="min-h-0 flex-1">
				{/* Keyed on the swap, so another diagram arriving fades the whole
				    list out and in with the loader, while a table added or taken
				    away on its own just appears in place. */}
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={swap}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={LIST_SWAP}
						className="flex flex-col gap-1 p-2"
					>
						{found.map((group, index) => {
							const label = schemaLabel(group.name, name);

							// The picker above already names the diagram, so the row for
							// the tables that carry no schema of their own says what it
							// holds instead of saying that name a second time.
							const heading = group.name === DEFAULT_SCHEMA ? "Tables" : label;
							const unfolded = Boolean(term) || !folded.includes(group.name);

							return (
								<div key={group.name}>
									{index > 0 && <div className="mx-2 my-1 h-px bg-sidebar-border" />}

									<Collapsible open={unfolded} onOpenChange={() => toggleSchema(group.name)}>
										<div className="sticky top-0 z-10 flex h-8 items-center rounded-md bg-sidebar pr-2 transition-colors hover:bg-sidebar-accent">
											<CollapsibleTrigger
												aria-label={unfolded ? `Hide ${label} tables` : `Show ${label} tables`}
												render={
													<button
														type="button"
														className="group/schema flex h-full shrink-0 items-center rounded-md px-2 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
													/>
												}
											>
												<ChevronRightIcon
													className={cn(CARET, "group-data-panel-open/schema:rotate-90")}
												/>
											</CollapsibleTrigger>

											<button
												type="button"
												onClick={() => revealSchema(group)}
												title={`Show ${label} on the canvas`}
												className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
											>
												<LayersIcon
													className={cn("size-4 shrink-0", schemaAccentText(group.accent))}
												/>
												<span className="truncate text-sm font-medium text-muted-foreground">
													{heading}
												</span>
												<Count>{group.tables.length}</Count>
											</button>
										</div>

										<CollapsibleContent>
											<div className="flex flex-col gap-0.5 pt-0.5">
												{group.tables.map((table) => (
													<TableRow
														key={table.id}
														table={table}
														open={openTable === table.id}
														onToggle={toggleTable}
														onReveal={reveal}
													/>
												))}
											</div>
										</CollapsibleContent>
									</Collapsible>
								</div>
							);
						})}

						{found.length === 0 && (
							<Empty size="sm">
								<EmptyHeader>
									<EmptyMedia variant="icon" className="mb-1 size-9">
										{term ? <SearchIcon /> : <Table2Icon />}
									</EmptyMedia>
									<EmptyTitle>{term ? "Nothing found" : "No tables yet"}</EmptyTitle>
									<EmptyDescription>
										{term
											? `No table or column matches ${query.trim()}.`
											: "Right-click the canvas to make one."}
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						)}
					</motion.div>
				</AnimatePresence>
			</ScrollArea>
		</div>
	);
});

// Dragging a table hands over a new array every frame with only positions
// changed, which the list does not show. It keeps the one it has until a
// table is added, removed, renamed or selected.
function useListed(nodes: ErdNode[]): ErdNode[] {
	const [kept, setKept] = useState(nodes);
	const same =
		kept === nodes ||
		(kept.length === nodes.length &&
			kept.every(
				(node, index) =>
					node.id === nodes[index].id &&
					node.data === nodes[index].data &&
					node.selected === nodes[index].selected &&
					node.parentId === nodes[index].parentId,
			));
	if (same) return kept;

	setKept(nodes);

	return nodes;
}

export function SchemaSidebar({
	name,
	nodes,
	active,
	open,
	onOpenChange,
	width,
	onWidthChange,
	children,
	corner,
	schemaId,
	swap,
	onOpenSchema,
	onNewSchema,
	onDeleteSchema,
}: SchemaSidebarProps) {
	const listed = useListed(nodes);
	// The width while the edge is being dragged, and the saved one otherwise.
	const [dragWidth, setDragWidth] = useState<number | null>(null);
	// Where the list's edge really is, read off the panel, since the saved
	// width can be held back by the cap. Zero once the panel has gone.
	const [edge, setEdge] = useState(0);
	const watcher = useRef<ResizeObserver | null>(null);
	const watch = useCallback((aside: HTMLElement | null) => {
		watcher.current?.disconnect();
		watcher.current = null;

		if (!aside) {
			setEdge(0);
			return;
		}

		setEdge(aside.offsetWidth);
		watcher.current = new ResizeObserver(() => setEdge(aside.offsetWidth));
		watcher.current.observe(aside);
	}, []);

	// A list open from a saved setting slides in on a fresh load the way it
	// does from the button, but only once the browser is free: a slide begun
	// while the tables are still being measured drops its first frames.
	const [settled, setSettled] = useState(false);
	useEffect(() => {
		if (typeof window.requestIdleCallback !== "function") {
			const handle = window.setTimeout(() => setSettled(true), 100);
			return () => window.clearTimeout(handle);
		}

		const handle = window.requestIdleCallback(() => setSettled(true), { timeout: 1500 });
		return () => window.cancelIdleCallback(handle);
	}, []);

	// Open only counts while the list is the chosen grouping, so a panel left
	// open is not still holding a column once the boxes have the canvas.
	const showing = active && open && settled;

	// The right edge drags to resize. The width is kept here while the hand is
	// on it and written to the preferences once it lets go.
	const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
		const handle = event.currentTarget;
		const startX = event.clientX;
		const startWidth = dragWidth ?? width;
		let next = startWidth;

		event.preventDefault();
		handle.setPointerCapture(event.pointerId);
		document.body.classList.add("resizing-columns");

		const reach = panelReach(handle.parentElement?.parentElement);

		const move = (e: PointerEvent) => {
			next = Math.min(
				SCHEMA_LIST_WIDTH.max,
				reach,
				Math.max(SCHEMA_LIST_WIDTH.min, startWidth + (e.clientX - startX)),
			);
			setDragWidth(next);
		};
		const stop = () => {
			handle.removeEventListener("pointermove", move);
			handle.removeEventListener("pointerup", stop);
			handle.removeEventListener("pointercancel", stop);
			document.body.classList.remove("resizing-columns");
			onWidthChange(Math.round(next));
			setDragWidth(null);
		};

		handle.addEventListener("pointermove", move);
		handle.addEventListener("pointerup", stop);
		handle.addEventListener("pointercancel", stop);
	};

	return (
		<>
			<div className="h-full w-full">{children}</div>

			<AnimatePresence>
				{showing && (
					<motion.aside
						key="list"
						ref={watch}
						initial={{ x: "-100%" }}
						animate={{ x: 0, transition: PANEL_IN }}
						exit={{ x: "-100%", transition: PANEL_OUT }}
						style={{ width: dragWidth ?? width }}
						aria-label="Schema list"
						className="absolute inset-y-0 left-0 z-30 flex max-w-(--side-panel-reach) flex-col overflow-hidden rounded-r-lg border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl will-change-transform"
					>
						<div
							role="separator"
							aria-orientation="vertical"
							aria-label="Resize the schema list"
							onPointerDown={startResize}
							className="absolute inset-y-0 right-0 z-10 w-px cursor-col-resize touch-none bg-border transition-colors delay-75 after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 hover:bg-primary active:bg-primary"
						/>
						<SchemaList
							name={name}
							nodes={listed}
							schemaId={schemaId}
							swap={swap}
							onOpenSchema={onOpenSchema}
							onNewSchema={onNewSchema}
							onDeleteSchema={onDeleteSchema}
						/>
					</motion.aside>
				)}
			</AnimatePresence>

			{corner && (
				<motion.div
					initial={false}
					animate={{ left: (showing ? edge : 0) + 15 }}
					// Rides the panel's slide on the same curve either way, and sits
					// under the hand while the edge is being dragged.
					transition={dragWidth !== null ? { duration: 0 } : showing ? PANEL_IN : PANEL_OUT}
					className="absolute bottom-3.75 z-20"
				>
					{corner}
				</motion.div>
			)}

			{active && (
				<div id={TOUR.sidebarToggle} className="absolute top-3.75 left-3.75 z-30">
					<Trigger open={showing} onClick={() => onOpenChange(!showing)} />
				</div>
			)}
		</>
	);
}
