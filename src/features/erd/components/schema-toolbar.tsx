import { FileCodeIcon, TablePropertiesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export type SchemaToolbarProps = {
  name: string
  onNameChange: (name: string) => void
  busy: boolean
  onAddTable: () => void
  onGenerate: () => void
}

export function SchemaToolbar({
  name,
  onNameChange,
  busy,
  onAddTable,
  onGenerate,
}: SchemaToolbarProps) {
  return (
    <div className="nodrag nopan flex items-center gap-2 rounded-md border border-border bg-card p-1.5 shadow-sm">
      <Input
        aria-label="Schema name"
        className="h-8 w-48 text-sm"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" onClick={onAddTable}>
        <TablePropertiesIcon />
        New table
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button variant="ghost" size="sm" disabled={busy} onClick={onGenerate}>
        <FileCodeIcon />
        SQL
      </Button>
    </div>
  )
}
