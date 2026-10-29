import type * as React from "react";
import { memo, useCallback, useMemo, useState } from "react";
import { EdgeLabelRenderer, Position, useReactFlow, useStore } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { FileTextIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useHeldSides } from "../hooks/use-held-sides";
import { edgeDash, planRoute, END_GAP } from "../lib/edge-lines";
import type { Side } from "../lib/edge-lines";
import type { ErdEdge, RelationshipType } from "../types/erd";
import { DescriptionDialog } from "./details-dialogs";
import { useCanvasPreferences } from "../lib/canvas-preferences";
import { useEdgeStyle } from "./edge-line-context";
import { ProblemCount } from "./problem-text";
import { useElementProblems } from "./problems-context";
import type { Diagnostic } from "@/features/schema/types/schema";

const FALLBACK_TABLE_WIDTH = 160;

// What a line cut across by a loop costs, as pixels of hidden line. A
// crossing is worse than a short run under a table and better than a long
// one, which this is pitched between.
const CROSSING = 30;

const RELATIONSHIPS: Record<
	RelationshipType,
	{ symbol: string; label: string; text: string; stroke: string }
> = {
	"one-to-one": {
		symbol: "1:1",
		label: "One to One",
		text: "text-chart-2",
		stroke: "var(--chart-2)",
	},
	"one-to-many": {
		symbol: "1:N",
		label: "One to Many",
		text: "text-primary",
		stroke: "var(--primary)",
	},
	"many-to-many": {
		symbol: "N:M",
		label: "Many to Many",
		text: "text-chart-5",
		stroke: "var(--chart-5)",
	},
};

const RELATIONSHIP_ORDER: RelationshipType[] = ["one-to-one", "one-to-many", "many-to-many"];

/** A line with an error is drawn in red. A warning only gets the count, like a table. */
export function problemStroke(problems: Diagnostic[], own: string): string {
	return problems.some((problem) => problem.severity === "ERROR") ? "var(--destructive)" : own;
}

// The badge and its menu are the costly part of an edge to draw, and nothing
// in them moves: the wrapper outside carries the position, so a table being
// dragged redraws the line and leaves these alone.
const EdgeBadge = memo(function EdgeBadge({
	id,
	relationshipType,
	name,
	selected,
	shown,
	open,
	onOpenChange,
	onEditDetails,
	anchor,
}: {
	id: string;
	relationshipType: RelationshipType;
	name: string | undefined;
	selected: boolean | undefined;
	/** A badge that is not shown stays in the DOM, with no size, so the menu
      opened from the line still has a point to hang from. */
	shown: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEditDetails: () => void;
	/** Where the menu hangs from when it was not the badge that opened it. */
	anchor?: React.ComponentProps<typeof DropdownMenuContent>["anchor"];
}) {
	const { updateEdgeData, deleteElements } = useReactFlow();
	const relationship = RELATIONSHIPS[relationshipType];

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				title="Relationship options"
				tabIndex={shown ? undefined : -1}
				render={
					<button
						type="button"
						style={{ "--stroke": relationship.stroke } as React.CSSProperties}
						className={cn(
							"cursor-pointer rounded border border-(--stroke) bg-card px-1.5 py-0.5 leading-none font-semibold shadow-sm transition-all hover:bg-muted hover:shadow-md",
							relationship.text,
							selected && "ring-1 ring-primary ring-offset-1",
							!shown && "invisible size-0 overflow-hidden border-0 p-0",
						)}
					/>
				}
			>
				{relationship.symbol}
				{name && <span className="ml-1 font-normal text-muted-foreground">{name}</span>}
			</DropdownMenuTrigger>
			{/* Wide enough that no name or action wraps, with the symbols in a
          column of their own so the names line up under each other. */}
			<DropdownMenuContent align="center" anchor={anchor} className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Relationship</DropdownMenuLabel>
					<DropdownMenuRadioGroup
						value={relationshipType}
						onValueChange={(value) =>
							updateEdgeData(id, {
								relationshipType: value as RelationshipType,
							})
						}
					>
						{RELATIONSHIP_ORDER.map((type) => {
							const option = RELATIONSHIPS[type];
							return (
								<DropdownMenuRadioItem key={type} value={type}>
									<span className={cn("w-8 shrink-0 font-bold tabular-nums", option.text)}>
										{option.symbol}
									</span>
									<span className="whitespace-nowrap">{option.label}</span>
								</DropdownMenuRadioItem>
							);
						})}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onEditDetails}>
					<FileTextIcon />
					Edit details
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					onClick={() => void deleteElements({ edges: [{ id }] })}
				>
					<Trash2Icon />
					Delete relationship
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
});

export const RelationshipEdge = memo(function RelationshipEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	source,
	target,
	style = {},
	data,
	selected,
}: EdgeProps<ErdEdge>) {
	const { updateEdgeData } = useReactFlow();
	const { tableStyle } = useCanvasPreferences();
	const [editingDetails, setEditingDetails] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const openDetails = useCallback(() => setEditingDetails(true), []);
	// A right-click on the line opens the menu where the pointer is, since the
	// badge it would otherwise hang from can be a long way along the line.
	const [menuAt, setMenuAt] = useState<{ x: number; y: number }>();
	const openMenu = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		setMenuAt({ x: event.clientX, y: event.clientY });
		setMenuOpen(true);
	}, []);
	// The point is kept while the menu closes, or the fade-out would jump
	// back to the badge. Only the badge opening the menu lets go of it.
	const changeMenuOpen = useCallback((open: boolean) => {
		setMenuOpen(open);
		if (open) setMenuAt(undefined);
	}, []);
	const menuAnchor = useMemo(
		() =>
			menuAt && {
				getBoundingClientRect: () => new DOMRect(menuAt.x, menuAt.y, 0, 0),
			},
		[menuAt],
	);
	const relationshipType = data?.relationshipType ?? "one-to-many";
	const problems = useElementProblems(id);
	const failing = problems.some((problem) => problem.severity === "ERROR");

	const sourceNode = useStore(useCallback((state) => state.nodeLookup.get(source), [source]));
	const targetNode = useStore(useCallback((state) => state.nodeLookup.get(target), [target]));
	const edges = useStore((state) => state.edges);

	// Which side of each of the two tables the other lines come in on, read
	// off where their far tables sit. A loop round the left of a table cuts
	// across every line arriving from the left, so that side costs more.
	const arrivals = useStore(
		useCallback(
			(state) => {
				const centreOf = (nodeId: string) => {
					const node = state.nodeLookup.get(nodeId);
					return node
						? node.internals.positionAbsolute.x + (node.measured.width ?? 0) / 2
						: undefined;
				};
				const counts = { left: 0, right: 0 };

				for (const edge of state.edges) {
					if (edge.id === id) continue;

					for (const end of [source, target]) {
						const far =
							edge.source === end ? edge.target : edge.target === end ? edge.source : undefined;
						if (!far || far === source || far === target) continue;

						const here = centreOf(end);
						const there = centreOf(far);
						if (here === undefined || there === undefined) continue;

						counts[there < here ? "left" : "right"]++;
					}
				}

				return `${counts.left}:${counts.right}`;
			},
			[id, source, target],
		),
	);

	// Parallel edges between the same two tables would draw on top of each
	// other, so each one gets its own lane by index.
	const edgeNumber = useMemo(() => {
		let index = 0;
		for (const edge of edges) {
			const sameTables =
				(edge.source === source && edge.target === target) ||
				(edge.source === target && edge.target === source);
			if (!sameTables) continue;
			if (edge.id === id) return index;
			index++;
		}
		return 0;
	}, [edges, id, source, target]);

	const sourceWidth = sourceNode?.measured.width ?? FALLBACK_TABLE_WIDTH;
	const targetWidth = targetNode?.measured.width ?? FALLBACK_TABLE_WIDTH;

	// Anchor off the node origin, not the handle coordinates from props. The
	// handle x depends on which side the user dragged from, so it says nothing
	// about where the table's own left and right edges sit.
	const sourcePosX = sourceNode?.internals.positionAbsolute.x ?? sourceX;
	const targetPosX = targetNode?.internals.positionAbsolute.x ?? targetX;

	const sourceLeftX = sourcePosX;
	const sourceRightX = sourcePosX + sourceWidth;
	const targetLeftX = targetPosX;
	const targetRightX = targetPosX + targetWidth;

	// The tables as boxes for the route to keep out from under, a pixel wider
	// all round for the ring drawn outside each one.
	const sourceTop = sourceNode?.internals.positionAbsolute.y ?? sourceY;
	const sourceBottom = sourceTop + (sourceNode?.measured.height ?? 0);
	const targetTop = targetNode?.internals.positionAbsolute.y ?? targetY;
	const targetBottom = targetTop + (targetNode?.measured.height ?? 0);

	const { line, dash, labels } = useEdgeStyle();
	const labelled = labels || problems.length > 0;

	// Both ends stop short of the table. A "one" bar's marker carries the line
	// on to the row, so that stretch is drawn once rather than twice; a crow's
	// foot ends where the line does, with the gap left open.

	// At rest the ends sit on whole pixels, which keeps a one-pixel line from
	// smearing across two. While a table is being dragged they follow it as it
	// is, since snapping would hold the line still and then jump it a pixel at
	// a time behind the table.
	const settled = !sourceNode?.dragging && !targetNode?.dragging;

	// Every pair of sides is routed, so the sides can be picked by what each
	// route would hide rather than by how close the edges sit alone. Each
	// route hands back the label anchor along with the path, so the badge
	// follows the line even when both ends leave from the same side.
	const plans = useMemo(() => {
		const snap = settled ? Math.round : (value: number) => value;
		const clear = [
			{
				left: sourceLeftX - 1,
				right: sourceRightX + 1,
				top: sourceTop - 1,
				bottom: sourceBottom + 1,
			},
			{
				left: targetLeftX - 1,
				right: targetRightX + 1,
				top: targetTop - 1,
				bottom: targetBottom + 1,
			},
		];
		const plan = (sourceSide: Side, targetSide: Side) => {
			const fromX = sourceSide === "left" ? sourceLeftX - END_GAP : sourceRightX + END_GAP;
			const toX = targetSide === "left" ? targetLeftX - END_GAP : targetRightX + END_GAP;
			const route = planRoute(
				line,
				{
					sourceX: snap(fromX),
					sourceY: snap(sourceY),
					targetX: snap(toX),
					targetY: snap(targetY),
					sourcePosition: sourceSide === "left" ? Position.Left : Position.Right,
					targetPosition: targetSide === "left" ? Position.Left : Position.Right,
					clear,
				},
				edgeNumber,
			);

			return { ...route, distance: Math.abs(fromX - toX) };
		};

		return {
			leftToLeft: plan("left", "left"),
			leftToRight: plan("left", "right"),
			rightToLeft: plan("right", "left"),
			rightToRight: plan("right", "right"),
		};
	}, [
		line,
		sourceLeftX,
		sourceRightX,
		targetLeftX,
		targetRightX,
		sourceTop,
		sourceBottom,
		targetTop,
		targetBottom,
		sourceY,
		targetY,
		edgeNumber,
		settled,
	]);

	// A loop round one side is charged for every line it would cut across.
	const [fromLeft, fromRight] = arrivals.split(":").map(Number);
	const { sourceSide, targetSide } = useHeldSides({
		leftToLeft: {
			distance: plans.leftToLeft.distance,
			hidden: plans.leftToLeft.cost + fromLeft * CROSSING,
		},
		leftToRight: { distance: plans.leftToRight.distance, hidden: plans.leftToRight.cost },
		rightToLeft: { distance: plans.rightToLeft.distance, hidden: plans.rightToLeft.cost },
		rightToRight: {
			distance: plans.rightToRight.distance,
			hidden: plans.rightToRight.cost + fromRight * CROSSING,
		},
	});

	const classic = plans[`${sourceSide}To${targetSide === "left" ? "Left" : "Right"}`];

	const { path: edgePath, labelX, labelY } = classic;

	const relationship = RELATIONSHIPS[relationshipType];

	// Outline mode draws the tables in the text colour, so the lines that
	// join them follow rather than staying in their own.
	const stroke = problemStroke(
		problems,
		tableStyle === "outline" ? "var(--color-foreground)" : relationship.stroke,
	);
	const sourceMarkerId = `source-${id}-${relationshipType}`;
	const targetMarkerId = `target-${id}-${relationshipType}`;
	const sourceIsOne = relationshipType !== "many-to-many";
	const targetIsOne = relationshipType === "one-to-one";

	// The line stops at the set-back, and the toes carry on across most of it
	// and stop half a pixel short of the table's outline, so they are seen to
	// meet the table rather than to run into it. A rounded cap reaches half
	// a stroke past its point, which is counted in.
	const reach = END_GAP - 2.1;
	const crowsFoot = (pointing: "left" | "right") => {
		// The outer end stays on the table, so a shorter toe pulls its tip in
		// towards the line rather than lifting the foot off the edge.
		const span = 5;
		const base = pointing === "left" ? 8 - reach : 8 + reach;
		const tip = pointing === "left" ? base + span : base - span;

		return (
			<>
				<line
					x1={tip}
					y1="8"
					x2={base}
					y2="4.8"
					stroke={stroke}
					strokeWidth="1.2"
					strokeLinecap="round"
				/>
				<line
					x1={tip}
					y1="8"
					x2={base}
					y2="8"
					stroke={stroke}
					strokeWidth="1.2"
					strokeLinecap="round"
				/>
				<line
					x1={tip}
					y1="8"
					x2={base}
					y2="11.2"
					stroke={stroke}
					strokeWidth="1.2"
					strokeLinecap="round"
				/>
			</>
		);
	};

	// The path ends at the bar; this is the solid run from it towards the
	// table, stopping the same half pixel short of its outline.
	const singleBar = (
		<>
			<line x1="8" y1="8" x2={6.5 + END_GAP} y2="8" stroke={stroke} strokeWidth="1.5" />
			<line
				x1="8"
				y1="4.5"
				x2="8"
				y2="11.5"
				stroke={stroke}
				strokeWidth="1.3"
				strokeLinecap="round"
			/>
		</>
	);

	return (
		<>
			<defs>
				<marker
					id={sourceMarkerId}
					markerWidth="16"
					markerHeight="16"
					refX="8"
					refY="8"
					orient="auto-start-reverse"
					markerUnits="userSpaceOnUse"
				>
					{sourceIsOne ? singleBar : crowsFoot("left")}
				</marker>

				<marker
					id={targetMarkerId}
					markerWidth="16"
					markerHeight="16"
					refX="8"
					refY="8"
					orient="auto"
					markerUnits="userSpaceOnUse"
				>
					{targetIsOne ? singleBar : crowsFoot("right")}
				</marker>
			</defs>

			<path
				id={id}
				d={edgePath}
				markerStart={`url(#${sourceMarkerId})`}
				markerEnd={`url(#${targetMarkerId})`}
				style={{
					...style,
					strokeWidth: selected ? 1.4 : 1,
					stroke,
					strokeDasharray: edgeDash(dash).dash,
					fill: "none",
				}}
				className="react-flow__edge-path"
			/>

			{/* A fat transparent copy of the path so the line is clickable without
          asking for pixel-perfect aim. */}
			<path
				d={edgePath}
				fill="none"
				stroke="transparent"
				strokeWidth={20}
				className="react-flow__edge-interaction cursor-pointer"
				onContextMenu={openMenu}
			/>

			<EdgeLabelRenderer>
				<div
					style={{
						transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
					}}
					className={cn(
						"nodrag nopan absolute text-4xs",
						labelled ? "pointer-events-auto" : "pointer-events-none",
					)}
				>
					<span className="relative flex">
						<EdgeBadge
							id={id}
							relationshipType={relationshipType}
							name={data?.name}
							selected={selected}
							shown={labels}
							open={menuOpen}
							onOpenChange={changeMenuOpen}
							anchor={menuAnchor}
							onEditDetails={openDetails}
						/>
						{/* On its own the count stands where the badge would. With the
								badge showing it hangs off the top corner, the way a count sits
								on a table's header. */}
						<AnimatePresence>
							{problems.length > 0 && (
								<motion.span
									key="problems"
									initial={{ opacity: 0, scale: 0.6 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.6 }}
									transition={{ duration: 0.3, ease: "easeInOut" }}
									data-export="chrome"
									className={cn(
										"rounded-full shadow-sm ring-1 backdrop-blur-sm",
										failing
											? "bg-destructive/15 ring-destructive/50"
											: "bg-warning/8 ring-warning/35",
										labels && "absolute -top-3 -right-3.5 origin-top-right scale-90",
									)}
								>
									<ProblemCount problems={problems} align="center" />
								</motion.span>
							)}
						</AnimatePresence>
					</span>
				</div>

				{editingDetails && (
					<DescriptionDialog
						title="Relationship details"
						subject={`${relationship.label} relationship`}
						withName
						details={{ name: data?.name, description: data?.description }}
						onSave={(details) => updateEdgeData(id, details)}
						onClose={() => setEditingDetails(false)}
					/>
				)}
			</EdgeLabelRenderer>
		</>
	);
});
