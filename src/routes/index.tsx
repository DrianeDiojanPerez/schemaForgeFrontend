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
}

export const Route = createFileRoute("/")({
  /**
   * Loads the most recently updated schema.
   *
   * The loader runs on the server, so the first paint already has the diagram
   * rather than flashing an empty canvas while a client fetch resolves.
   *
   * A backend that is down falls back to the example rather than an error
   * page, so the canvas stays usable offline. The connection is reported by
   * the startup check and in the settings, so nothing is said about it here.
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
    } catch {
      return example
    }
  },
  component: SchemaBuilderPage,
})

function SchemaBuilderPage() {
  const { diagram, schema } = Route.useLoaderData()

  return (
    <main className="h-svh w-full">
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
