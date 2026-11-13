// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useState } from "react";

import { contentKey, useGraphHistory } from "@/features/erd/hooks/use-graph-history";
import type { ErdEdge, ErdNode, ErdTableNode } from "@/features/erd/types/erd";

const table = (id: string, x = 0): ErdTableNode => ({
	id,
	type: "table",
	position: { x, y: 0 },
	data: { id: 1, schema: "public", name: id, columns: [] },
});

function useCanvas(start: ErdNode[]) {
	const [nodes, setNodes] = useState(start);
	const [edges, setEdges] = useState<ErdEdge[]>([]);
	const [epoch, setEpoch] = useState(0);
	const history = useGraphHistory({ nodes, edges, setNodes, setEdges, epoch });

	return { nodes, setNodes, setEpoch, history };
}

const settle = () => act(() => vi.advanceTimersByTime(300));
const names = (nodes: ErdNode[]) => nodes.map((node) => node.id);

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

test("undo takes back the last change and redo puts it on again", () => {
	const { result } = renderHook(() => useCanvas([table("a")]));

	act(() => result.current.setNodes((now) => [...now, table("b")]));
	settle();
	expect(result.current.history.canUndo).toBe(true);

	act(() => void result.current.history.undo());
	expect(names(result.current.nodes)).toEqual(["a"]);
	expect(result.current.history.canRedo).toBe(true);

	act(() => void result.current.history.redo());
	expect(names(result.current.nodes)).toEqual(["a", "b"]);
});

test("a change made after an undo drops what could have been redone", () => {
	const { result } = renderHook(() => useCanvas([table("a")]));

	act(() => result.current.setNodes((now) => [...now, table("b")]));
	settle();
	act(() => void result.current.history.undo());
	act(() => result.current.setNodes((now) => [...now, table("c")]));
	settle();

	expect(result.current.history.canRedo).toBe(false);
	act(() => void result.current.history.undo());
	expect(names(result.current.nodes)).toEqual(["a"]);
});

test("an edit that has not settled yet is still its own step", () => {
	const { result } = renderHook(() => useCanvas([table("a")]));

	act(() => result.current.setNodes((now) => [...now, table("b")]));
	settle();
	act(() => result.current.setNodes((now) => [...now, table("c")]));
	act(() => void result.current.history.undo());

	expect(names(result.current.nodes)).toEqual(["a", "b"]);
});

test("a drag is one step, taken when the table is dropped", () => {
	const { result } = renderHook(() => useCanvas([table("a")]));

	for (const x of [10, 20, 30]) {
		act(() => result.current.setNodes([{ ...table("a", x), dragging: true }]));
		settle();
	}
	expect(result.current.history.canUndo).toBe(false);

	act(() => result.current.setNodes([table("a", 30)]));
	settle();
	act(() => void result.current.history.undo());

	expect(result.current.nodes[0].position.x).toBe(0);
	expect(result.current.history.canUndo).toBe(false);
});

test("selecting a table or marking a foreign key is not a step", () => {
	const column = {
		id: "c",
		name: "id",
		format: "int4",
		isPrimary: true,
		isNullable: false,
		isUnique: false,
		isIdentity: false,
	};
	const plain = { ...table("a"), data: { ...table("a").data, columns: [column] } };
	const marked = {
		...plain,
		selected: true,
		data: { ...plain.data, columns: [{ ...column, isForeignKey: true }] },
	};

	expect(contentKey([marked], [])).toBe(contentKey([plain], []));
});

test("another diagram on the canvas starts the history over", () => {
	const { result } = renderHook(() => useCanvas([table("a")]));

	act(() => result.current.setNodes((now) => [...now, table("b")]));
	settle();
	act(() => {
		result.current.setNodes([table("z")]);
		result.current.setEpoch(1);
	});
	settle();

	expect(result.current.history.canUndo).toBe(false);
	act(() => void result.current.history.undo());
	expect(names(result.current.nodes)).toEqual(["z"]);
});
