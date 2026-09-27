import { PanelLeftCloseIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The list's toggle where it will be, drawn as the button itself rather
 * than a grey block so the corner looks finished from the first paint. It
 * does nothing until the real one takes its place.
 */
export function SidebarButtonSkeleton() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[15px] left-[15px] z-30"
    >
      <Button variant="ghost" size="icon-sm" tabIndex={-1}>
        <PanelLeftCloseIcon />
      </Button>
    </div>
  )
}
