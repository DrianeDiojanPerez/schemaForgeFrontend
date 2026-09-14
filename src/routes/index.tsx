import { ClientOnly, createFileRoute } from "@tanstack/react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { ErdCanvas } from "@/features/erd/components/erd-canvas"
import { exampleSchema1 } from "@/features/erd/data/examples"

export const Route = createFileRoute("/")({ component: SchemaBuilderPage })

function SchemaBuilderPage() {
  return (
    <main className="h-svh w-full">
      {/* React Flow measures the DOM to lay the graph out, so there is
          nothing useful it can render on the server. */}
      <ClientOnly
        fallback={<Skeleton className="h-full w-full rounded-none" />}
      >
        <ErdCanvas diagram={exampleSchema1} />
      </ClientOnly>
    </main>
  )
}
