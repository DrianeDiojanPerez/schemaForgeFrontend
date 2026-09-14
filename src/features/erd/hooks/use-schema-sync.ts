import { useCallback, useEffect, useRef, useState } from "react"

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
  autoSave: boolean
  autoValidate: boolean
  onSaved: (schemaId: string) => void
  /** The backend could not answer a validation, so nothing will mark the tables. */
  onValidateUnavailable: () => void
}

// Long enough that dragging a table across the canvas is one round rather than
// one per frame the pointer rested on.
const AUTO_DELAY = 1500

/** Empty when the diagram cannot be sent at all, which never matches a write. */
function draftKey(name: string, nodes: ErdNode[], edges: ErdEdge[]): string {
  const result = toDraft(name, "", nodes, edges)

  return result.ok ? JSON.stringify(result.draft) : ""
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
  autoSave,
  autoValidate,
  onSaved,
  onValidateUnavailable,
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

  // What the last write put on the server. The diagram it was loaded with
  // counts as already there, so arriving at one does not save it back.
  const sent = useRef<string | null>(null)
  sent.current ??= draftKey(name, nodes, edges)

  /**
   * `quiet` drops the progress and success toasts, which is what makes a save
   * every time the canvas settles bearable. Failures still speak: silence
   * there would read as work having been stored when it was not.
   */
  const save = useCallback(
    async (quiet = false) => {
      const draft = draftOrReport()
      if (!draft) return

      const key = JSON.stringify(draft)

      // Selecting a table and measuring one both reach here as changes, so an
      // automatic save has to look at what it would send before it writes.
      if (quiet && key === sent.current) return

      setBusy(true)
      if (!quiet) notify.waiting({ title: "Saving" })

      try {
        const saved = schemaId
          ? await updateSchema({ data: { ...draft, id: schemaId } })
          : await createSchema({ data: draft })

        sent.current = key
        onSaved(saved.id)
        if (!quiet) notify.success({ title: "Saved", description: draft.name })
      } catch (error) {
        failed("Save failed", error)
      } finally {
        setBusy(false)
      }
    },
    [draftOrReport, schemaId, onSaved]
  )

  /** The last diagram checked, so settling on one twice only asks once. */
  const checked = useRef<string | null>(null)

  /**
   * Quiet runs say nothing at all. The defects land in the panel and on the
   * tables that hold them, which is the same answer without a toast for every
   * pause in typing.
   *
   * A backend that cannot answer is reported either way, because the marks it
   * was asked for are not coming and the canvas gives no sign of that.
   */
  const validate = useCallback(
    async (quiet = false) => {
      const draft = draftOrReport()
      if (!draft) return

      const key = JSON.stringify(draft)
      if (quiet && key === checked.current) return

      setBusy(true)
      if (!quiet) notify.waiting({ title: "Validating" })

      try {
        const report = await validateSchema({
          data: { draft: { ...EMPTY_SCHEMA, ...draft, id: schemaId } },
        })

        if (report.unavailable) {
          notify.info({
            title: "Not built yet",
            description: report.unavailable,
          })
          onValidateUnavailable()
          return
        }

        checked.current = key
        setDiagnostics(report.diagnostics)
        setProblems(problemsByTable(draft, report.diagnostics))
        if (quiet) return

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
        onValidateUnavailable()
      } finally {
        setBusy(false)
      }
    },
    [draftOrReport, schemaId, onValidateUnavailable]
  )

  // Both callbacks take a new identity whenever the diagram does, so the timer
  // reaches them through a ref. Keying the effect on them instead would mean
  // storing the id from one save scheduled the next.
  const latest = useRef({ save, validate, busy })

  useEffect(() => {
    latest.current = { save, validate, busy }
  })

  // Saving first, so what the backend is asked about is what it was just told.
  useEffect(() => {
    if (!autoSave && !autoValidate) return

    const timer = setTimeout(() => {
      if (latest.current.busy) return

      void (async () => {
        if (autoSave) await latest.current.save(true)
        if (autoValidate) await latest.current.validate(true)
      })()
    }, AUTO_DELAY)

    return () => clearTimeout(timer)
  }, [autoSave, autoValidate, name, nodes, edges])

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
