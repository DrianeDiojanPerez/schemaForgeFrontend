import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export type GeneratedSqlDialogProps = {
  ddl: string | null
  onClose: () => void
}

export function GeneratedSqlDialog({ ddl, onClose }: GeneratedSqlDialogProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (ddl === null) return

    await navigator.clipboard.writeText(ddl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={ddl !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generated SQL</DialogTitle>
          <DialogDescription>
            Produced by the backend from the schema on the canvas.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96 rounded-md border border-border bg-muted/40">
          <pre className="p-3 font-mono text-xs whitespace-pre">{ddl}</pre>
        </ScrollArea>

        <DialogFooter showCloseButton>
          <Button variant="outline" onClick={() => void copy()}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
