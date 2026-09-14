import { useCallback, useState } from "react"

import { EMPTY_SCHEMA } from "@/features/schema/types/schema"
import type { Diagnostic } from "@/features/schema/types/schema"
import { notify } from "@/lib/toast"
import {
  createSchema,
  generateDdl,
  updateSchema,
  validateSchema,
} from "@/server/rpc/schema"

import { problemsByTable, toDraft } from "../lib/schema-adapter"
import type { ErdEdge, ErdNode } from "../types/erd"

type Options = {
  schemaId: string
  name: string
  nodes: ErdNode[]
  edges: ErdEdge[]
  onSaved: (schemaId: string) => void
}

function failed(title: string, error: unknown) {
  notify.error({
    title,
    description:
      error instanceof Error ? error.message : "Something went wrong",
  })
}

/**
 * Save, validate and generate against the backend.
 *
 * Every call sends the picture the canvas is holding rather than a stored id,
 * so what is checked is what is on screen. The draft is rebuilt per call
 * instead of being memoised, because a stale one would report on a diagram the
 * user has already moved on from.
 */
export function useSchemaSync({
  schemaId,
  name,
  nodes,
  edges,
  onSaved,
}: Options) {
  const [busy, setBusy] = useState(false)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [problems, setProblems] = useState<Map<string, string[]>>(new Map())
  const [ddl, setDdl] = useState<string | null>(null)

  /**
   * Reports the columns the backend has no type for instead of translating
   * them, and returns nothing so the caller stops.
   */
  const draftOrReport = useCallback(() => {
    const result = toDraft(name, "", nodes, edges)

    if (result.ok) return result.draft

    const [first, ...rest] = result.unsupported
    const more = rest.length > 0 ? ` and ${rest.length} more` : ""

    notify.error({
      title: "Unsupported column type",
      description: `${first.table}.${first.column} is ${first.format}, which the backend has no type for${more}.`,
    })

    return undefined
  }, [name, nodes, edges])

  const save = useCallback(async () => {
    const draft = draftOrReport()
    if (!draft) return

    setBusy(true)
    notify.waiting({ title: "Saving" })

    try {
      const saved = schemaId
        ? await updateSchema({ data: { ...draft, id: schemaId } })
        : await createSchema({ data: draft })

      onSaved(saved.id)
      notify.success({ title: "Saved", description: draft.name })
    } catch (error) {
      failed("Save failed", error)
    } finally {
      setBusy(false)
    }
  }, [draftOrReport, schemaId, onSaved])

  const validate = useCallback(async () => {
    const draft = draftOrReport()
    if (!draft) return

    setBusy(true)
    notify.waiting({ title: "Validating" })

    try {
      const report = await validateSchema({
        data: { draft: { ...EMPTY_SCHEMA, ...draft, id: schemaId } },
      })

      if (report.unavailable) {
        notify.info({ title: "Not built yet", description: report.unavailable })
        return
      }

      setDiagnostics(report.diagnostics)
      setProblems(problemsByTable(draft, report.diagnostics))

      if (report.valid) {
        notify.success({ title: "No defects found" })
        return
      }

      const count = report.diagnostics.length

      notify.warning({
        title: `${count} defect${count === 1 ? "" : "s"}`,
        description: report.diagnostics.at(0)?.message,
      })
    } catch (error) {
      failed("Could not validate", error)
    } finally {
      setBusy(false)
    }
  }, [draftOrReport, schemaId])

  const generate = useCallback(async () => {
    const draft = draftOrReport()
    if (!draft) return

    setBusy(true)
    notify.waiting({ title: "Generating" })

    try {
      const result = await generateDdl({
        data: { draft: { ...EMPTY_SCHEMA, ...draft, id: schemaId } },
      })

      if (result.unavailable) {
        notify.info({ title: "Not built yet", description: result.unavailable })
        return
      }

      setDiagnostics(result.diagnostics)
      setProblems(problemsByTable(draft, result.diagnostics))
      setDdl(result.ddl)
      notify.success({ title: "Generated" })
    } catch (error) {
      failed("Could not generate", error)
    } finally {
      setBusy(false)
    }
  }, [draftOrReport, schemaId])

  const dismissDiagnostics = useCallback(() => {
    setDiagnostics([])
    setProblems(new Map())
  }, [])

  return {
    busy,
    diagnostics,
    problems,
    ddl,
    closeDdl: () => setDdl(null),
    dismissDiagnostics,
    save,
    validate,
    generate,
  }
}
