import { useCallback } from "react"
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react"
import type { Connection, XYPosition } from "@xyflow/react"

import { newColumn, newTable } from "../lib/new-nodes"
import { isTableNode } from "../lib/node-guards"
import type { ErdDiagram, ErdEdge, ErdNode } from "../types/erd"

const stripHandleSide = (handle: string): string =>
  handle.replace(/-(left|right|top|bottom)$/, "")

export function useErdGraph(diagram: ErdDiagram) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ErdNode>(diagram.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<ErdEdge>(diagram.edges)

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection
      if (!sourceHandle || !targetHandle) return

      // Dropping a connection on a column is how a foreign key gets made, so
      // the target column has to pick up the marker as well as the edge.
      const targetColumnId = stripHandleSide(targetHandle)
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== target || !isTableNode(node)) return node
          return {
            ...node,
            data: {
              ...node.data,
              columns: node.data.columns.map((col) =>
                col.id === targetColumnId ? { ...col, isForeignKey: true } : col
              ),
            },
          }
        })
      )

      setEdges((current) =>
        addEdge<ErdEdge>(
          {
            ...connection,
            id: `e${source}-${target}-${Date.now()}`,
            type: "relationship",
            animated: true,
            data: { relationshipType: "one-to-many" },
            style: { stroke: "var(--primary)", strokeWidth: 1.5 },
          },
          current
        )
      )
    },
    [setEdges, setNodes]
  )

  const addTable = useCallback(
    (position: XYPosition) => {
      setNodes((current) => [...current, newTable(position, current)])
    },
    [setNodes]
  )

  const addColumn = useCallback(
    (nodeId: string) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId || !isTableNode(node)) return node

          const taken = new Set(node.data.columns.map((col) => col.name))

          return {
            ...node,
            data: {
              ...node.data,
              columns: [...node.data.columns, newColumn(taken)],
            },
          }
        })
      )
    },
    [setNodes]
  )

  const removeTable = useCallback(
    (nodeId: string) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId))
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        )
      )
    },
    [setEdges, setNodes]
  )

  // Edges hang off a column, so dropping one without its edges would leave
  // relationships pointing at a handle that is no longer rendered.
  const removeColumn = useCallback(
    (nodeId: string, columnId: string) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId || !isTableNode(node)) return node

          return {
            ...node,
            data: {
              ...node.data,
              columns: node.data.columns.filter((col) => col.id !== columnId),
            },
          }
        })
      )

      setEdges((current) =>
        current.filter(
          (edge) =>
            !(
              (edge.source === nodeId &&
                stripHandleSide(edge.sourceHandle ?? "") === columnId) ||
              (edge.target === nodeId &&
                stripHandleSide(edge.targetHandle ?? "") === columnId)
            )
        )
      )
    },
    [setEdges, setNodes]
  )

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addTable,
    addColumn,
    removeTable,
    removeColumn,
  }
}
