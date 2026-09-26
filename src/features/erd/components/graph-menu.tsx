import { createContext, memo, use } from "react"
import type { ReactNode } from "react"
import { ClipboardIcon, MaximizeIcon, PlusIcon, SaveIcon } from "lucide-react"
import { ClientOnly } from "@tanstack/react-router"
import { formatForDisplay } from "@tanstack/react-hotkeys"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { HOTKEYS } from "../lib/hotkeys"

// The flow comes down this way rather than as a child, so the menu round it
// sees the same props from one frame of a drag to the next and is left alone,
// while the flow itself is drawn again with the tables.
const FlowContext = createContext<ReactNode>(null)

export const FlowProvider = FlowContext.Provider

function Flow() {
  return use(FlowContext)
}

export function tables(count: number) {
  return `${count} ${count === 1 ? "table" : "tables"}`
}

export type GraphMenuProps = {
  /** How many tables the clipboard holds, or nothing while it is empty. */
  copied: number | null
  busy: boolean
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void
  onMouseDownCapture: (event: React.MouseEvent<HTMLDivElement>) => void
  onContextMenuCapture: (event: React.MouseEvent<HTMLDivElement>) => void
  onAddTable: () => void
  onPaste: () => void
  onSave: () => void
  onFit: () => void
}

/** The right-click menu of the canvas, wrapped round the flow. */
export const GraphMenu = memo(function GraphMenu({
  copied,
  busy,
  onPointerMove,
  onMouseDownCapture,
  onContextMenuCapture,
  onAddTable,
  onPaste,
  onSave,
  onFit,
}: GraphMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            className="absolute inset-0"
            onPointerMove={onPointerMove}
            onMouseDownCapture={onMouseDownCapture}
            onContextMenuCapture={onContextMenuCapture}
          />
        }
      >
        {/* React Flow measures the DOM to lay the graph out, so there is
            nothing useful it can render on the server. */}
        <ClientOnly fallback={null}>
          <Flow />
        </ClientOnly>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={onAddTable}>
          <PlusIcon />
          New table
        </ContextMenuItem>
        {copied !== null && (
          <ContextMenuItem onClick={onPaste}>
            <ClipboardIcon />
            Paste {tables(copied)}
            <ContextMenuShortcut>
              {formatForDisplay(HOTKEYS.paste)}
            </ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {/* Auto-save can be switched off, and there is no Save button any
            more, so this is the only way back to a deliberate write. */}
        <ContextMenuItem disabled={busy} onClick={onSave}>
          <SaveIcon />
          Save
          <ContextMenuShortcut>
            {formatForDisplay(HOTKEYS.save)}
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onFit}>
          <MaximizeIcon />
          Fit to screen
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
})
