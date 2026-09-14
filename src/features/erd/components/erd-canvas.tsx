import { useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"

import { useTheme } from "@/lib/theme"

import { useErdGraph } from "../hooks/use-erd-graph"
import type { ErdDiagram } from "../types/erd"
import { CanvasSettings } from "./canvas-settings"
import type { BackgroundStyle } from "./canvas-settings"
import { RelationshipEdge } from "./relationship-edge"
import { SchemaNode } from "./schema-node"
import { TableNode } from "./table-node"

// Defined outside the component. React Flow remounts every node when these
// objects change identity, which a fresh literal on each render guarantees.
const nodeTypes = { table: TableNode, schema: SchemaNode }
const edgeTypes = { relationship: RelationshipEdge }

function Canvas({ diagram }: { diagram: ErdDiagram }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useErdGraph(diagram)
  const theme = useTheme()
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [background, setBackground] = useState<BackgroundStyle>(
    BackgroundVariant.Dots
  )
  const [snapToGrid, setSnapToGrid] = useState(false)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      colorMode={theme}
      fitView
      snapToGrid={snapToGrid}
      snapGrid={[16, 16]}
      minZoom={0.5}
      maxZoom={2}
      defaultEdgeOptions={{ type: "relationship", animated: true }}
      connectionLineStyle={{ stroke: "var(--primary)", strokeWidth: 2 }}
      connectionRadius={40}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      {background !== "none" && (
        <Background
          gap={16}
          variant={background}
          className="opacity-50 [&>*]:stroke-muted-foreground"
          color="inherit"
        />
      )}
      <Panel position="top-right">
        <CanvasSettings
          showMiniMap={showMiniMap}
          onShowMiniMapChange={setShowMiniMap}
          showControls={showControls}
          onShowControlsChange={setShowControls}
          background={background}
          onBackgroundChange={setBackground}
          snapToGrid={snapToGrid}
          onSnapToGridChange={setSnapToGrid}
        />
      </Panel>
      {showControls && (
        <Controls className="rounded-md border border-border bg-card shadow-sm [&_button]:border-border [&_button]:bg-card [&_button]:text-foreground [&_button_svg]:fill-current [&_button:hover]:bg-muted" />
      )}
      {showMiniMap && (
        <MiniMap
          pannable
          zoomable
          bgColor="var(--card)"
          nodeColor="var(--muted-foreground)"
          maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
          className="rounded-md border border-border"
        />
      )}
    </ReactFlow>
  )
}

export function ErdCanvas({ diagram }: { diagram: ErdDiagram }) {
  return (
    <ReactFlowProvider>
      <Canvas diagram={diagram} />
    </ReactFlowProvider>
  )
}
