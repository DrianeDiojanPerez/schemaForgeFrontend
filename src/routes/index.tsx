import { ClientOnly, createFileRoute } from "@tanstack/react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { ErdCanvas } from "@/features/erd/components/erd-canvas"
import { exampleSchema1 } from "@/features/erd/data/examples"
import { toDiagram } from "@/features/erd/lib/schema-adapter"
import type { ErdDiagram } from "@/features/erd/types/erd"
import { getSchema, listSchemas } from "@/server/rpc/schema"

type LoaderData = {
  diagram: ErdDiagram
  schema: { id: string; name: string }
  offline?: string
}

export const Route = createFileRoute("/")({
  /**
   * Loads the most recently updated schema.
   *
   * The loader runs on the server, so the first paint already has the diagram
   * rather than flashing an empty canvas while a client fetch resolves.
   *
   * A backend that is down falls back to the example rather than an error
   * page, so the canvas stays usable offline. Saving will still fail, and say
   * so, which is the honest place for the failure to appear.
   */
  loader: async (): Promise<LoaderData> => {
    const example = {
      diagram: exampleSchema1,
      schema: { id: "", name: "untitled schema" },
    }

    try {
      const listing = await listSchemas({ data: { page: 1, perPage: 1 } })
      const first = listing.schemas.at(0)

      if (!first) return example

      const schema = await getSchema({ data: { id: first.id } })

      return {
        diagram: toDiagram(schema),
        schema: { id: schema.id, name: schema.name },
      }
    } catch (error) {
      return {
        ...example,
        offline: error instanceof Error ? error.message : "Backend unreachable",
      }
    }
  },
  component: SchemaBuilderPage,
})

function SchemaBuilderPage() {
  const { diagram, schema, offline } = Route.useLoaderData()

  return (
    <main className="h-svh w-full">
      {offline && (
        <p
          role="status"
          className="absolute inset-x-0 top-0 z-10 bg-destructive/10 px-3 py-1 text-center text-xs text-destructive"
        >
          Not connected to the backend, showing an example. {offline}
        </p>
      )}
      {/* React Flow measures the DOM to lay the graph out, so there is
          nothing useful it can render on the server. */}
      <ClientOnly
        fallback={<Skeleton className="h-full w-full rounded-none" />}
      >
        <ErdCanvas diagram={diagram} schema={schema} />
      </ClientOnly>
    </main>
  )
}
