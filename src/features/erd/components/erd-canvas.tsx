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
import { useSchemaSync } from "../hooks/use-schema-sync"
import type { ErdDiagram } from "../types/erd"
import { CanvasSettings } from "./canvas-settings"
import type { BackgroundStyle } from "./canvas-settings"
import { DiagnosticsPanel } from "./diagnostics-panel"
import { GeneratedSqlDialog } from "./generated-sql-dialog"
import { ProblemsProvider } from "./problems-context"
import { RelationshipEdge } from "./relationship-edge"
import { SchemaNode } from "./schema-node"
import { SchemaToolbar } from "./schema-toolbar"
import { TableNode } from "./table-node"

// Defined outside the component. React Flow remounts every node when these
// objects change identity, which a fresh literal on each render guarantees.
const nodeTypes = { table: TableNode, schema: SchemaNode }
const edgeTypes = { relationship: RelationshipEdge }

function Canvas({ diagram, schema }: ErdCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useErdGraph(diagram)
  const theme = useTheme()
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [background, setBackground] = useState<BackgroundStyle>(
    BackgroundVariant.Dots
  )
  const [snapToGrid, setSnapToGrid] = useState(false)

  const [schemaId, setSchemaId] = useState(schema.id)
  const [name, setName] = useState(schema.name)
  const sync = useSchemaSync({
    schemaId,
    name,
    nodes,
    edges,
    onSaved: setSchemaId,
  })

  return (
    <ProblemsProvider value={sync.problems}>
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
        <Panel position="top-left">
          <SchemaToolbar
            name={name}
            onNameChange={setName}
            busy={sync.busy}
            onSave={() => void sync.save()}
            onValidate={() => void sync.validate()}
            onGenerate={() => void sync.generate()}
          />
        </Panel>
        {sync.diagnostics.length > 0 && (
          <Panel position="bottom-left">
            <DiagnosticsPanel
              diagnostics={sync.diagnostics}
              onDismiss={sync.dismissDiagnostics}
            />
          </Panel>
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
      <GeneratedSqlDialog ddl={sync.ddl} onClose={sync.closeDdl} />
    </ProblemsProvider>
  )
}

export type ErdCanvasProps = {
  diagram: ErdDiagram
  /** Identity and name of the stored schema the diagram came from. */
  schema: { id: string; name: string }
}

export function ErdCanvas({ diagram, schema }: ErdCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas diagram={diagram} schema={schema} />
    </ReactFlowProvider>
  )
}
