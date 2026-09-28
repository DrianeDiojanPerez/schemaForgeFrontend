import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	DatabaseIcon,
	KeyIcon,
	LayersIcon,
	LinkIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	SearchIcon,
	Table2Icon,
	XIcon,
} from "lucide-react";
import { usePanelRef } from "react-resizable-panels";
import { useHotkey } from "@tanstack/react-hotkeys";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useReveal } from "../hooks/use-reveal";
import { SCHEMA_LIST_WIDTH } from "../lib/canvas-preferences";
import { HOTKEYS } from "../lib/hotkeys";
import { TOUR } from "../lib/tour";
import { DEFAULT_SCHEMA } from "../lib/schema-adapter";
import { schemaGroups, schemaLabel } from "../lib/schema-groups";
import type { SchemaGroup } from "../lib/schema-groups";
import type { ErdNode, ErdTableNode, SchemaAccent } from "../types/erd";
import { schemaAccentText } from "./schema-node";

const CARET = "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200";

const ROW =
	"flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none";

type Choice = {
	schema: string;
	label: string;
	count: number;
	accent: SchemaAccent;
};

function Count({ children }: { children: React.ReactNode }) {
	return (
		<span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{children}</span>
	);
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
	/** The canvas, which is the other half of the split. */
	children: React.ReactNode;
};

/**
 * The same tables as the canvas, listed the way a database client lists them.
 * Reading a wide diagram means panning around it; reading this means scrolling.
 */
// Safari only lately got the real thing, and a frame's wait is close enough.
function whenIdle(run: () => void, options: { timeout: number }): () => void {
	if (typeof window.requestIdleCallback === "function") {
		const handle = window.requestIdleCallback(run, options);
		return () => window.cancelIdleCallback(handle);
	}

	const handle = window.setTimeout(run, 16);
	return () => window.clearTimeout(handle);
}

// A press wants its answer now; only the slide on a fresh load waits.
function rightAway(run: () => void): () => void {
	const handle = window.setTimeout(run, 0);
	return () => window.clearTimeout(handle);
}

// The library makes each panel scroll with a style of its own, which a class
// cannot beat. The toolbar sliding down past the bottom edge was enough to give
// the canvas a scrollbar.
const CLIPPED = { overflow: "hidden" } as const;

type SchemaListProps = {
	name: string;
	nodes: ErdNode[];
	showing: boolean;
	sliding: boolean;
	held: number;
};

const SchemaList = memo(function SchemaList({
	name,
	nodes,
	showing,
	sliding,
	held,
}: SchemaListProps) {
	const { setNodes } = useReactFlow();
	const { goTo, frame } = useReveal();
	const groups = useMemo(() => schemaGroups(nodes), [nodes]);
	const [folded, setFolded] = useState<string[]>([]);
	const [openTable, setOpenTable] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [picked, setPicked] = useState<string | null>(null);
	const [picking, setPicking] = useState(false);
	const box = useRef<HTMLInputElement>(null);

	const toggleSchema = (schema: string) => {
		setFolded((current) =>
			current.includes(schema) ? current.filter((item) => item !== schema) : [...current, schema],
		);
	};

	const reveal = (table: ErdTableNode) => {
		setNodes((current) =>
			current.map((node) =>
				node.selected === (node.id === table.id)
					? node
					: { ...node, selected: node.id === table.id },
			),
		);
		goTo(table);
	};

	const revealSchema = (group: SchemaGroup) => {
		frame(group.tables.map((table) => table.id));
	};

	// The list always shows one schema. Until one is picked, or once the picked
	// one has been emptied off the canvas, that is the first schema there is.
	const current = groups.some((group) => group.name === picked)
		? picked
		: (groups[0]?.name ?? null);

	const pick = (schema: string) => {
		setPicked(schema);
		setPicking(false);
		setFolded((list) => list.filter((item) => item !== schema));
	};

	const term = query.trim().toLowerCase();

	const scope = useMemo(
		() => (current ? groups.filter((group) => group.name === current) : groups),
		[current, groups],
	);

	// A table matches on its own name or on any column's, so searching for a
	// field finds the table holding it.
	const found = useMemo(() => {
		if (!term) return scope;

		return scope
			.map((group) => ({
				...group,
				tables: group.tables.filter(
					(table) =>
						table.data.name.toLowerCase().includes(term) ||
						table.data.columns.some((column) => column.name.toLowerCase().includes(term)),
				),
			}))
			.filter((group) => group.tables.length > 0);
	}, [scope, term]);

	const choices: Choice[] = useMemo(
		() =>
			groups.map((group) => ({
				schema: group.name,
				label: schemaLabel(group.name, name),
				count: group.tables.length,
				accent: group.accent,
			})),
		[groups, name],
	);

	// The filter is the one thing in here worth reaching for without the mouse.
	useHotkey(HOTKEYS.findTable, () => box.current?.select(), {
		enabled: showing,
	});

	return (
		<aside
			aria-hidden={!showing}
			style={sliding ? { width: held } : undefined}
			className={cn(
				"absolute inset-y-0 right-0 flex flex-col bg-sidebar text-sidebar-foreground",
				!sliding && "left-0",
				!showing && "pointer-events-none",
			)}
		>
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
						<span className="flex-1 truncate">{current ? schemaLabel(current, name) : name}</span>
						<ChevronDownIcon
							className={cn(
								"size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
								picking && "rotate-180",
							)}
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

								{choices.map((choice) => (
									<CommandItem
										key={choice.schema}
										value={choice.label}
										data-checked={choice.schema === current}
										onSelect={() => pick(choice.schema)}
										className="h-8"
									>
										<DatabaseIcon className={schemaAccentText(choice.accent)} />
										<span className="flex-1 truncate">{choice.label}</span>
										<Count>
											{choice.count} {choice.count === 1 ? "table" : "tables"}
										</Count>
									</CommandItem>
								))}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
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
				<div className="flex flex-col gap-1 p-2">
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
												<Collapsible
													key={table.id}
													open={openTable === table.id}
													onOpenChange={(next) => setOpenTable(next ? table.id : null)}
												>
													<div
														className={cn(
															"flex h-8 items-center rounded-md pr-2 transition-colors",
															table.selected ? "bg-primary/10" : "hover:bg-sidebar-accent",
														)}
													>
														<CollapsibleTrigger
															aria-label={
																openTable === table.id
																	? `Hide ${table.data.name} columns`
																	: `Show ${table.data.name} columns`
															}
															render={
																<button
																	type="button"
																	className="group/table flex h-full shrink-0 items-center gap-2 rounded-md pl-2 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
																/>
															}
														>
															<ChevronRightIcon
																className={cn(CARET, "group-data-panel-open/table:rotate-90")}
															/>
															<Table2Icon
																className={cn(
																	"size-4 shrink-0 transition-colors",
																	table.selected ? "text-primary" : "text-muted-foreground",
																)}
															/>
														</CollapsibleTrigger>

														<button
															type="button"
															onClick={() => reveal(table)}
															title={`Show ${table.data.name} on the canvas`}
															className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-md pl-2 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
														>
															<span
																className={cn("truncate text-sm", table.selected && "font-medium")}
															>
																{table.data.name}
															</span>
															<Count>{table.data.columns.length}</Count>
														</button>
													</div>

													<CollapsibleContent>
														<Columns table={table} />
													</CollapsibleContent>
												</Collapsible>
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
				</div>
			</ScrollArea>
		</aside>
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
}: SchemaSidebarProps) {
	const listed = useListed(nodes);
	const panel = usePanelRef();
	const measured = useRef(width);
	const [held, setHeld] = useState(width);
	const [sliding, setSliding] = useState(false);
	const [dragging, setDragging] = useState(false);
	// Starts out folded whatever the saved state says, so a list that should
	// be open slides open on a fresh load the way it does from the button.
	const was = useRef(false);
	const first = useRef(true);

	// Open only counts while the list is the chosen grouping, so a panel left
	// open is not still holding a column once the boxes have the canvas.
	const showing = active && open;

	// The library puts the new size on at once, so the fold is a transition
	// left to run on its own. The flag that turns it on is only up for as long
	// as that takes, so a drag straight after is not fighting it.
	useEffect(() => {
		if (was.current === showing) return;

		// The size has to change after the transition is on the panels, or it
		// is put on in one step, and on a fresh load it has to wait for the
		// browser to be free, since a slide begun while the tables are still
		// being measured drops its first frames. What was shown is only settled
		// once the slide is under way, so an effect run that is cut short before
		// then, as the first one is in development, is done over rather than
		// counted.
		let tick = 0;
		const wait = first.current ? whenIdle : rightAway;
		const idle = wait(
			() => {
				tick = requestAnimationFrame(() =>
					requestAnimationFrame(() => {
						was.current = showing;
						first.current = false;
						if (showing) {
							measured.current = width;
							setHeld(width);
						} else {
							setHeld(measured.current);
						}
						setSliding(true);
						if (showing) panel.current?.resize(width);
						else panel.current?.collapse();
						done = window.setTimeout(() => setSliding(false), 550);
					}),
				);
			},
			{ timeout: 1500 },
		);
		let done = 0;

		return () => {
			idle();
			cancelAnimationFrame(tick);
			window.clearTimeout(done);
		};
	}, [showing, width, panel]);

	// The pointer is off the handle as soon as the drag gets going, so the
	// cursor goes on everything until the button comes up.
	useEffect(() => {
		if (!dragging) return;

		document.body.classList.add("resizing-columns");
		const drop = () => setDragging(false);
		window.addEventListener("pointerup", drop);
		window.addEventListener("pointercancel", drop);

		return () => {
			document.body.classList.remove("resizing-columns");
			window.removeEventListener("pointerup", drop);
			window.removeEventListener("pointercancel", drop);
		};
	}, [dragging]);

	return (
		<>
			<ResizablePanelGroup
				orientation="horizontal"
				// The library takes presses this far either side of the handle from
				// the document, while the canvas underneath gets the same press and
				// starts a selection box. The handle is drawn this wide and raised
				// above the canvas, so every press the library takes lands on it.
				resizeTargetMinimumSize={{ coarse: 8, fine: 8 }}
				disableCursor
				className={cn(sliding && "panel-glide")}
				onLayoutChanged={(_, meta) => {
					if (!meta.isUserInteraction || !panel.current) return;

					if (panel.current.isCollapsed()) onOpenChange(false);
					else onWidthChange(Math.round(panel.current.getSize().inPixels));
				}}
			>
				<ResizablePanel
					panelRef={panel}
					collapsible
					collapsedSize={0}
					defaultSize={0}
					minSize={SCHEMA_LIST_WIDTH.min}
					maxSize={SCHEMA_LIST_WIDTH.max}
					groupResizeBehavior="preserve-pixel-size"
					// Sizes are reported while the fold plays out too, and following
					// those would shrink the panel's contents along with it.
					onResize={(size) => {
						if (!sliding && size.inPixels > 0) measured.current = size.inPixels;
					}}
					className="relative h-full"
					style={CLIPPED}
				>
					{/* While the fold plays out this is pinned to the panel's right edge
              at its open width, so it slides out whole instead of squeezing
              what is in it. The rest of the time it simply fills the panel,
              so a drag moves it with the pointer and no render in between. */}
					<SchemaList name={name} nodes={listed} showing={showing} sliding={sliding} held={held} />
				</ResizablePanel>

				<ResizableHandle
					onPointerDown={() => setDragging(true)}
					className={cn("z-10 cursor-col-resize after:w-2", !showing && "hidden")}
				/>

				<ResizablePanel className="h-full" style={CLIPPED}>
					{children}
				</ResizablePanel>
			</ResizablePanelGroup>

			{active && (
				<div id={TOUR.sidebarToggle} className="absolute top-3.75 left-3.75 z-30">
					<Trigger open={showing} onClick={() => onOpenChange(!showing)} />
				</div>
			)}
		</>
	);
}
