// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { act, cleanup, renderHook } from "@testing-library/react"

import { useSchemaSync } from "@/features/erd/hooks/use-schema-sync"
import type { ErdEdge, ErdNode, ErdTableNode } from "@/features/erd/types/erd"

// `vi.mock` is hoisted above the file, so the spy has to be hoisted with it.
const { updateSchema, validateSchema } = vi.hoisted(() => ({
  updateSchema: vi.fn(() => Promise.resolve({ id: "schema-1" })),
  validateSchema: vi.fn(
    (): Promise<{
      valid?: boolean
      diagnostics?: unknown[]
      unavailable?: string
    }> => Promise.resolve({ valid: true, diagnostics: [] })
  ),
}))

vi.mock("@/server/rpc/schema", () => ({
  updateSchema,
  validateSchema,
  createSchema: () => Promise.resolve({ id: "schema-1" }),
  generateDdl: () => Promise.resolve({ ddl: "", diagnostics: [] }),
}))

vi.mock("@/lib/toast", () => ({
  notify: {
    waiting: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

const table: ErdTableNode = {
  id: "table-users",
  type: "table",
  position: { x: 0, y: 0 },
  data: {
    id: 1,
    schema: "public",
    name: "users",
    columns: [
      {
        id: "users-id",
        name: "id",
        format: "uuid",
        isPrimary: true,
        isNullable: false,
        isUnique: true,
        isIdentity: false,
      },
    ],
  },
}

const edges: ErdEdge[] = []

function sync({
  autoSave = true,
  autoValidate = false,
  unavailable = () => {},
} = {}) {
  return renderHook(
    ({ nodes }: { nodes: ErdNode[] }) =>
      useSchemaSync({
        schemaId: "schema-1",
        name: "shop",
        nodes,
        edges,
        autoSave,
        autoValidate,
        onSaved: () => {},
        onValidateUnavailable: unavailable,
      }),
    { initialProps: { nodes: [table] as ErdNode[] } }
  )
}

/** Past the debounce, plus the microtasks the save itself waits on. */
async function settle() {
  await act(async () => {
    vi.advanceTimersByTime(2000)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  updateSchema.mockClear()
  validateSchema.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

test("loading a diagram does not save it back", async () => {
  sync()
  await settle()

  expect(updateSchema).not.toHaveBeenCalled()
})

test("an edit saves once the canvas settles", async () => {
  const { rerender } = sync()

  rerender({ nodes: [{ ...table, position: { x: 120, y: 40 } }] })
  await settle()

  expect(updateSchema).toHaveBeenCalledTimes(1)
})

test("selecting a table is not an edit", async () => {
  const { rerender } = sync()

  // React Flow reports selection as a node change, so the array is new while
  // the diagram it describes is not.
  rerender({ nodes: [{ ...table, selected: true }] })
  await settle()

  expect(updateSchema).not.toHaveBeenCalled()
})

test("a run of edits is one save, not one per change", async () => {
  const { rerender } = sync()

  for (const x of [10, 20, 30, 40]) {
    rerender({ nodes: [{ ...table, position: { x, y: 0 } }] })
    await act(async () => {
      vi.advanceTimersByTime(200)
    })
  }

  await settle()

  expect(updateSchema).toHaveBeenCalledTimes(1)
})

test("turning auto-save off stops the writing", async () => {
  const { rerender } = sync({ autoSave: false })

  rerender({ nodes: [{ ...table, position: { x: 120, y: 40 } }] })
  await settle()

  expect(updateSchema).not.toHaveBeenCalled()
})

test("auto-validate checks the diagram it opened with", async () => {
  sync({ autoValidate: true })
  await settle()

  expect(validateSchema).toHaveBeenCalledTimes(1)
})

test("auto-validate skips a change the diagram did not feel", async () => {
  const { rerender } = sync({ autoValidate: true })
  await settle()

  rerender({ nodes: [{ ...table, selected: true }] })
  await settle()

  expect(validateSchema).toHaveBeenCalledTimes(1)
})

test("auto-validate rechecks after an edit", async () => {
  const { rerender } = sync({ autoValidate: true })
  await settle()

  rerender({ nodes: [{ ...table, position: { x: 120, y: 40 } }] })
  await settle()

  expect(validateSchema).toHaveBeenCalledTimes(2)
})

test("turning auto-validate off stops the checking", async () => {
  const { rerender } = sync()

  rerender({ nodes: [{ ...table, position: { x: 120, y: 40 } }] })
  await settle()

  expect(validateSchema).not.toHaveBeenCalled()
})

test("a backend that cannot validate says so", async () => {
  validateSchema.mockResolvedValueOnce({ unavailable: "Not built yet" })
  const unavailable = vi.fn()

  sync({ autoValidate: true, unavailable })
  await settle()

  expect(unavailable).toHaveBeenCalled()
})

test("a validation that throws says so", async () => {
  validateSchema.mockRejectedValueOnce(new Error("No answer"))
  const unavailable = vi.fn()

  sync({ autoValidate: true, unavailable })
  await settle()

  expect(unavailable).toHaveBeenCalled()
})
