import type * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { EdgeLabelRenderer, Position, useReactFlow, useStore } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { FileTextIcon, Trash2Icon } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useHeldSides } from "../hooks/use-held-sides";
import { edgeDash, linePath, END_GAP } from "../lib/edge-lines";
import type { ErdEdge, RelationshipType } from "../types/erd";
import { DescriptionDialog } from "./details-dialogs";
import { useEdgeStyle } from "./edge-line-context";

const FALLBACK_TABLE_WIDTH = 160;

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

export const RelationshipEdge = ({
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
}: EdgeProps<ErdEdge>) => {
	const { updateEdgeData, deleteElements } = useReactFlow();
	const [editingDetails, setEditingDetails] = useState(false);
	const relationshipType = data?.relationshipType ?? "one-to-many";

	const sourceNode = useStore(useCallback((state) => state.nodeLookup.get(source), [source]));
	const targetNode = useStore(useCallback((state) => state.nodeLookup.get(target), [target]));
	const edges = useStore((state) => state.edges);

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

	const { sourceSide, targetSide } = useHeldSides(
		sourceLeftX,
		sourceRightX,
		targetLeftX,
		targetRightX,
	);

	const { line, dash, labels } = useEdgeStyle();

	// A "one" end stops short of the table and its marker carries the line on,
	// so the stretch past the bar is drawn once rather than twice. A crow's
	// foot goes all the way, with its toes on the row.
	const sourceGap = relationshipType !== "many-to-many" ? END_GAP : 0;
	const targetGap = relationshipType === "one-to-one" ? END_GAP : 0;

	// Each route hands back the label anchor along with the path, so the badge
	// follows the line even when both ends leave from the same side.
	const [edgePath, labelX, labelY] = useMemo(() => {
		return linePath(
			line,
			{
				sourceX: Math.round(
					sourceSide === "left" ? sourceLeftX - sourceGap : sourceRightX + sourceGap,
				),
				sourceY: Math.round(sourceY),
				targetX: Math.round(
					targetSide === "left" ? targetLeftX - targetGap : targetRightX + targetGap,
				),
				targetY: Math.round(targetY),
				sourcePosition: sourceSide === "left" ? Position.Left : Position.Right,
				targetPosition: targetSide === "left" ? Position.Left : Position.Right,
			},
			edgeNumber,
		);
	}, [
		line,
		sourceLeftX,
		sourceRightX,
		targetLeftX,
		targetRightX,
		sourceY,
		targetY,
		sourceSide,
		targetSide,
		sourceGap,
		targetGap,
		edgeNumber,
	]);

	const relationship = RELATIONSHIPS[relationshipType];
	const sourceMarkerId = `source-${id}-${relationshipType}`;
	const targetMarkerId = `target-${id}-${relationshipType}`;
	const sourceIsOne = relationshipType !== "many-to-many";
	const targetIsOne = relationshipType === "one-to-one";

	const crowsFoot = (pointing: "left" | "right") => {
		const [tip, base] = pointing === "left" ? [12, 4] : [4, 12];
		return (
			<>
				<line
					x1={tip}
					y1="8"
					x2={base}
					y2="3"
					stroke={relationship.stroke}
					strokeWidth="1.2"
					strokeLinecap="round"
				/>
				<line
					x1={tip}
					y1="8"
					x2={base}
					y2="8"
					stroke={relationship.stroke}
					strokeWidth="1.2"
					strokeLinecap="round"
				/>
				<line
					x1={tip}
					y1="8"
					x2={base}
					y2="13"
					stroke={relationship.stroke}
					strokeWidth="1.2"
					strokeLinecap="round"
				/>
			</>
		);
	};

	// The path ends at the bar; this is the solid run from it to the table.
	const singleBar = (
		<>
			<line x1="8" y1="8" x2={9 + END_GAP} y2="8" stroke={relationship.stroke} strokeWidth="1.5" />
			<line
				x1="8"
				y1="4.5"
				x2="8"
				y2="11.5"
				stroke={relationship.stroke}
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
					stroke: relationship.stroke,
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
			/>

			<EdgeLabelRenderer>
				{/* The badge is also the way in to the menu that sets the kind of
            relationship, so a hidden one comes back for the line you click. */}
				{(labels || selected) && (
					<div
						style={{
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
						}}
						className="nodrag nopan pointer-events-auto absolute text-4xs"
					>
						<DropdownMenu>
							<DropdownMenuTrigger
								title="Relationship options"
								render={
									<button
										type="button"
										style={{ "--stroke": relationship.stroke } as React.CSSProperties}
										className={cn(
											"cursor-pointer rounded border border-(--stroke) bg-card px-1.5 py-0.5 leading-none font-semibold shadow-sm transition-all hover:bg-muted hover:shadow-md",
											relationship.text,
											selected && "ring-1 ring-primary ring-offset-1",
										)}
									/>
								}
							>
								{relationship.symbol}
								{data?.name && (
									<span className="ml-1 font-normal text-muted-foreground">{data.name}</span>
								)}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="center" className="min-w-40">
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
												<span className={cn("font-bold", option.text)}>{option.symbol}</span>
												<span className="text-muted-foreground">{option.label}</span>
											</DropdownMenuRadioItem>
										);
									})}
								</DropdownMenuRadioGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setEditingDetails(true)}>
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
					</div>
				)}

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
};
