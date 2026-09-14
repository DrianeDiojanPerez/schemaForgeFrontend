import { useEffect, useMemo, useRef, useState } from "react"
import { Handle, Position, useReactFlow } from "@xyflow/react"
import type { NodeProps } from "@xyflow/react"
import {
  AlertTriangle,
  ChevronDownIcon,
  Circle,
  CircleSlash2,
  Database,
  Fingerprint,
  Hash,
  Key,
  Link2,
  PencilIcon,
  PlusIcon,
  Table2,
  Trash2Icon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { postgresTypeGroups } from "../lib/postgres-types"
import { TABLE_NODE_WIDTH } from "../lib/node-dimensions"
import type { ErdTableNode, TableColumn } from "../types/erd"
import { useConnectorArrows } from "./connector-arrow-context"
import { useGraphActions } from "./graph-actions-context"
import { useNodeProblems } from "./problems-context"

const HIDDEN_CONNECTOR =
  "h-px! w-px! min-w-0! min-h-0! cursor-grab! border-0! opacity-0!"
const ITEM_HEIGHT = "h-[22px]"
const SIDES = ["left", "right", "top", "bottom"] as const

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
  "flex! size-[9px]! min-w-0! min-h-0! items-center justify-center rounded-none! border-0! bg-transparent! text-primary opacity-0 transition-opacity duration-150 group-hover/column:opacity-40 hover:opacity-100! [&.connectingfrom]:opacity-100!"

// Far enough out to clear the border the row draws, so the arrow reads as
// leaving the table rather than sitting on its edge.
const CONNECTOR_OFFSET: Partial<Record<(typeof SIDES)[number], string>> = {
  left: "-left-[6px]!",
  right: "-right-[6px]!",
}
const READABLE_ZOOM = 1.4
const ZOOM_DURATION = 250

const HANDLE_POSITION = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
}

// Spelled out rather than built from the side, so Tailwind's scanner can
// still find these class names in the source.
const HANDLE_OFFSET = {
  left: "left-0!",
  right: "right-0!",
  top: "top-0!",
  bottom: "bottom-0!",
}

function ColumnTypeCombobox({
  nodeId,
  value,
  onValueChange,
}: {
  nodeId: string
  value: string
  onValueChange: (value: string) => void
}) {
  const { fitView, getZoom } = useReactFlow()
  const [open, setOpen] = useState(false)

  // A column imported from SQL can carry a type the picker does not list. It
  // gets a group of its own so the current value stays selectable.
  const groups = useMemo(() => {
    if (postgresTypeGroups.some((group) => group.types.includes(value))) {
      return postgresTypeGroups
    }
    return [{ label: "Current", types: [value] }, ...postgresTypeGroups]
  }, [value])

  // Far enough out, the table is smaller than the popup it anchors. Bring the
  // table up to size first, then open, since the popup would not follow its
  // trigger through the camera animation.
  const openAtReadableZoom = () => {
    if (getZoom() >= READABLE_ZOOM) {
      setOpen(true)
      return
    }
    void fitView({
      nodes: [{ id: nodeId }],
      padding: 0.3,
      duration: ZOOM_DURATION,
    }).then(() => setOpen(true))
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? openAtReadableZoom() : setOpen(false))}
    >
      {/* Closing with Escape hands focus back to the trigger, and the browser
          ring is far too heavy at this size. The text stands in for it. */}
      <PopoverTrigger className="nodrag nopan flex h-4 items-center gap-0.5 rounded-sm px-1 text-[8px] text-muted-foreground transition hover:text-foreground focus-visible:text-foreground focus-visible:outline-none">
        {value}
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
                      onValueChange(type)
                      setOpen(false)
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
  )
}

type ColumnFlag = {
  key: string
  label: string
  icon: LucideIcon
  className: string
  filled?: boolean
  onClick?: () => void
}

const columnFlags = (
  column: TableColumn,
  toggleNullable: () => void
): ColumnFlag[] => {
  const flags: ColumnFlag[] = []

  if (column.isPrimary) {
    flags.push({
      key: "primary",
      label: "Primary key",
      icon: Key,
      className: "text-primary",
    })
  }

  if (column.isForeignKey) {
    flags.push({
      key: "foreign",
      label: "Foreign key",
      icon: Link2,
      className: "text-chart-3",
    })
  }

  if (column.isNullable) {
    flags.push({
      key: "nullable",
      label: "Nullable",
      icon: CircleSlash2,
      className: "text-muted-foreground",
      onClick: toggleNullable,
    })
  } else if (!column.isPrimary) {
    flags.push({
      key: "not-null",
      label: "Not null",
      icon: Circle,
      className: "text-foreground",
      filled: true,
      onClick: toggleNullable,
    })
  }

  if (column.isUnique) {
    flags.push({
      key: "unique",
      label: "Unique",
      icon: Fingerprint,
      className: "text-chart-2",
    })
  }

  if (column.isIdentity) {
    flags.push({
      key: "identity",
      label: "Identity",
      icon: Hash,
      className: "text-chart-4",
    })
  }

  return flags
}

export const TableNode = ({ id, data }: NodeProps<ErdTableNode>) => {
  const { updateNodeData } = useReactFlow<ErdTableNode>()
  const { addColumn, removeTable, removeColumn } = useGraphActions()
  const problems = useNodeProblems(id)
  const arrows = useConnectorArrows()
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editingTableName, setEditingTableName] = useState(false)
  const [tableNameValue, setTableNameValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const tableNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingColumnId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingColumnId])

  useEffect(() => {
    if (editingTableName && tableNameInputRef.current) {
      tableNameInputRef.current.focus()
      tableNameInputRef.current.select()
    }
  }, [editingTableName])

  const saveTableName = () => {
    const next = tableNameValue.trim()
    if (next && next !== data.name) {
      updateNodeData(id, { name: next })
    }
    setEditingTableName(false)
  }

  const saveColumnName = (columnId: string) => {
    const next = editValue.trim()
    const current = data.columns.find((c) => c.id === columnId)?.name
    if (next && next !== current) {
      updateNodeData(id, (node) => ({
        columns: node.data.columns.map((col) =>
          col.id === columnId ? { ...col, name: next } : col
        ),
      }))
    }
    setEditingColumnId(null)
  }

  const toggleColumnNullable = (columnId: string) => {
    updateNodeData(id, (node) => ({
      columns: node.data.columns.map((col) =>
        col.id === columnId ? { ...col, isNullable: !col.isNullable } : col
      ),
    }))
  }

  const saveColumnFormat = (columnId: string, format: string) => {
    updateNodeData(id, (node) => ({
      columns: node.data.columns.map((col) =>
        col.id === columnId ? { ...col, format } : col
      ),
    }))
  }

  if (data.isForeign) {
    return (
      <Badge
        variant="secondary"
        className="relative h-auto rounded-[4px] py-1 text-[0.55rem]"
      >
        {data.name}
        <Handle
          type="target"
          id={data.name}
          position={Position.Left}
          className={HIDDEN_CONNECTOR}
        />
      </Badge>
    )
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
            "relative flex items-center rounded-t-lg bg-muted pr-1 pl-2 text-[0.55rem]",
            ITEM_HEIGHT
          )}
        >
          <div className="flex items-center gap-x-1 whitespace-nowrap">
            <Table2 strokeWidth={1.5} size={12} className="text-foreground" />
            {/* The invisible sizer span sets the wrapper width from the current
              text, so swapping between the label and the input does not move
              anything by a pixel. */}
            <div
              className="relative inline-block h-5 min-w-[2ch] pr-[3px] leading-5 font-medium text-foreground"
              style={{ fontSize: "0.55rem" }}
            >
              <span
                aria-hidden="true"
                className="invisible block whitespace-pre"
              >
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
                    if (e.key === "Enter") saveTableName()
                    else if (e.key === "Escape") setEditingTableName(false)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 m-0 h-full w-full border-0 bg-transparent p-0 leading-5 font-medium text-foreground caret-primary outline-none focus:ring-0"
                  style={{ fontSize: "0.55rem" }}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        className="absolute inset-y-0 left-0 cursor-pointer whitespace-pre transition hover:text-primary"
                        onDoubleClick={() => {
                          setTableNameValue(data.name)
                          setEditingTableName(true)
                        }}
                      />
                    }
                  >
                    {data.name}
                  </TooltipTrigger>
                  <TooltipContent>Double-click to rename</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {problems.length > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="ml-auto flex items-center gap-0.5 pl-1 text-destructive">
                    <AlertTriangle strokeWidth={1.5} size={10} />
                    {problems.length}
                  </span>
                }
              />
              <TooltipContent>
                <ul className="list-inside list-disc">
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </header>

        {data.columns.map((column) => (
          <ContextMenu key={column.id}>
            <ContextMenuTrigger
              render={
                <div
                  className={cn(
                    "group/column relative flex flex-row justify-items-start border-t border-border bg-card text-[8px] leading-5 transition hover:bg-muted",
                    editingColumnId === column.id
                      ? "cursor-text"
                      : "cursor-default",
                    ITEM_HEIGHT
                  )}
                />
              }
            >
              <div className="mx-2 flex min-w-[40px] items-center justify-start gap-[0.24rem] align-middle">
                {columnFlags(column, () => toggleColumnNullable(column.id)).map(
                  (flag) => (
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
                  )
                )}
              </div>

              <div className="flex w-full items-center justify-between gap-3 pr-1">
                <div
                  className="relative inline-block h-5 min-w-[2ch] pr-[3px] leading-5 font-medium"
                  style={{ fontSize: "8px" }}
                >
                  <span
                    aria-hidden="true"
                    className="invisible block whitespace-pre"
                  >
                    {editingColumnId === column.id
                      ? editValue || " "
                      : column.name || " "}
                  </span>
                  {editingColumnId === column.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveColumnName(column.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveColumnName(column.id)
                        else if (e.key === "Escape") setEditingColumnId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute inset-0 m-0 h-full w-full border-0 bg-transparent p-0 text-[8px] leading-5 font-medium text-foreground caret-primary outline-none focus:ring-0"
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span
                            className="absolute inset-y-0 left-0 cursor-pointer whitespace-pre text-foreground transition hover:text-primary"
                            onDoubleClick={() => {
                              setEditingColumnId(column.id)
                              setEditValue(column.name)
                            }}
                          />
                        }
                      >
                        {column.name}
                      </TooltipTrigger>
                      <TooltipContent>Double-click to rename</TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <ColumnTypeCombobox
                  nodeId={id}
                  value={column.format}
                  onValueChange={(format) =>
                    saveColumnFormat(column.id, format)
                  }
                />
              </div>

              {SIDES.map((side) => {
                // Only the two sides an edge is routed along are drawn. Top and
                // bottom stay where they are as targets and stay invisible.
                const Arrow =
                  side === "left"
                    ? arrows.left
                    : side === "right"
                      ? arrows.right
                      : undefined

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
                )
              })}
            </ContextMenuTrigger>

            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => {
                  setEditingColumnId(column.id)
                  setEditValue(column.name)
                }}
              >
                <PencilIcon />
                Rename column
              </ContextMenuItem>
              <ContextMenuItem onClick={() => addColumn(id)}>
                <PlusIcon />
                Add column
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                variant="destructive"
                onClick={() => removeColumn(id, column.id)}
              >
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
              <span className="text-[0.4rem] font-medium text-muted-foreground">
                INDEXES
              </span>
            </div>
            {data.indexes.map((index) => (
              <div
                key={index.name}
                className="border-t border-border px-2 py-1 text-[7px] transition hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-foreground">
                    {index.name}
                  </span>
                  <span className="text-muted-foreground uppercase">
                    {index.type}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  ({index.columns.join(", ")})
                </div>
              </div>
            ))}
          </div>
        )}

        {data.columns.length === 0 && (
          <div className="py-3 text-center text-[0.5rem] text-muted-foreground">
            No columns yet
          </div>
        )}

        <button
          type="button"
          className="nodrag nopan flex items-center justify-center gap-1 rounded-b-lg border-t border-border py-1 text-[8px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
            setTableNameValue(data.name)
            setEditingTableName(true)
          }}
        >
          <PencilIcon />
          Rename table
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={() => removeTable(id)}>
          <Trash2Icon />
          Delete table
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
