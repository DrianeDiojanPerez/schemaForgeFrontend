import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { AnimatePresence, motion } from "motion/react";
import type { NodeProps } from "@xyflow/react";
import {
	AlertTriangle,
	BugIcon,
	ChevronDownIcon,
	Circle,
	CircleAlert,
	CircleSlash2,
	CopyIcon,
	Database,
	FileTextIcon,
	Fingerprint,
	Hash,
	Key,
	Link2,
	PencilIcon,
	PlusIcon,
	Table2,
	Trash2Icon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { useReveal } from "../hooks/use-reveal";
import { postgresTypeGroups } from "../lib/postgres-types";
import { TABLE_NODE_WIDTH } from "../lib/node-dimensions";
import { typeLabel } from "../lib/type-parameters";
import type { ErdTableNode, TableColumn } from "../types/erd";
import { useConnectorArrows } from "./connector-arrow-context";
import { ColumnDetailsDialog, DescriptionDialog } from "./details-dialogs";
import { useGraphActions } from "./graph-actions-context";
import { ProblemMark, ProblemMessage, problemTitle } from "./problem-text";
import { useNodeProblems } from "./problems-context";

const HIDDEN_CONNECTOR = "h-px! w-px! min-w-0! min-h-0! cursor-grab! border-0! opacity-0!";
const ITEM_HEIGHT = "h-5.5";
const SIDES = ["left", "right", "top", "bottom"] as const;

/**
 * Faint while the row is under the pointer and solid once the pointer reaches
 * the arrow itself, so the row says a link can start here and the arrow says
 * dragging now is what starts it.
 *
 * `connectingfrom` is React Flow's mark on the handle a drag started from. It
 * holds the arrow up for the length of the drag, which the row hover cannot do
 * once the pointer has left the row.
 */
const COLUMN_CONNECTOR =
	"flex! size-2.25! min-w-0! min-h-0! items-center justify-center rounded-none! border-0! bg-transparent! text-primary opacity-0 transition-opacity duration-150 group-hover/column:opacity-40 hover:opacity-100! [&.connectingfrom]:opacity-100!";

// Far enough out to clear the border the row draws, so the arrow reads as
// leaving the table rather than sitting on its edge.
const CONNECTOR_OFFSET: Partial<Record<(typeof SIDES)[number], string>> = {
	left: "-left-[6px]!",
	right: "-right-[6px]!",
};

const HANDLE_POSITION = {
	left: Position.Left,
	right: Position.Right,
	top: Position.Top,
	bottom: Position.Bottom,
};

// Spelled out rather than built from the side, so Tailwind's scanner can
// still find these class names in the source.
const HANDLE_OFFSET = {
	left: "left-0!",
	right: "right-0!",
	top: "top-0!",
	bottom: "bottom-0!",
};

function ColumnTypeCombobox({
	nodeId,
	value,
	label,
	onValueChange,
}: {
	nodeId: string;
	value: string;
	label: string;
	onValueChange: (value: string) => void;
}) {
	const { bringCloser } = useReveal();
	const [open, setOpen] = useState(false);

	// A column imported from SQL can carry a type the picker does not list. It
	// gets a group of its own so the current value stays selectable.
	const groups = useMemo(() => {
		if (postgresTypeGroups.some((group) => group.types.includes(value))) {
			return postgresTypeGroups;
		}
		return [{ label: "Current", types: [value] }, ...postgresTypeGroups];
	}, [value]);

	// Far enough out, the table is smaller than the popup it anchors. Bring the
	// table up to size first, then open, since the popup would not follow its
	// trigger through the camera animation.
	const openAtReadableZoom = () => {
		const coming = bringCloser(nodeId);

		if (coming) void coming.then(() => setOpen(true));
		else setOpen(true);
	};

	return (
		<Popover open={open} onOpenChange={(next) => (next ? openAtReadableZoom() : setOpen(false))}>
			{/* Closing with Escape hands focus back to the trigger, and the browser
          ring is far too heavy at this size. The text stands in for it. */}
			<PopoverTrigger className="nodrag nopan flex h-4 items-center gap-0.5 rounded-sm px-1 text-4xs text-muted-foreground transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-none">
				{label}
				<ChevronDownIcon className="size-2" />
			</PopoverTrigger>
			<PopoverContent align="end" className="w-48 gap-0 p-0">
				<Command>
					<CommandInput placeholder="Search types..." />
					<CommandList>
						<CommandEmpty>No type found.</CommandEmpty>
						{groups.map((group) => (
							<CommandGroup key={group.label} heading={group.label}>
								{group.types.map((type) => (
									<CommandItem
										key={type}
										value={type}
										data-checked={type === value}
										onSelect={() => {
											onValueChange(type);
											setOpen(false);
										}}
									>
										{type}
									</CommandItem>
								))}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

type ColumnFlag = {
	key: string;
	label: string;
	icon: LucideIcon;
	className: string;
	filled?: boolean;
	onClick?: () => void;
};

const columnFlags = (column: TableColumn, toggleNullable: () => void): ColumnFlag[] => {
	const flags: ColumnFlag[] = [];

	if (column.isPrimary) {
		flags.push({
			key: "primary",
			label: "Primary key",
			icon: Key,
			className: "text-primary",
		});
	}

	if (column.isForeignKey) {
		flags.push({
			key: "foreign",
			label: "Foreign key",
			icon: Link2,
			className: "text-chart-3",
		});
	}

	if (column.isNullable) {
		flags.push({
			key: "nullable",
			label: "Nullable",
			icon: CircleSlash2,
			className: "text-muted-foreground",
			onClick: toggleNullable,
		});
	} else if (!column.isPrimary) {
		flags.push({
			key: "not-null",
			label: "Not null",
			icon: Circle,
			className: "text-foreground",
			filled: true,
			onClick: toggleNullable,
		});
	}

	if (column.isUnique) {
		flags.push({
			key: "unique",
			label: "Unique",
			icon: Fingerprint,
			className: "text-chart-2",
		});
	}

	if (column.isIdentity) {
		flags.push({
			key: "identity",
			label: "Identity",
			icon: Hash,
			className: "text-chart-4",
		});
	}

	return flags;
};

function Table({ id, data }: NodeProps<ErdTableNode>) {
	const { updateNodeData } = useReactFlow<ErdTableNode>();
	const { addColumn, copyTable, removeTable, removeColumn } = useGraphActions();
	const problems = useNodeProblems(id);
	const failing = problems.some((problem) => problem.severity === "ERROR");
	const arrows = useConnectorArrows();
	const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [editingTableName, setEditingTableName] = useState(false);
	const [tableNameValue, setTableNameValue] = useState("");
	const [editingDetails, setEditingDetails] = useState<
		{ kind: "table" } | { kind: "column"; columnId: string } | null
	>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const tableNameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editingColumnId && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [editingColumnId]);

	useEffect(() => {
		if (editingTableName && tableNameInputRef.current) {
			tableNameInputRef.current.focus();
			tableNameInputRef.current.select();
		}
	}, [editingTableName]);

	const saveTableName = () => {
		const next = tableNameValue.trim();
		if (next && next !== data.name) {
			updateNodeData(id, { name: next });
		}
		setEditingTableName(false);
	};

	const updateColumn = (columnId: string, patch: Partial<TableColumn>) => {
		updateNodeData(id, (node) => ({
			columns: node.data.columns.map((col) => (col.id === columnId ? { ...col, ...patch } : col)),
		}));
	};

	const saveColumnName = (columnId: string) => {
		const next = editValue.trim();
		const current = data.columns.find((c) => c.id === columnId)?.name;
		if (next && next !== current) {
			updateColumn(columnId, { name: next });
		}
		setEditingColumnId(null);
	};

	// A primary key can never be null, the same rule the backend model holds,
	// so turning the key on also turns nullable off.
	const togglePrimaryKey = (column: TableColumn) => {
		updateColumn(
			column.id,
			column.isPrimary ? { isPrimary: false } : { isPrimary: true, isNullable: false },
		);
	};

	const detailsColumn =
		editingDetails?.kind === "column"
			? data.columns.find((col) => col.id === editingDetails.columnId)
			: undefined;

	if (data.isForeign) {
		return (
			<Badge variant="secondary" className="relative h-auto rounded-sm py-1 text-3xs">
				{data.name}
				<Handle
					type="target"
					id={data.name}
					position={Position.Left}
					className={HIDDEN_CONNECTOR}
				/>
			</Badge>
		);
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger
				render={
					<Card
						// Card clips by default, which would cut the column connectors off
						// at the border they are meant to reach past. The corners the
						// clipping was rounding are rounded by the header and the button
						// that sit in them.
						className="w-max gap-0 overflow-visible rounded-lg py-0 shadow-lg transition-all hover:shadow-xl"
						style={{ minWidth: TABLE_NODE_WIDTH / 2 }}
					/>
				}
			>
				<header
					className={cn(
						"relative flex items-center rounded-t-lg bg-muted pr-1 pl-2 text-3xs",
						ITEM_HEIGHT,
					)}
				>
					<div className="flex items-center gap-x-1 whitespace-nowrap">
						<Table2 strokeWidth={1.5} size={12} className="text-foreground" />
						{/* The invisible sizer span sets the wrapper width from the current
              text, so swapping between the label and the input does not move
              anything by a pixel. */}
						<div className="relative inline-block h-5 min-w-2 pr-0.75 text-3xs leading-5 font-medium text-foreground">
							<span aria-hidden="true" className="invisible block whitespace-pre">
								{editingTableName ? tableNameValue || " " : data.name || " "}
							</span>
							{editingTableName ? (
								<input
									ref={tableNameInputRef}
									type="text"
									value={tableNameValue}
									onChange={(e) => setTableNameValue(e.target.value)}
									onBlur={saveTableName}
									onKeyDown={(e) => {
										if (e.key === "Enter") saveTableName();
										else if (e.key === "Escape") setEditingTableName(false);
									}}
									onClick={(e) => e.stopPropagation()}
									// The pixel of padding is what keeps the name still as the
									// label gives way to the input. An input centres its text in
									// its own box and pays no attention to line height, so it
									// lands a pixel below the label it stands in for.
									className="absolute inset-0 m-0 h-full w-full border-0 bg-transparent p-0 pb-px text-3xs leading-5 font-medium text-foreground caret-primary outline-none focus:ring-0"
								/>
							) : (
								<span
									className="absolute inset-y-0 left-0 cursor-pointer whitespace-pre transition hover:text-primary"
									onDoubleClick={() => {
										setTableNameValue(data.name);
										setEditingTableName(true);
									}}
								>
									{data.name}
								</span>
							)}
						</div>
					</div>

					{/* Comes into focus the way the tour's icon does, and blurs away
              again once the table is clean. */}
					<AnimatePresence>
						{problems.length > 0 && (
							<motion.div
								key="problems"
								initial={{ opacity: 0, scale: 0.7, filter: "blur(4px)" }}
								animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
								exit={{ opacity: 0, scale: 0.7, filter: "blur(4px)" }}
								transition={{ duration: 0.4, ease: "easeOut" }}
								className="ml-auto flex shrink-0 origin-right"
							>
								<Popover>
									{/* Hover to glance, click to hold it open while working. The
                  click stays here, or the canvas would zoom in on the table. */}
									<PopoverTrigger
										openOnHover
										delay={150}
										onClick={(event) => event.stopPropagation()}
										aria-label={`${problems.length} ${problems.length === 1 ? "problem" : "problems"}`}
										className={cn(
											"nodrag flex h-4 shrink-0 items-center gap-0.5 rounded-full pr-1.5 pl-1 tabular-nums transition-colors",
											failing
												? "text-destructive hover:bg-destructive/10 data-popup-open:bg-destructive/10"
												: "text-warning hover:bg-warning/10 data-popup-open:bg-warning/10",
										)}
									>
										{failing ? (
											<CircleAlert strokeWidth={2} size={10} />
										) : (
											<AlertTriangle strokeWidth={2} size={10} />
										)}
										{problems.length}
									</PopoverTrigger>

									<PopoverContent align="end" sideOffset={6} className="w-80 gap-0 p-0">
										<header className="flex items-center gap-2 border-b border-border px-3 py-2">
											<span className="flex items-center gap-1.5 text-sm font-medium">
												<BugIcon className="size-3.5" />
												Diagnostics
											</span>
											<span className="ml-auto text-xs text-muted-foreground">
												{problems.length} {problems.length === 1 ? "problem" : "problems"}
											</span>
										</header>
										<ul className="flex flex-col gap-0.5 p-1">
											{problems.map((problem) => (
												<li
													key={problem.code + problem.message}
													className="flex items-start gap-3 rounded-sm px-2.5 py-2.5"
												>
													<ProblemMark severity={problem.severity} />
													<span className="flex min-w-0 flex-1 flex-col gap-1">
														<span className="text-sm font-medium">
															{problemTitle(problem.code)}
														</span>
														<span className="text-xs leading-relaxed text-muted-foreground">
															<ProblemMessage text={problem.message} />
														</span>
													</span>
												</li>
											))}
										</ul>
									</PopoverContent>
								</Popover>
							</motion.div>
						)}
					</AnimatePresence>
				</header>

				{data.columns.map((column) => (
					<ContextMenu key={column.id}>
						<ContextMenuTrigger
							render={
								<div
									className={cn(
										"group/column relative flex flex-row justify-items-start border-t border-border bg-card text-4xs leading-5 transition hover:bg-muted",
										editingColumnId === column.id ? "cursor-text" : "cursor-default",
										ITEM_HEIGHT,
									)}
								/>
							}
						>
							<div className="mx-2 flex min-w-10 items-center justify-start gap-1 align-middle">
								{columnFlags(column, () =>
									updateColumn(column.id, { isNullable: !column.isNullable }),
								).map((flag) => (
									<Tooltip key={flag.key}>
										<TooltipTrigger
											render={
												flag.onClick ? (
													<button
														type="button"
														aria-label={flag.label}
														className="nodrag nopan flex shrink-0 cursor-pointer items-center transition hover:opacity-60"
														onClick={flag.onClick}
													/>
												) : (
													<span className="flex shrink-0 items-center" />
												)
											}
										>
											<flag.icon
												size={8}
												strokeWidth={1.5}
												fill={flag.filled ? "currentColor" : "none"}
												className={flag.className}
											/>
										</TooltipTrigger>
										<TooltipContent>{flag.label}</TooltipContent>
									</Tooltip>
								))}
							</div>

							<div className="flex w-full items-center justify-between gap-3 pr-1">
								<div className="relative inline-block h-5 min-w-2 pr-0.75 text-4xs leading-5 font-medium">
									<span aria-hidden="true" className="invisible block whitespace-pre">
										{editingColumnId === column.id ? editValue || " " : column.name || " "}
									</span>
									{editingColumnId === column.id ? (
										<input
											ref={inputRef}
											type="text"
											value={editValue}
											onChange={(e) => setEditValue(e.target.value)}
											onBlur={() => saveColumnName(column.id)}
											onKeyDown={(e) => {
												if (e.key === "Enter") saveColumnName(column.id);
												else if (e.key === "Escape") setEditingColumnId(null);
											}}
											onClick={(e) => e.stopPropagation()}
											className="absolute inset-0 m-0 h-full w-full border-0 bg-transparent p-0 text-4xs leading-5 font-medium text-foreground caret-primary outline-none focus:ring-0"
										/>
									) : (
										<span
											className="absolute inset-y-0 left-0 cursor-pointer whitespace-pre text-foreground transition hover:text-primary"
											onDoubleClick={() => {
												setEditingColumnId(column.id);
												setEditValue(column.name);
											}}
										>
											{column.name}
										</span>
									)}
								</div>

								<ColumnTypeCombobox
									nodeId={id}
									value={column.format}
									label={typeLabel(column)}
									onValueChange={(format) => updateColumn(column.id, { format })}
								/>
							</div>

							{SIDES.map((side) => {
								// Only the two sides an edge is routed along are drawn. Top and
								// bottom stay where they are as targets and stay invisible.
								const Arrow =
									side === "left" ? arrows.left : side === "right" ? arrows.right : undefined;

								return (
									<div key={side}>
										<Handle
											type="target"
											id={`${column.id}-${side}`}
											position={HANDLE_POSITION[side]}
											className={cn(HIDDEN_CONNECTOR, HANDLE_OFFSET[side])}
										/>
										<Handle
											type="source"
											id={`${column.id}-${side}`}
											position={HANDLE_POSITION[side]}
											className={
												Arrow
													? cn(COLUMN_CONNECTOR, CONNECTOR_OFFSET[side])
													: cn(HIDDEN_CONNECTOR, HANDLE_OFFSET[side])
											}
										>
											{Arrow && (
												<Arrow
													size={9}
													strokeWidth={2.5}
													fill={arrows.filled ? "currentColor" : "none"}
													className="pointer-events-none"
												/>
											)}
										</Handle>
									</div>
								);
							})}
						</ContextMenuTrigger>

						<ContextMenuContent>
							<ContextMenuItem
								onClick={() => {
									setEditingColumnId(column.id);
									setEditValue(column.name);
								}}
							>
								<PencilIcon />
								Rename column
							</ContextMenuItem>
							<ContextMenuItem
								onClick={() => setEditingDetails({ kind: "column", columnId: column.id })}
							>
								<FileTextIcon />
								Edit details
							</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuCheckboxItem
								checked={column.isPrimary}
								onCheckedChange={() => togglePrimaryKey(column)}
							>
								Primary key
							</ContextMenuCheckboxItem>
							<ContextMenuCheckboxItem
								checked={column.isUnique}
								onCheckedChange={(checked) => updateColumn(column.id, { isUnique: checked })}
							>
								Unique
							</ContextMenuCheckboxItem>
							<ContextMenuCheckboxItem
								checked={column.isNullable}
								disabled={column.isPrimary}
								onCheckedChange={(checked) => updateColumn(column.id, { isNullable: checked })}
							>
								Nullable
							</ContextMenuCheckboxItem>
							<ContextMenuSeparator />
							<ContextMenuItem onClick={() => addColumn(id)}>
								<PlusIcon />
								Add column
							</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem variant="destructive" onClick={() => removeColumn(id, column.id)}>
								<Trash2Icon />
								Delete column
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				))}

				{data.indexes && data.indexes.length > 0 && (
					<div className="border-t-2 border-border bg-muted">
						<div className="flex items-center gap-1 px-2 py-1">
							<Database size={8} className="text-muted-foreground" />
							<span className="text-5xs font-medium text-muted-foreground">INDEXES</span>
						</div>
						{data.indexes.map((index) => (
							<div
								key={index.name}
								className="border-t border-border px-2 py-1 text-5xs transition hover:bg-muted"
							>
								<div className="flex items-center justify-between">
									<span className="font-mono text-foreground">{index.name}</span>
									<span className="text-muted-foreground uppercase">{index.type}</span>
								</div>
								<div className="text-muted-foreground">({index.columns.join(", ")})</div>
							</div>
						))}
					</div>
				)}

				{data.columns.length === 0 && (
					<div className="py-3 text-center text-4xs text-muted-foreground">No columns yet</div>
				)}

				<button
					type="button"
					className="nodrag nopan flex items-center justify-center gap-1 rounded-b-lg border-t border-border py-1 text-4xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
					onClick={() => addColumn(id)}
				>
					<PlusIcon size={8} strokeWidth={2} />
					Add column
				</button>
			</ContextMenuTrigger>

			<ContextMenuContent>
				<ContextMenuItem onClick={() => addColumn(id)}>
					<PlusIcon />
					Add column
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() => {
						setTableNameValue(data.name);
						setEditingTableName(true);
					}}
				>
					<PencilIcon />
					Rename table
				</ContextMenuItem>
				<ContextMenuItem onClick={() => setEditingDetails({ kind: "table" })}>
					<FileTextIcon />
					Edit description
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onClick={() => copyTable(data)}>
					<CopyIcon />
					Copy table
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem variant="destructive" onClick={() => removeTable(id)}>
					<Trash2Icon />
					Delete table
				</ContextMenuItem>
			</ContextMenuContent>

			{editingDetails?.kind === "table" && (
				<DescriptionDialog
					title="Table description"
					subject={data.name}
					details={{ description: data.description }}
					onSave={({ description }) => updateNodeData(id, { description })}
					onClose={() => setEditingDetails(null)}
				/>
			)}

			{detailsColumn && (
				<ColumnDetailsDialog
					tableName={data.name}
					column={detailsColumn}
					onSave={(patch) => updateColumn(detailsColumn.id, patch)}
					onClose={() => setEditingDetails(null)}
				/>
			)}
		</ContextMenu>
	);
}

/**
 * React Flow hands a node its position again on every frame of a drag, and
 * nothing here draws it: the wrapper around this is what moves. Comparing only
 * what this reads keeps the columns, their menus and their type pickers off
 * the work list while a table is being moved.
 */
export const TableNode = memo(
	Table,
	(before, after) => before.id === after.id && before.data === after.data,
);
