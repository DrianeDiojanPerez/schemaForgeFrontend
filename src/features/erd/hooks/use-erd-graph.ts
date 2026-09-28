import { useCallback, useEffect, useState } from "react";
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react";
import type { Connection, XYPosition } from "@xyflow/react";

import { markForeignKeys, stripHandleSide } from "../lib/foreign-keys";
import { copyOfTables, newColumn, newTable } from "../lib/new-nodes";
import { isTableNode } from "../lib/node-guards";
import type { ErdDiagram, ErdEdge, ErdNode, ErdTableNode, TableNodeData } from "../types/erd";

type Clipboard = { nodes: ErdTableNode[]; edges: ErdEdge[] };

export function useErdGraph(diagram: ErdDiagram) {
	const [nodes, setNodes, onNodesChange] = useNodesState<ErdNode>(diagram.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState<ErdEdge>(diagram.edges);
	const [clipboard, setClipboard] = useState<Clipboard | null>(null);

	useEffect(() => {
		setNodes((current) => markForeignKeys(current, edges));
	}, [edges, setNodes]);

	const onConnect = useCallback(
		(connection: Connection) => {
			const { source, target, sourceHandle, targetHandle } = connection;
			if (!sourceHandle || !targetHandle) return;

			// A row has a handle on all four sides, and a drop that snapped to the
			// one on its top or bottom edge would hang the line off the edge of the
			// row. The line finds its own way round the tables, so the side kept
			// here only sets the height, and the side handles sit at the middle.
			const level = (handle: string) => `${stripHandleSide(handle)}-left`;

			setEdges((current) =>
				addEdge<ErdEdge>(
					{
						...connection,
						sourceHandle: level(sourceHandle),
						targetHandle: level(targetHandle),
						id: `e${source}-${target}-${Date.now()}`,
						type: "relationship",
						animated: true,
						data: { relationshipType: "one-to-many" },
						style: { stroke: "var(--primary)", strokeWidth: 1.5 },
					},
					current,
				),
			);
		},
		[setEdges],
	);

	const addTable = useCallback(
		(position: XYPosition) => {
			setNodes((current) => [...current, newTable(position, current)]);
		},
		[setNodes],
	);

	const copyTable = useCallback((data: TableNodeData) => {
		setClipboard({
			nodes: [
				{
					id: `copied-${data.name}`,
					type: "table",
					position: { x: 0, y: 0 },
					data,
				},
			],
			edges: [],
		});
	}, []);

	// Relationships come along only when both of their tables do, which is why
	// the edges are taken here rather than worked out at paste time from a
	// selection that has since moved on.
	const copySelection = useCallback(() => {
		const picked = nodes.filter(
			(node): node is ErdTableNode => Boolean(node.selected) && isTableNode(node),
		);

		if (picked.length === 0) return 0;

		const ids = new Set(picked.map((node) => node.id));

		setClipboard({
			nodes: picked,
			edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
		});

		return picked.length;
	}, [edges, nodes]);

	// The copies come in selected and everything else is let go, so the next
	// drag moves what was just pasted and a second paste follows the first.
	const pasteTable = useCallback(
		(position: XYPosition) => {
			if (!clipboard) return 0;

			const made = copyOfTables(clipboard.nodes, clipboard.edges, position, nodes);

			setNodes((current) => [
				...current.map((node) => (node.selected ? { ...node, selected: false } : node)),
				...made.nodes,
			]);

			if (made.edges.length > 0) {
				setEdges((current) => [...current, ...made.edges]);
			}

			return made.nodes.length;
		},
		[clipboard, nodes, setEdges, setNodes],
	);

	const addColumn = useCallback(
		(nodeId: string) => {
			setNodes((current) =>
				current.map((node) => {
					if (node.id !== nodeId || !isTableNode(node)) return node;

					const taken = new Set(node.data.columns.map((col) => col.name));

					return {
						...node,
						data: {
							...node.data,
							columns: [...node.data.columns, newColumn(taken)],
						},
					};
				}),
			);
		},
		[setNodes],
	);

	const removeTable = useCallback(
		(nodeId: string) => {
			setNodes((current) => current.filter((node) => node.id !== nodeId));
			setEdges((current) =>
				current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
			);
		},
		[setEdges, setNodes],
	);

	// Edges hang off a column, so dropping one without its edges would leave
	// relationships pointing at a handle that is no longer rendered.
	const removeColumn = useCallback(
		(nodeId: string, columnId: string) => {
			setNodes((current) =>
				current.map((node) => {
					if (node.id !== nodeId || !isTableNode(node)) return node;

					return {
						...node,
						data: {
							...node.data,
							columns: node.data.columns.filter((col) => col.id !== columnId),
						},
					};
				}),
			);

			setEdges((current) =>
				current.filter(
					(edge) =>
						!(
							(edge.source === nodeId && stripHandleSide(edge.sourceHandle ?? "") === columnId) ||
							(edge.target === nodeId && stripHandleSide(edge.targetHandle ?? "") === columnId)
						),
				),
			);
		},
		[setEdges, setNodes],
	);

	return {
		nodes,
		edges,
		setNodes,
		setEdges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		addTable,
		clipboard,
		copyTable,
		copySelection,
		pasteTable,
		addColumn,
		removeTable,
		removeColumn,
	};
}
