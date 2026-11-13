import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { isTableNode } from "../lib/node-guards";
import type { ErdEdge, ErdNode } from "../types/erd";

type Snapshot = { key: string; nodes: ErdNode[]; edges: ErdEdge[] };

const SETTLE = 250;
const LIMIT = 100;

/**
 * What an undo step compares. Selection, drag state and measured sizes are
 * left out, and so is the foreign key mark, which the graph puts back on
 * its own after every change and would otherwise read as a fresh edit.
 */
export function contentKey(nodes: ErdNode[], edges: ErdEdge[]): string {
	return JSON.stringify([
		nodes.filter(isTableNode).map((node) => [
			node.id,
			node.position.x,
			node.position.y,
			{
				...node.data,
				columns: node.data.columns.map((column) => ({ ...column, isForeignKey: undefined })),
			},
		]),
		edges.map((edge) => [
			edge.id,
			edge.source,
			edge.target,
			edge.sourceHandle,
			edge.targetHandle,
			edge.data,
		]),
	]);
}

export function useGraphHistory({
	nodes,
	edges,
	setNodes,
	setEdges,
	epoch,
}: {
	nodes: ErdNode[];
	edges: ErdEdge[];
	setNodes: Dispatch<SetStateAction<ErdNode[]>>;
	setEdges: Dispatch<SetStateAction<ErdEdge[]>>;
	/** Changes when another diagram takes the canvas, which starts the history over. */
	epoch: number;
}) {
	const past = useRef<Snapshot[]>([]);
	const future = useRef<Snapshot[]>([]);
	const present = useRef<Snapshot | null>(null);
	const seen = useRef(epoch);
	const current = useRef({ nodes, edges });
	const [reach, setReach] = useState({ canUndo: false, canRedo: false });

	const publish = useCallback(() => {
		const canUndo = past.current.length > 0;
		const canRedo = future.current.length > 0;

		setReach((was) =>
			was.canUndo === canUndo && was.canRedo === canRedo ? was : { canUndo, canRedo },
		);
	}, []);

	const commit = useCallback(() => {
		const { nodes: now, edges: lines } = current.current;
		const key = contentKey(now, lines);

		if (!present.current || key === present.current.key) return;

		past.current = [...past.current, present.current].slice(-LIMIT);
		present.current = { key, nodes: now, edges: lines };
		future.current = [];
		publish();
	}, [publish]);

	useEffect(() => {
		current.current = { nodes, edges };

		if (seen.current !== epoch || !present.current) {
			seen.current = epoch;
			past.current = [];
			future.current = [];
			present.current = { key: contentKey(nodes, edges), nodes, edges };
			publish();
			return;
		}

		// A drag changes the tables every frame. The drop is the step.
		if (nodes.some((node) => node.dragging)) return;

		const timer = setTimeout(commit, SETTLE);

		return () => clearTimeout(timer);
	}, [nodes, edges, epoch, commit, publish]);

	const step = useCallback(
		(from: RefObject<Snapshot[]>, to: RefObject<Snapshot[]>) => {
			// An edit made a moment ago may still be waiting to settle. It has
			// to be a step of its own first, or this would skip straight past it.
			commit();

			const next = from.current.at(-1);
			if (!next || !present.current) return false;

			from.current = from.current.slice(0, -1);
			to.current = [...to.current, present.current];
			present.current = next;

			setNodes(next.nodes.map((node) => (node.selected ? { ...node, selected: false } : node)));
			setEdges(next.edges);
			publish();

			return true;
		},
		[commit, publish, setNodes, setEdges],
	);

	const undo = useCallback(() => step(past, future), [step]);
	const redo = useCallback(() => step(future, past), [step]);

	return { undo, redo, ...reach };
}
