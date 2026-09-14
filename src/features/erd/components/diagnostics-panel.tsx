import { XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Diagnostic } from "@/features/schema/types/schema"

export type DiagnosticsPanelProps = {
  diagnostics: Diagnostic[]
  onDismiss: () => void
}

export function DiagnosticsPanel({
  diagnostics,
  onDismiss,
}: DiagnosticsPanelProps) {
  const errors = diagnostics.filter((item) => item.severity === "ERROR").length

  return (
    <div className="nodrag nopan w-96 rounded-md border border-border bg-card shadow-md">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Diagnostics</span>
        <Badge variant={errors > 0 ? "destructive" : "secondary"}>
          {diagnostics.length}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss diagnostics"
          className="ml-auto"
          onClick={onDismiss}
        >
          <XIcon />
        </Button>
      </header>

      <ScrollArea className="max-h-56">
        <ul className="divide-y divide-border">
          {diagnostics.map((diagnostic, index) => (
            <li
              key={`${diagnostic.code}-${index}`}
              className="flex flex-col gap-0.5 px-3 py-2"
            >
              <span className="font-mono text-[10px] text-muted-foreground">
                {diagnostic.code}
              </span>
              <span
                className={
                  diagnostic.severity === "ERROR"
                    ? "text-xs text-destructive"
                    : "text-xs text-foreground"
                }
              >
                {diagnostic.message}
              </span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
