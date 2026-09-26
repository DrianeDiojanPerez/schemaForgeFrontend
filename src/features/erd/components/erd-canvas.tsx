import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Background,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import type { NodeChange } from "@xyflow/react"
import { ClientOnly } from "@tanstack/react-router"

import { TourProvider, useTour } from "@/components/tour"

import { schemaKeys } from "@/features/schema/api/keys"
import { useBackendWatch } from "@/features/schema/hooks/use-backend-status"
import { useHotkey } from "@tanstack/react-hotkeys"
import { useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@/lib/theme"
import { notify } from "@/lib/toast"

import { useErdGraph } from "../hooks/use-erd-graph"
import { useReveal } from "../hooks/use-reveal"
import { useSchemaSync } from "../hooks/use-schema-sync"
import { HOTKEYS } from "../lib/hotkeys"
import {
  setCanvasPreference,
  useCanvasPreferences,
} from "../lib/canvas-preferences"
import type { SchemaGrouping } from "../lib/canvas-preferences"
import type { BackgroundStyle } from "../lib/backgrounds"
import type { EdgeDash, EdgeLine } from "../lib/edge-lines"
import { DEFAULT_CONNECTOR_ARROW } from "../lib/connector-arrows"
import type { ConnectorArrow } from "../lib/connector-arrows"
import { schemaBoxes as boxesFor, isSchemaBoxId } from "../lib/schema-groups"
import { TOUR } from "../lib/tour"
import type { ErdDiagram, ErdNode } from "../types/erd"
import { CanvasControls } from "./canvas-controls"
import { CanvasSettings } from "./canvas-settings"
import { CanvasSkeleton } from "./canvas-skeleton"
import type { LoadingPhase } from "./canvas-skeleton"
import { CanvasTour } from "./canvas-tour"
import { ConnectionLine } from "./connection-line"
import { ConnectorArrowProvider } from "./connector-arrow-context"
import { EdgeLineProvider } from "./edge-line-context"
import { GeneratedSqlDialog } from "./generated-sql-dialog"
import { GraphActionsProvider } from "./graph-actions-context"
import { FlowProvider, GraphMenu, tables } from "./graph-menu"
import { ProblemsProvider } from "./problems-context"
import { RelationshipEdge } from "./relationship-edge"
import { SchemaNode } from "./schema-node"
import { SchemaSidebar } from "./schema-sidebar"
import { SchemaToolbar } from "./schema-toolbar"
import { SidebarButtonSkeleton } from "./sidebar-skeleton"
import { TableNode } from "./table-node"

// Defined outside the component. React Flow remounts every node when these
// objects change identity, which a fresh literal on each render guarantees.
const nodeTypes = { table: TableNode, schema: SchemaNode }

const GLASS_LINGER = 900
const LOADER_FADE = 700
const edgeTypes = { relationship: RelationshipEdge }

// Same reason, one step down. React Flow holds the node renderer still while a
// table is dragged, and it can only do that while every prop reaching it keeps
// its identity. A literal written in the JSX is a new one sixty times a second,
// which re-renders every table on the canvas instead of the one being moved.

// Backspace is the React Flow default and stays, since the two keys are the
// same key on a keyboard without a Delete.
const DELETE_KEYS = ["Delete", "Backspace"]
const SNAP_GRID: [number, number] = [16, 16]
// Holding the right button is what moves the canvas, which leaves the left one
// free to sweep a selection over tables.
const PAN_BUTTONS = [2]
const EDGE_DEFAULTS = { type: "relationship", animated: true }

// Written once out here so the settings dialog gets the same functions on
// every render and can skip the ones where nothing it shows has changed.
const setBackground = (next: BackgroundStyle) =>
  setCanvasPreference("background", next)
const setAutoSave = (next: boolean) => setCanvasPreference("autoSave", next)
const setEdgeLine = (next: EdgeLine) => setCanvasPreference("edgeLine", next)
const setEdgeDash = (next: EdgeDash) => setCanvasPreference("edgeDash", next)
const setEdgeLabels = (next: boolean) => setCanvasPreference("edgeLabels", next)

// Asking for the list is asking to see it, even if it was folded away when
// it was last on.
const setSchemaGrouping = (next: SchemaGrouping) => {
  setCanvasPreference("schemaGrouping", next)
  if (next === "list") setCanvasPreference("schemaListOpen", true)
}

const miniMapNodeColor = (node: ErdNode) =>
  node.type === "schema" ? "transparent" : "var(--muted-foreground)"

/** How far the right button may travel and still count as a click, in pixels. */
const SLIP = 3

// A field takes its own copy and paste, and so does selected text anywhere on
// the page. The canvas only answers for the keys nothing else wanted.
function busyElsewhere(target: EventTarget | null) {
  if (
    target instanceof Element &&
    target.closest("input, textarea, [contenteditable='true']")
  ) {
    return true
  }

  const selection = window.getSelection()

  return Boolean(selection && !selection.isCollapsed)
}

// Its query would otherwise be asked again on every render of the canvas,
// which a drag makes sixty times a second.
const BackendWatch = memo(function BackendWatch({
  onReconnect,
}: {
  onReconnect: () => Promise<void>
}) {
  useBackendWatch(onReconnect)

  return null
})

function Canvas({ diagram, schema }: ErdCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addTable,
    clipboard,
    copyTable,
    copySelection,
    pasteTable,
    addColumn,
    removeTable,
    removeColumn,
  } = useErdGraph(diagram)
  const theme = useTheme()
  const { screenToFlowPosition, fitView, setCenter, getZoom } = useReactFlow()
  const tour = useTour()
  const { bringCloser } = useReveal()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // The loader covers the graph until React Flow has fitted the diagram,
  // then turns to glass with the tables showing through for a moment before
  // it goes.
  const [loading, setLoading] = useState<LoadingPhase>("covering")

  useEffect(() => {
    if (loading !== "glass") return

    const linger = window.setTimeout(() => setLoading("gone"), GLASS_LINGER)

    return () => window.clearTimeout(linger)
  }, [loading])

  // Once faded, the loader leaves the page altogether. Left in place with
  // its blur, it kept costing every frame of a drag long after it was seen.
  const [loaderShown, setLoaderShown] = useState(true)

  useEffect(() => {
    if (loading !== "gone") return

    const fade = window.setTimeout(() => setLoaderShown(false), LOADER_FADE)

    return () => window.clearTimeout(fade)
  }, [loading])

  const [settingsByKeyboard, setSettingsByKeyboard] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [connectorArrow, setConnectorArrow] = useState<ConnectorArrow>(
    DEFAULT_CONNECTOR_ARROW
  )
  const {
    background,
    schemaGrouping,
    schemaListOpen,
    schemaListWidth,
    edgeLine,
    edgeDash,
    edgeLabels,
    autoSave,
    autoValidate: validateWanted,
  } = useCanvasPreferences()
  const listChosen = schemaGrouping === "list"

  // A backend that cannot validate turns the checks off for this visit only,
  // so the switch is still on when it comes back.
  const [validateStopped, setValidateStopped] = useState(false)
  const autoValidate = validateWanted && !validateStopped

  const [schemaId, setSchemaId] = useState(schema.id)
  const [name, setName] = useState(schema.name)
  const stopAutoValidate = useCallback(() => setValidateStopped(true), [])
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
  // Both take a new identity with every change to the diagram, a drag
  // included, so the settings and the toolbar reach them through a ref and
  // are handed functions that stay the same.
  const latest = useRef(sync)

  useEffect(() => {
    latest.current = sync
  })

  const changeAutoValidate = useCallback((next: boolean) => {
    setCanvasPreference("autoValidate", next)
    setValidateStopped(false)
    if (next) void latest.current.validate()
    else latest.current.dismissDiagnostics()
  }, [])

  const queryClient = useQueryClient()

  // Work done on the example while the backend was away is written up rather
  // than thrown over for whatever the backend holds. An untouched example
  // gives way to the stored schema.
  const reconnected = useCallback(async () => {
    const { isDirty, save } = latest.current

    if (isDirty()) {
      await save(true)
      return
    }

    if (!schemaId) {
      await queryClient.invalidateQueries({ queryKey: schemaKeys.latest() })
    }
  }, [schemaId, queryClient])

  const edgeStyle = useMemo(
    () => ({ line: edgeLine, dash: edgeDash, labels: edgeLabels }),
    [edgeLine, edgeDash, edgeLabels]
  )

  // The tab on the box names the schema itself, which the backend stores once
  // for the whole diagram rather than per table.
  const actions = useMemo(
    () => ({
      addColumn,
      copyTable,
      removeTable,
      removeColumn,
      renameSchema: setName,
    }),
    [addColumn, copyTable, removeTable, removeColumn]
  )

  // The boxes go in front of the tables in the array and behind them on screen,
  // and are left out of the graph state so nothing else has to know they exist.
  const drawn = useMemo(
    () => (listChosen ? nodes : [...boxesFor(nodes, name), ...nodes]),
    [listChosen, nodes, name]
  )

  /**
   * React Flow measures the boxes and reports the size back, and there is
   * nothing to apply it to: they are worked out from the tables rather than
   * held in state. Passing one on still returns a new array, which rebuilds
   * the boxes, which are measured again on the next frame. That ran about
   * sixty times a second and kept resetting the auto-save timer, so a change
   * to a table was never saved.
   */
  const changeNodes = useCallback(
    (changes: NodeChange<ErdNode>[]) => {
      const theirs = changes.filter(
        (change) => !("id" in change) || !isSchemaBoxId(change.id)
      )

      if (theirs.length > 0) onNodesChange(theirs)
    },
    [onNodesChange]
  )

  const clickNode = useCallback(
    (_: React.MouseEvent, node: ErdNode) => void bringCloser(node.id),
    [bringCloser]
  )

  // The menu opens after the click, so where the click landed has to be kept
  // for the item that drops a table there.
  const clickPoint = useRef({ x: 0, y: 0 })

  // Where a pasted table goes. A keystroke carries no position of its own, so
  // the pointer is followed and its last resting place is used instead.
  const pointer = useRef<{ x: number; y: number } | null>(null)

  // Both leave the browser's own copy and paste alone unless a table was
  // involved, so text on the page still copies with nothing selected.
  useHotkey(
    HOTKEYS.copy,
    (event) => {
      if (busyElsewhere(event.target)) return

      const copied = copySelection()
      if (copied === 0) return

      event.preventDefault()
      notify.success({
        title: "Copied",
        description: `${tables(copied)} ready to paste.`,
      })
    },
    { preventDefault: false, stopPropagation: false }
  )

  useHotkey(
    HOTKEYS.paste,
    (event) => {
      if (busyElsewhere(event.target)) return

      const at = pointer.current ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      }

      if (pasteTable(screenToFlowPosition(at)) > 0) event.preventDefault()
    },
    { preventDefault: false, stopPropagation: false }
  )

  useHotkey(HOTKEYS.save, () => void sync.save(), {
    enabled: !sync.busy,
    ignoreInputs: true,
  })

  const addTableAtClick = useCallback(() => {
    addTable(screenToFlowPosition(clickPoint.current))
  }, [addTable, screenToFlowPosition])

  // Pasting reads the tables as they are now, which hands it a new function
  // with every change to them. The menu gets one that stays put instead.
  const paste = useRef(pasteTable)

  useEffect(() => {
    paste.current = pasteTable
  })

  const pasteTableAtClick = useCallback(() => {
    paste.current(screenToFlowPosition(clickPoint.current))
  }, [screenToFlowPosition])

  const saveNow = useCallback(() => void latest.current.save(), [])
  const fitAll = useCallback(() => void fitView({ duration: 300 }), [fitView])

  const trackPointer = useCallback((event: React.PointerEvent) => {
    pointer.current = { x: event.clientX, y: event.clientY }
  }, [])

  const trackPress = useCallback((event: React.MouseEvent) => {
    if (event.button === 2) {
      pressed.current = { x: event.clientX, y: event.clientY }
    }
  }, [])

  // The right button both moves the canvas and opens the menu, so the menu has
  // to wait until the button comes up to know which of the two it was. Linux
  // and Windows ask for the menu at opposite ends of the press, which is why
  // both ends are handled: a press still held is kept back and sent on again if
  // it comes up where it went down, and one already let go is read from how far
  // it travelled.
  const pressed = useRef<{ x: number; y: number } | null>(null)
  const sendingOn = useRef(false)

  const holdMenu = useCallback((event: React.MouseEvent) => {
    clickPoint.current = { x: event.clientX, y: event.clientY }

    if (sendingOn.current) return

    const from = pressed.current
    const { clientX: x, clientY: y } = event
    const slipped = from && Math.hypot(from.x - x, from.y - y) > SLIP

    if (!slipped && !(event.buttons & 2)) return

    event.preventDefault()
    event.stopPropagation()

    if (slipped) return

    const target = event.target as Element
    // Pointer events rather than mouse ones. React Flow's pan reaches the
    // window first and stops the mouse release dead, so a listener waiting on
    // one is never called.
    const release = (up: PointerEvent) => {
      if (up.button !== 2) return

      document.removeEventListener("pointerup", release, true)

      if (Math.hypot(up.clientX - x, up.clientY - y) > SLIP) return

      sendingOn.current = true
      target.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: 2,
        })
      )
      sendingOn.current = false
    }

    document.addEventListener("pointerup", release, true)
  }, [])

  const { diagnostics, checked, dismissDiagnostics } = sync
  const generate = useCallback(() => void latest.current.generate(), [])

  // Held back on a fresh load until the loader is gone, since coming in
  // while the page is still busy loading it arrives in a jump.
  const problemsMenu = useMemo(
    () =>
      autoValidate && loading === "gone"
        ? { diagnostics, checked, onDismiss: dismissDiagnostics }
        : undefined,
    [autoValidate, loading, diagnostics, checked, dismissDiagnostics]
  )

  const addTableAtCentre = useCallback(() => {
    addTable(
      screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
    )
  }, [addTable, screenToFlowPosition])

  // Only a keyboard reader gets focus handed back when the dialog closes. A
  // pointer never asked for it, and the bar under it reads that focus as a
  // reason to come up with its tooltip open.
  const openSettings = useCallback((open: boolean, byKeyboard = false) => {
    if (open) setSettingsByKeyboard(byKeyboard)
    setSettingsOpen(open)
  }, [])

  // The list's open state and width come from local storage, so the server
  // paints the graph alone and the list joins it once the browser is in.
  const flow = (
    <ReactFlow
      id={TOUR.canvas}
      nodes={drawn}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={changeNodes}
      onNodeClick={clickNode}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      colorMode={theme}
      fitView
      onInit={() => setLoading("glass")}
      deleteKeyCode={DELETE_KEYS}
      snapToGrid={snapToGrid}
      // Waiting a pixel before the drag starts costs the table the ground
      // the pointer covered getting there, which it then trails by for the
      // rest of the drag.
      nodeDragThreshold={0}
      snapGrid={SNAP_GRID}
      // The wheel scrolls the diagram the way a wheel scrolls anything
      // else, and ctrl with it zooms.
      panOnScroll
      panOnDrag={PAN_BUTTONS}
      selectionOnDrag
      minZoom={0.5}
      maxZoom={2}
      defaultEdgeOptions={EDGE_DEFAULTS}
      connectionLineComponent={ConnectionLine}
      connectionRadius={40}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      {background !== "none" && (
        <Background
          gap={16}
          variant={background}
          // The pattern only. The rect that carries it is the size of the
          // canvas, and a stroke on that is a line drawn around the whole
          // thing.
          className="opacity-50 [&>pattern]:stroke-muted-foreground"
          color="inherit"
        />
      )}
      {showMiniMap && (
        <MiniMap
          pannable
          zoomable
          // A click carries the canvas over to that spot with an ease,
          // where dragging the map keeps it on the pointer.
          onClick={(_, position) =>
            void setCenter(position.x, position.y, {
              zoom: getZoom(),
              duration: 300,
            })
          }
          bgColor="var(--card)"
          nodeColor={miniMapNodeColor}
          maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
          className="rounded-md border border-border"
        />
      )}
    </ReactFlow>
  )

  // The list's open state and width come from local storage, so the server
  // paints the graph alone and the list joins it once the browser is in.
  const graph = (
    <FlowProvider value={flow}>
      <div className="relative h-full w-full">
        <GraphMenu
          copied={clipboard ? clipboard.nodes.length : null}
          busy={sync.busy}
          onPointerMove={trackPointer}
          onMouseDownCapture={trackPress}
          onContextMenuCapture={holdMenu}
          onAddTable={addTableAtClick}
          onPaste={pasteTableAtClick}
          onSave={saveNow}
          onFit={fitAll}
        />

        {loaderShown && (
          <CanvasSkeleton
            aria-hidden
            phase={loading}
            className="absolute inset-0 z-10"
          />
        )}

        {/* Flush with the edge, since the bar keeps the gap itself and
            needs the wrapper out of the way to slide past it. The wrapper
            keeps the size of the bar while it is down, so it stops taking
            the pointer and leaves the canvas under it clickable. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center">
          <SchemaToolbar
            generating={sync.generating}
            onAddTable={addTableAtCentre}
            onGenerate={generate}
            settingsOpen={settingsOpen}
            onSettingsOpenChange={openSettings}
            raised={tour.active}
            diagnostics={problemsMenu}
          />
        </div>
        {showControls && (
          <div className="absolute bottom-[15px] left-[15px] z-20">
            <CanvasControls />
          </div>
        )}
      </div>
    </FlowProvider>
  )

  return (
    <ProblemsProvider value={sync.problems}>
      <ConnectorArrowProvider value={connectorArrow}>
        <EdgeLineProvider value={edgeStyle}>
          <GraphActionsProvider value={actions}>
            <div className="relative flex h-full w-full overflow-hidden">
              <ClientOnly
                fallback={
                  <>
                    <div className="h-full w-full">{graph}</div>
                    <SidebarButtonSkeleton />
                  </>
                }
              >
                <SchemaSidebar
                  name={name}
                  nodes={nodes}
                  active={listChosen}
                  open={schemaListOpen}
                  onOpenChange={(open) =>
                    setCanvasPreference("schemaListOpen", open)
                  }
                  width={schemaListWidth}
                  onWidthChange={(width) =>
                    setCanvasPreference("schemaListWidth", width)
                  }
                >
                  {graph}
                </SchemaSidebar>
              </ClientOnly>
            </div>

            <CanvasSettings
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              returnFocus={settingsByKeyboard}
              showMiniMap={showMiniMap}
              onShowMiniMapChange={setShowMiniMap}
              showControls={showControls}
              onShowControlsChange={setShowControls}
              background={background}
              onBackgroundChange={setBackground}
              schemaGrouping={schemaGrouping}
              onSchemaGroupingChange={setSchemaGrouping}
              snapToGrid={snapToGrid}
              onSnapToGridChange={setSnapToGrid}
              autoSave={autoSave}
              onAutoSaveChange={setAutoSave}
              autoValidate={autoValidate}
              onAutoValidateChange={changeAutoValidate}
              connectorArrow={connectorArrow}
              onConnectorArrowChange={setConnectorArrow}
              edgeLine={edgeLine}
              onEdgeLineChange={setEdgeLine}
              edgeLabels={edgeLabels}
              onEdgeLabelsChange={setEdgeLabels}
              edgeDash={edgeDash}
              onEdgeDashChange={setEdgeDash}
            />

            <GeneratedSqlDialog ddl={sync.ddl} onClose={sync.closeDdl} />
            <CanvasTour />
            <BackendWatch onReconnect={reconnected} />
          </GraphActionsProvider>
        </EdgeLineProvider>
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
  const { schemaGrouping, schemaListOpen } = useCanvasPreferences()

  // Three of the stops are on the list, and a list that is folded away would
  // have them passed over. The wait is the fold animation, and the list goes
  // back the way it was found once the tour is over.
  const showList = useCallback(async () => {
    if (schemaGrouping !== "list" || schemaListOpen) return undefined

    setCanvasPreference("schemaListOpen", true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    return () => setCanvasPreference("schemaListOpen", false)
  }, [schemaGrouping, schemaListOpen])

  return (
    <ReactFlowProvider>
      <TourProvider storageKey="erd-tour" prepare={showList}>
        <Canvas diagram={diagram} schema={schema} />
      </TourProvider>
    </ReactFlowProvider>
  )
}
