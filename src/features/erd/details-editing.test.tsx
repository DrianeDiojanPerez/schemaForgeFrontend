// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest"
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import { ReactFlowProvider, useNodes } from "@xyflow/react"

import {
  ColumnDetailsDialog,
  DescriptionDialog,
} from "@/features/erd/components/details-dialogs"
import { TableNode } from "@/features/erd/components/table-node"
import { useErdGraph } from "@/features/erd/hooks/use-erd-graph"
import type {
  ErdDiagram,
  ErdTableNode,
  TableColumn,
} from "@/features/erd/types/erd"

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(cleanup)

const column = (overrides: Partial<TableColumn>): TableColumn => ({
  id: "col",
  name: "col",
  format: "text",
  isPrimary: false,
  isNullable: true,
  isUnique: false,
  isIdentity: false,
  ...overrides,
})

const users: ErdTableNode = {
  id: "table-users",
  type: "table",
  position: { x: 0, y: 0 },
  data: {
    id: 1,
    schema: "public",
    name: "users",
    columns: [column({ id: "users-id", name: "id", format: "uuid" })],
  },
}

const posts: ErdTableNode = {
  id: "table-posts",
  type: "table",
  position: { x: 300, y: 0 },
  data: {
    id: 2,
    schema: "public",
    name: "posts",
    columns: [
      column({ id: "posts-id", name: "id", format: "uuid" }),
      column({ id: "posts-user-id", name: "user_id", format: "uuid" }),
    ],
  },
}

const diagram: ErdDiagram = {
  nodes: [users, posts],
  edges: [
    {
      id: "written-by",
      source: "table-users",
      sourceHandle: "users-id-right",
      target: "table-posts",
      targetHandle: "posts-user-id-left",
      type: "relationship",
    },
  ],
}

const graph = () =>
  renderHook(() => useErdGraph(diagram), { wrapper: ReactFlowProvider })

const userId = (nodes: unknown[]) =>
  (nodes[nodes.length - 1] as ErdTableNode).data.columns[1]

test("the column an edge lands on is marked as a foreign key", () => {
  const { result } = graph()

  expect(userId(result.current.nodes).isForeignKey).toBe(true)
})

test("deleting the relationship clears the foreign key mark", () => {
  const { result } = graph()

  act(() => {
    result.current.onEdgesChange([{ type: "remove", id: "written-by" }])
  })

  expect(result.current.edges).toHaveLength(0)
  expect(userId(result.current.nodes).isForeignKey).toBe(false)
})

test("deleting the referenced table clears the mark on the other table", () => {
  const { result } = graph()

  act(() => {
    result.current.removeTable("table-users")
  })

  expect(result.current.nodes).toHaveLength(1)
  expect(userId(result.current.nodes).isForeignKey).toBe(false)
})

function Probe() {
  const nodes = useNodes<ErdTableNode>()

  return (
    <output data-testid="columns">
      {JSON.stringify(nodes[0]?.data.columns ?? [])}
    </output>
  )
}

test("making a column the primary key also makes it not null", async () => {
  const table: ErdTableNode = {
    ...users,
    data: {
      ...users.data,
      columns: [column({ id: "users-code", name: "code", isNullable: true })],
    },
  }

  render(
    <ReactFlowProvider initialNodes={[table]} defaultNodes={[table]}>
      <TableNode
        {...({
          id: table.id,
          data: table.data,
        } as unknown as React.ComponentProps<typeof TableNode>)}
      />
      <Probe />
    </ReactFlowProvider>
  )

  // The card is the first trigger and the column row is the second.
  const row = document.querySelectorAll('[data-slot="context-menu-trigger"]')[1]

  await act(async () => {
    fireEvent.contextMenu(row)
  })

  await act(async () => {
    fireEvent.click(
      screen.getByRole("menuitemcheckbox", { name: "Primary key" })
    )
  })

  const [saved] = JSON.parse(
    screen.getByTestId("columns").textContent
  ) as TableColumn[]

  expect(saved).toMatchObject({ isPrimary: true, isNullable: false })
})

test("the description dialog trims what it saves and clears a blank one", async () => {
  const onSave = vi.fn()

  render(
    <DescriptionDialog
      title="Relationship details"
      subject="One to Many relationship"
      withName
      details={{ name: "places", description: "old" }}
      onSave={onSave}
      onClose={() => {}}
    />
  )

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "  writes  " },
  })
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "   " },
  })
  fireEvent.click(screen.getByRole("button", { name: "Save" }))

  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      name: "writes",
      description: undefined,
    })
  )
})

test("the column dialog only asks for the parameters the type takes", async () => {
  const onSave = vi.fn()

  render(
    <ColumnDetailsDialog
      tableName="users"
      column={column({ name: "email", format: "varchar" })}
      onSave={onSave}
      onClose={() => {}}
    />
  )

  expect(screen.queryByLabelText("Precision")).toBeNull()

  fireEvent.change(screen.getByLabelText("Length"), {
    target: { value: "120" },
  })
  fireEvent.change(screen.getByLabelText("Description"), {
    target: { value: "Used to sign in" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Save" }))

  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      description: "Used to sign in",
      length: 120,
      precision: undefined,
      scale: undefined,
      defaultValue: undefined,
    })
  )
})

test("the column dialog refuses a length that is not a whole number", async () => {
  const onSave = vi.fn()

  render(
    <ColumnDetailsDialog
      tableName="users"
      column={column({ name: "email", format: "varchar" })}
      onSave={onSave}
      onClose={() => {}}
    />
  )

  fireEvent.change(screen.getByLabelText("Length"), {
    target: { value: "1.5" },
  })

  await screen.findByText("A whole number of 1 or more")
  expect(screen.getByRole("button", { name: "Save" })).toHaveProperty(
    "disabled",
    true
  )

  fireEvent.click(screen.getByRole("button", { name: "Save" }))
  await act(() => Promise.resolve())

  expect(onSave).not.toHaveBeenCalled()
})
