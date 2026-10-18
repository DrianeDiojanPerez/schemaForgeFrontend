import { describe, expect, test } from "vitest";

import { Position } from "@xyflow/react";

import { bestSides, linePath, nearestSides } from "./lib/edge-lines";

// Two tables 160 wide. The source sits at 0; the target is moved about.
const source = { left: 0, right: 160 };

describe("nearestSides", () => {
	test("picks the pair of edges that sit closest together", () => {
		expect(nearestSides(source.left, source.right, 300, 460)).toEqual({
			sourceSide: "right",
			targetSide: "left",
		});
		expect(nearestSides(source.left, source.right, -300, -140)).toEqual({
			sourceSide: "left",
			targetSide: "right",
		});
	});

	test("keeps the sides it had while another pair is only a little closer", () => {
		// The target's left edge at 78 is 78 from the source's left edge and 82
		// from its right, so a table dragged across this spot would flip between
		// the two pairs on every pixel unless the choice it had is held on to.
		const held = { sourceSide: "right", targetSide: "left" } as const;

		expect(nearestSides(source.left, source.right, 78, 238, held)).toEqual(held);
		expect(nearestSides(source.left, source.right, 70, 230, held)).toEqual(held);
	});

	test("lets go of the held sides once another pair is clearly closer", () => {
		const held = { sourceSide: "right", targetSide: "left" } as const;

		expect(nearestSides(source.left, source.right, -300, -140, held)).toEqual({
			sourceSide: "left",
			targetSide: "right",
		});
	});
});

describe("linePath", () => {
	const across = {
		sourceY: 100,
		targetY: 250,
		sourcePosition: Position.Right,
		targetPosition: Position.Left,
	};

	test("joins facing tables with an S that turns halfway across", () => {
		const [path, labelX, labelY] = linePath(
			"rounded",
			{ ...across, sourceX: 100, targetX: 200 },
			0,
		);

		expect(path).toBe(
			"M100 100L140 100Q150 100 150 110L150 175Q150 175 150 175L150 175Q150 175 150 175L150 240Q150 250 160 250L200 250",
		);
		expect([labelX, labelY]).toEqual([150, 175]);
	});

	test("opens the S out round the other table once the gap is under two reaches", () => {
		const [edge] = linePath("rounded", { ...across, sourceX: 100, targetX: 128 }, 0);
		const [round] = linePath("rounded", { ...across, sourceX: 100, targetX: 120 }, 0);

		expect(edge).toBe(
			"M100 100L104 100Q114 100 114 110L114 175Q114 175 114 175L114 175Q114 175 114 175L114 240Q114 250 124 250L128 250",
		);
		expect(round).toBe(
			"M100 100L104 100Q114 100 114 110L114 171Q114 175 110 175L110 175Q106 175 106 179L106 240Q106 250 116 250L120 250",
		);
	});

	test("moves the halfway line over a lane for each line running alongside", () => {
		const [second] = linePath("square", { ...across, sourceX: 100, targetX: 300 }, 1);

		expect(second).toBe(
			"M100 100L214 100Q214 100 214 100L214 175Q214 175 214 175L214 175Q214 175 214 175L214 250Q214 250 214 250L300 250",
		);
	});

	test("runs the crossing line below a table it would otherwise go under", () => {
		// The line leaves the right of a low table for a row in a tall one
		// above and to the right of it. Halfway between the rows is inside the
		// tall table, so the crossing moves to just above the low table, where
		// only a dozen pixels of the climb are still under the tall one. The
		// few pixels it reaches over an edge at a join are not counted.
		const [path, , labelY] = linePath(
			"square",
			{
				sourceX: 149,
				sourceY: 632,
				targetX: 156,
				targetY: 300,
				sourcePosition: Position.Right,
				targetPosition: Position.Left,
				clear: [
					{ left: -201, right: 146, top: 524, bottom: 801 },
					{ left: 159, right: 681, top: 69, bottom: 526 },
				],
			},
			0,
		);

		expect(labelY).toBe(510);
		expect(path).toContain("L163 510");
		expect(path).toContain("L142 300");
	});

	test("rounds both corners the same going round a table", () => {
		const [path] = linePath(
			"rounded",
			{
				sourceX: 200,
				sourceY: 250,
				targetX: 260,
				targetY: 100,
				sourcePosition: Position.Left,
				targetPosition: Position.Left,
			},
			0,
		);

		expect(path).toBe(
			"M200 250L182 250Q172 250 172 240L172 175Q172 175 172 175L172 175Q172 175 172 175L172 110Q172 100 182 100L260 100",
		);
	});
});

describe("bestSides", () => {
	const clean = { hidden: 0 };

	test("leaves from the far side when the near pair would run under a table", () => {
		expect(
			bestSides({
				leftToLeft: { distance: 500, ...clean },
				leftToRight: { distance: 900, ...clean },
				rightToLeft: { distance: 7, hidden: 81 },
				rightToRight: { distance: 360, ...clean },
			}),
		).toEqual({ sourceSide: "right", targetSide: "right" });
	});
});
