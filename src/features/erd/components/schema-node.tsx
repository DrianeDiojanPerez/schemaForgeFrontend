import { useEffect, useRef, useState } from "react"
import { NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react"
import { Layers } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import type { ErdSchemaNode, SchemaAccent } from "../types/erd"

export const SCHEMA_ACCENTS: SchemaAccent[] = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
]

// Spelled out per accent so Tailwind's scanner can find the class names.
const ACCENTS: Record<
  SchemaAccent,
  { border: string; text: string; tab: string; body: string }
> = {
  "chart-1": {
    border: "border-chart-1/40",
    text: "text-chart-1",
    tab: "bg-chart-1/20",
    body: "bg-chart-1/[0.05]",
  },
  "chart-2": {
    border: "border-chart-2/40",
    text: "text-chart-2",
    tab: "bg-chart-2/20",
    body: "bg-chart-2/[0.05]",
  },
  "chart-3": {
    border: "border-chart-3/40",
    text: "text-chart-3",
    tab: "bg-chart-3/20",
    body: "bg-chart-3/[0.05]",
  },
  "chart-4": {
    border: "border-chart-4/40",
    text: "text-chart-4",
    tab: "bg-chart-4/20",
    body: "bg-chart-4/[0.05]",
  },
  "chart-5": {
    border: "border-chart-5/40",
    text: "text-chart-5",
    tab: "bg-chart-5/20",
    body: "bg-chart-5/[0.05]",
  },
}

export const SchemaNode = ({
  id,
  data,
  selected,
}: NodeProps<ErdSchemaNode>) => {
  const { updateNodeData } = useReactFlow()
  const accent = ACCENTS[data.accent ?? "chart-1"]
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const save = () => {
    const next = draft.trim()
    if (next && next !== data.name) updateNodeData(id, { name: next })
    setEditing(false)
  }

  return (
    <div className="flex h-full w-full flex-col">
      <NodeResizer
        minWidth={140}
        minHeight={90}
        isVisible={selected}
        // Only the corner handles should show. The resizer's own outline
        // would otherwise double up on the schema border.
        lineClassName="border-transparent!"
        handleClassName="w-2! h-2! rounded-sm! bg-primary! border-0!"
      />

      {/* The tab is auto-width on the left and the rest of the row stays
          empty, so the body border shows through beside it and the two read
          as one folder. */}
      <div className="flex shrink-0">
        <div
          className={cn(
            "schema-drag-handle inline-flex max-w-[80%] cursor-move items-center gap-1.5 rounded-t-md border border-b-0 px-2 py-[3px] select-none",
            accent.border,
            accent.tab
          )}
        >
          <Layers size={10} strokeWidth={2.25} className={accent.text} />
          <span className="relative inline-block h-[14px] leading-[14px]">
            <span
              aria-hidden="true"
              className="invisible block text-[10px] font-semibold tracking-wide whitespace-pre"
            >
              {(editing ? draft : data.name) || " "}
            </span>
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save()
                  else if (e.key === "Escape") setEditing(false)
                }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "absolute inset-0 m-0 h-full w-full border-0 bg-transparent p-0 text-[10px] leading-[14px] font-semibold tracking-wide outline-none",
                  accent.text
                )}
                style={{ caretColor: "currentColor" }}
              />
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      className={cn(
                        "absolute inset-0 cursor-pointer text-[10px] font-semibold tracking-wide whitespace-pre",
                        accent.text
                      )}
                      onDoubleClick={() => {
                        setDraft(data.name)
                        setEditing(true)
                      }}
                    />
                  }
                >
                  {data.name}
                </TooltipTrigger>
                <TooltipContent>Double-click to rename</TooltipContent>
              </Tooltip>
            )}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 rounded-tr-md rounded-b-md border transition-colors",
          accent.border,
          accent.body
        )}
      />
    </div>
  )
}
