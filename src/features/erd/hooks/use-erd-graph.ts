import { useCallback } from "react"
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react"
import type { Connection } from "@xyflow/react"

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

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  }
}
