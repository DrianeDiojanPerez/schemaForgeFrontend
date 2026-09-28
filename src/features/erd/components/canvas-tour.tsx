import { memo, useEffect, useState } from "react";
import { DatabaseZapIcon } from "lucide-react";

import { TourWelcome, useTour } from "@/components/tour";
import type { TourStep } from "@/components/tour";

import { TOUR } from "../lib/tour";

function Step({ title, children }: { title: string; children: string }) {
	return (
		<div className="space-y-1.5 pr-6">
			<h3 className="text-base font-semibold tracking-[-0.01em]">{title}</h3>
			<p className="text-muted-foreground">{children}</p>
		</div>
	);
}

const STEPS: TourStep[] = [
	{
		target: TOUR.sidebarToggle,
		side: "right",
		content: (
			<Step title="The table list">
				Fold the list away when the diagram needs the whole screen, and bring it back from here.
				Drag its right edge to make it wider.
			</Step>
		),
	},
	{
		target: TOUR.schemaPicker,
		side: "bottom",
		content: (
			<Step title="Pick a schema">
				The list shows one schema at a time. Switch between them here.
			</Step>
		),
	},
	{
		target: TOUR.search,
		side: "bottom",
		content: (
			<Step title="Find a table">
				Type a table or column name. Ctrl K jumps here from anywhere on the canvas.
			</Step>
		),
	},
	{
		target: TOUR.tableList,
		side: "right",
		content: (
			<Step title="Every table on the canvas">
				Click a name to fly to it. Open a row to read its columns without leaving the list.
			</Step>
		),
	},
	{
		target: TOUR.toolbar,
		side: "top",
		content: (
			<Step title="The toolbar">
				New table, generate SQL, export and settings. It tucks itself away when the pointer leaves
				and rises again when you reach for it.
			</Step>
		),
	},
	{
		target: TOUR.canvas,
		side: "center",
		content: (
			<Step title="Your canvas">
				Right-click anywhere for a new table. Drag from a column's arrow onto another table to draw
				a relationship. Changes save on their own.
			</Step>
		),
	},
];

export const CanvasTour = memo(function CanvasTour() {
	const { setSteps, done } = useTour();
	const [open, setOpen] = useState(false);

	useEffect(() => setSteps(STEPS), [setSteps]);

	// A beat after the canvas is up, so it is not the first thing to appear.
	useEffect(() => {
		if (done) return;

		const wait = window.setTimeout(() => setOpen(true), 1000);

		return () => window.clearTimeout(wait);
	}, [done]);

	return (
		<TourWelcome
			open={open}
			onOpenChange={setOpen}
			title="Welcome to SchemaForge"
			description="A quick walk round the canvas and the table list. Six stops, under a minute."
			icon={<DatabaseZapIcon className="size-8" />}
		/>
	);
});
