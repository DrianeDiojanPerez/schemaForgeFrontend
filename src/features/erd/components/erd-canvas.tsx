import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { MaximizeIcon, PlusIcon, SaveIcon } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { reportBackendTrouble } from "@/features/schema/hooks/use-backend-status"
import { useTheme } from "@/lib/theme"

import { useErdGraph } from "../hooks/use-erd-graph"
import { useSchemaSync } from "../hooks/use-schema-sync"
import { DEFAULT_CONNECTOR_ARROW } from "../lib/connector-arrows"
import type { ConnectorArrow } from "../lib/connector-arrows"
import type { ErdDiagram } from "../types/erd"
import { CanvasSettings } from "./canvas-settings"
import type { BackgroundStyle } from "./canvas-settings"
import { ConnectorArrowProvider } from "./connector-arrow-context"
import { DiagnosticsPanel } from "./diagnostics-panel"
import { GeneratedSqlDialog } from "./generated-sql-dialog"
import { GraphActionsProvider } from "./graph-actions-context"
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
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addTable,
    addColumn,
    removeTable,
    removeColumn,
  } = useErdGraph(diagram)
  const theme = useTheme()
  const { screenToFlowPosition, fitView } = useReactFlow()
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [background, setBackground] = useState<BackgroundStyle>(
    BackgroundVariant.Dots
  )
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [connectorArrow, setConnectorArrow] = useState<ConnectorArrow>(
    DEFAULT_CONNECTOR_ARROW
  )
  const [autoSave, setAutoSave] = useState(true)
  const [autoValidate, setAutoValidate] = useState(false)

  const [schemaId, setSchemaId] = useState(schema.id)
  const [name, setName] = useState(schema.name)
  const stopAutoValidate = useCallback(() => setAutoValidate(false), [])
  const sync = useSchemaSync({
    schemaId,
    name,
    nodes,
    edges,
    autoSave,
    autoValidate,
    onSaved: setSchemaId,
    onValidateUnavailable: stopAutoValidate,
  })

  /**
   * Switching it on runs one check straight away, so the answer is either the
   * marks appearing or the reason they cannot. A backend that has no
   * validation to give puts the switch back rather than leaving it promising
   * marks that never arrive.
   */
  const changeAutoValidate = useCallback(
    (next: boolean) => {
      setAutoValidate(next)
      if (next) void sync.validate()
    },
    [sync.validate]
  )

  useEffect(() => {
    void reportBackendTrouble()
  }, [])

  const actions = useMemo(
    () => ({ addColumn, removeTable, removeColumn }),
    [addColumn, removeTable, removeColumn]
  )

  // The menu opens after the click, so where the click landed has to be kept
  // for the item that drops a table there.
  const clickPoint = useRef({ x: 0, y: 0 })

  const addTableAtClick = useCallback(() => {
    addTable(screenToFlowPosition(clickPoint.current))
  }, [addTable, screenToFlowPosition])

  const addTableAtCentre = useCallback(() => {
    addTable(
      screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
    )
  }, [addTable, screenToFlowPosition])

  return (
    <ProblemsProvider value={sync.problems}>
      <ConnectorArrowProvider value={connectorArrow}>
        <GraphActionsProvider value={actions}>
          <ContextMenu>
            <ContextMenuTrigger
              render={
                <div
                  className="h-full w-full"
                  onContextMenuCapture={(event) => {
                    clickPoint.current = { x: event.clientX, y: event.clientY }
                  }}
                />
              }
            >
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
                connectionLineStyle={{
                  stroke: "var(--primary)",
                  strokeWidth: 2,
                }}
                connectionRadius={40}
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
                    onAddTable={addTableAtCentre}
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
                    autoSave={autoSave}
                    onAutoSaveChange={setAutoSave}
                    autoValidate={autoValidate}
                    onAutoValidateChange={changeAutoValidate}
                    connectorArrow={connectorArrow}
                    onConnectorArrowChange={setConnectorArrow}
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
            </ContextMenuTrigger>

            <ContextMenuContent>
              <ContextMenuItem onClick={addTableAtClick}>
                <PlusIcon />
                New table
              </ContextMenuItem>
              <ContextMenuSeparator />
              {/* Auto-save can be switched off, and there is no Save button any
                more, so this is the only way back to a deliberate write. */}
              <ContextMenuItem
                disabled={sync.busy}
                onClick={() => void sync.save()}
              >
                <SaveIcon />
                Save
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => void fitView({ duration: 300 })}>
                <MaximizeIcon />
                Fit to screen
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          <GeneratedSqlDialog ddl={sync.ddl} onClose={sync.closeDdl} />
        </GraphActionsProvider>
      </ConnectorArrowProvider>
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
