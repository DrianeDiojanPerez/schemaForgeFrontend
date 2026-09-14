// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest"
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react"
import { ReactFlowProvider } from "@xyflow/react"

import { GraphActionsProvider } from "@/features/erd/components/graph-actions-context"
import { TableNode } from "@/features/erd/components/table-node"
import { useErdGraph } from "@/features/erd/hooks/use-erd-graph"
import type { ErdDiagram, ErdTableNode } from "@/features/erd/types/erd"

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Vitest runs without globals here, so testing-library never registers its own.
// A menu left open in one test swallows the click in the next.
afterEach(cleanup)

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

const diagram: ErdDiagram = {
  nodes: [table],
  edges: [
    {
      id: "e1",
      source: "table-users",
      target: "table-users",
      sourceHandle: "users-id-right",
      targetHandle: "users-id-left",
      type: "relationship",
    },
  ],
}

// React Flow hands a node far more than it reads; these two are all it touches.
const nodeProps = {
  id: table.id,
  data: table.data,
} as unknown as React.ComponentProps<typeof TableNode>

const graph = () =>
  renderHook(() => useErdGraph(diagram), { wrapper: ReactFlowProvider })

test("a new table lands where it was asked for, with a key", () => {
  const { result } = graph()

  act(() => {
    result.current.addTable({ x: 240, y: 80 })
  })

  expect(result.current.nodes).toHaveLength(2)

  const added = result.current.nodes[1] as ErdTableNode
  expect(added.position).toEqual({ x: 240, y: 80 })
  expect(added.data.name).toBe("table_2")
  expect(added.data.columns).toHaveLength(1)
  expect(added.data.columns[0]).toMatchObject({
    name: "id",
    format: "uuid",
    isPrimary: true,
  })
})

test("a new column gets a name nothing else is using", () => {
  const { result } = graph()

  act(() => {
    result.current.addColumn("table-users")
  })
  act(() => {
    result.current.addColumn("table-users")
  })

  const columns = (result.current.nodes[0] as ErdTableNode).data.columns
  expect(columns.map((column) => column.name)).toEqual([
    "id",
    "column_2",
    "column_3",
  ])
  expect(new Set(columns.map((column) => column.id)).size).toBe(3)
})

test("dropping a column drops the edges hanging off it", () => {
  const { result } = graph()

  act(() => {
    result.current.removeColumn("table-users", "users-id")
  })

  expect((result.current.nodes[0] as ErdTableNode).data.columns).toHaveLength(0)
  expect(result.current.edges).toHaveLength(0)
})

test("dropping a table drops its edges too", () => {
  const { result } = graph()

  act(() => {
    result.current.removeTable("table-users")
  })

  expect(result.current.nodes).toHaveLength(0)
  expect(result.current.edges).toHaveLength(0)
})

test("the table shows an add column button that calls through", () => {
  const addColumn = vi.fn()

  render(
    <ReactFlowProvider>
      <GraphActionsProvider
        value={{ addColumn, removeTable: () => {}, removeColumn: () => {} }}
      >
        <TableNode {...nodeProps} />
      </GraphActionsProvider>
    </ReactFlowProvider>
  )

  act(() => {
    screen.getByRole("button", { name: "Add column" }).click()
  })

  expect(addColumn).toHaveBeenCalledWith("table-users")
})

test("right-clicking the table offers its actions and nothing bubbles past", async () => {
  const removeTable = vi.fn()
  const onOuterContextMenu = vi.fn()

  render(
    <ReactFlowProvider>
      <div onContextMenu={onOuterContextMenu}>
        <GraphActionsProvider
          value={{ addColumn: () => {}, removeTable, removeColumn: () => {} }}
        >
          <TableNode {...nodeProps} />
        </GraphActionsProvider>
      </div>
    </ReactFlowProvider>
  )

  // The card wraps the column rows, so it is the outermost trigger.
  const card = document.querySelectorAll(
    '[data-slot="context-menu-trigger"]'
  )[0]

  await act(async () => {
    fireEvent.contextMenu(card)
  })

  for (const label of ["Add column", "Rename table", "Delete table"]) {
    expect(screen.getByRole("menuitem", { name: label })).toBeTruthy()
  }

  // The pane menu sits on an ancestor, so this is what keeps both from opening.
  expect(onOuterContextMenu).not.toHaveBeenCalled()

  await act(async () => {
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete table" }))
  })

  expect(removeTable).toHaveBeenCalledWith("table-users")
})
