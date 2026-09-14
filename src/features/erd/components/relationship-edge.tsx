import { useCallback, useMemo } from "react"
import {
  EdgeLabelRenderer,
  Position,
  getSmoothStepPath,
  useReactFlow,
  useStore,
  type EdgeProps,
} from "@xyflow/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import type { ErdEdge, RelationshipType } from "../types/erd"

const FALLBACK_TABLE_WIDTH = 160

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
}

const RELATIONSHIP_ORDER: RelationshipType[] = [
  "one-to-one",
  "one-to-many",
  "many-to-many",
]

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
  const { updateEdgeData } = useReactFlow()
  const relationshipType = data?.relationshipType ?? "one-to-many"

  const sourceNode = useStore(
    useCallback((state) => state.nodeLookup.get(source), [source])
  )
  const targetNode = useStore(
    useCallback((state) => state.nodeLookup.get(target), [target])
  )
  const edges = useStore((state) => state.edges)

  // Parallel edges between the same two tables would draw on top of each
  // other, so each one gets its own lane by index.
  const edgeNumber = useMemo(() => {
    let index = 0
    for (const edge of edges) {
      const sameTables =
        (edge.source === source && edge.target === target) ||
        (edge.source === target && edge.target === source)
      if (!sameTables) continue
      if (edge.id === id) return index
      index++
    }
    return 0
  }, [edges, id, source, target])

  const sourceWidth = sourceNode?.measured?.width ?? FALLBACK_TABLE_WIDTH
  const targetWidth = targetNode?.measured?.width ?? FALLBACK_TABLE_WIDTH

  // Anchor off the node origin, not the handle coordinates from props. The
  // handle x depends on which side the user dragged from, so it says nothing
  // about where the table's own left and right edges sit.
  const sourcePosX = sourceNode?.internals.positionAbsolute.x ?? sourceX
  const targetPosX = targetNode?.internals.positionAbsolute.x ?? targetX

  const sourceLeftX = sourcePosX
  const sourceRightX = sourcePosX + sourceWidth
  const targetLeftX = targetPosX
  const targetRightX = targetPosX + targetWidth

  const { sourceSide, targetSide } = useMemo(() => {
    const distances = {
      leftToLeft: Math.abs(sourceLeftX - targetLeftX),
      leftToRight: Math.abs(sourceLeftX - targetRightX),
      rightToLeft: Math.abs(sourceRightX - targetLeftX),
      rightToRight: Math.abs(sourceRightX - targetRightX),
    }

    const closest = (
      Object.keys(distances) as (keyof typeof distances)[]
    ).reduce((best, key) => (distances[key] < distances[best] ? key : best))

    switch (closest) {
      case "leftToRight":
        return { sourceSide: "left" as const, targetSide: "right" as const }
      case "rightToLeft":
        return { sourceSide: "right" as const, targetSide: "left" as const }
      case "rightToRight":
        return { sourceSide: "right" as const, targetSide: "right" as const }
      default:
        return { sourceSide: "left" as const, targetSide: "left" as const }
    }
  }, [sourceLeftX, sourceRightX, targetLeftX, targetRightX])

  // getSmoothStepPath hands back the label anchor along with the path, so the
  // badge follows the line even when both ends leave from the same side.
  const [edgePath, labelX, labelY] = useMemo(() => {
    return getSmoothStepPath({
      sourceX: Math.round(sourceSide === "left" ? sourceLeftX : sourceRightX),
      sourceY: Math.round(sourceY),
      targetX: Math.round(targetSide === "left" ? targetLeftX : targetRightX),
      targetY: Math.round(targetY),
      borderRadius: 14,
      sourcePosition: sourceSide === "left" ? Position.Left : Position.Right,
      targetPosition: targetSide === "left" ? Position.Left : Position.Right,
      offset: (edgeNumber + 1) * 14,
    })
  }, [
    sourceLeftX,
    sourceRightX,
    targetLeftX,
    targetRightX,
    sourceY,
    targetY,
    sourceSide,
    targetSide,
    edgeNumber,
  ])

  const relationship = RELATIONSHIPS[relationshipType]
  const sourceMarkerId = `source-${id}-${relationshipType}`
  const targetMarkerId = `target-${id}-${relationshipType}`
  const sourceIsOne = relationshipType !== "many-to-many"
  const targetIsOne = relationshipType === "one-to-one"

  const crowsFoot = (pointing: "left" | "right") => {
    const [tip, base] = pointing === "left" ? [12, 4] : [4, 12]
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
    )
  }

  const singleBar = (
    <>
      <line
        x1="7"
        y1="3"
        x2="7"
        y2="13"
        stroke={relationship.stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="3"
        x2="9"
        y2="13"
        stroke={relationship.stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </>
  )

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
        <div
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          className="nodrag nopan pointer-events-auto absolute text-[8px]"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              title="Change relationship type"
              style={{ borderColor: relationship.stroke }}
              className={cn(
                "cursor-pointer rounded border bg-card px-1.5 py-0.5 leading-none font-semibold shadow-sm transition-all hover:bg-muted hover:shadow-md",
                relationship.text,
                selected && "ring-1 ring-primary ring-offset-1"
              )}
            >
              {relationship.symbol}
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
                  const option = RELATIONSHIPS[type]
                  return (
                    <DropdownMenuRadioItem key={type} value={type}>
                      <span className={cn("font-bold", option.text)}>
                        {option.symbol}
                      </span>
                      <span className="text-muted-foreground">
                        {option.label}
                      </span>
                    </DropdownMenuRadioItem>
                  )
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
