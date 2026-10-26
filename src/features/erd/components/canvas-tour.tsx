import { memo, useEffect, useRef, useState } from "react";
import { DatabaseZapIcon } from "lucide-react";

import { TourWelcome, find, useTour } from "@/components/tour";
import type { TourStep } from "@/components/tour";

import { TOUR } from "../lib/tour";

const picker = () => document.getElementById(TOUR.schemaPicker);

const shown = (id: string) =>
	new Promise<void>((resolve) => {
		const started = performance.now();
		const look = () => {
			if (find(id) || performance.now() - started > 600) resolve();
			else requestAnimationFrame(look);
		};
		look();
	});

// Opens the picker so its last row can be pointed at, and hands back the
// closing of it. The trigger is toggled rather than the state, since the
// list owns that and is a long way from here.
async function openPicker() {
	const trigger = picker();
	if (!trigger || trigger.hasAttribute("data-popup-open")) return undefined;

	trigger.click();
	await shown(TOUR.newSchema);
	await new Promise((resolve) => setTimeout(resolve, 150));

	return () => {
		if (picker()?.hasAttribute("data-popup-open")) picker()?.click();
	};
}

function Step({ title, children }: { title: string; children: string }) {
	return (
		<div className="space-y-1.5 pr-6">
			<h3 className="text-base font-semibold tracking-snug">{title}</h3>
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
		target: TOUR.newSchema,
		side: "right",
		reveal: openPicker,
		content: (
			<Step title="Start a new schema">
				The last row of the picker opens a fresh canvas. Name it, then choose an empty start or
				the sample tables.
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
				The sample blog is yours to change: rename it, add tables or delete it. Right-click anywhere
				for a new table. Drag from a column's arrow onto another table to draw a relationship.
				Changes save on their own.
			</Step>
		),
	},
];

export type CanvasTourProps = {
	/** Something else has the screen, like naming a first schema, so the welcome waits. */
	held?: boolean;
};

export const CanvasTour = memo(function CanvasTour({ held = false }: CanvasTourProps) {
	const { setSteps, done } = useTour();
	const [open, setOpen] = useState(false);

	useEffect(() => setSteps(STEPS), [setSteps]);

	// A beat after the canvas is up, so it is not the first thing to appear.
	// After a hold the canvas has been there a while already, so only the
	// closing dialog is waited for.
	const wasHeld = useRef(false);

	useEffect(() => {
		if (held) wasHeld.current = true;
	}, [held]);

	useEffect(() => {
		if (done || held) return;

		const wait = window.setTimeout(() => setOpen(true), wasHeld.current ? 250 : 1000);

		return () => window.clearTimeout(wait);
	}, [done, held]);

	return (
		<TourWelcome
			open={open}
			onOpenChange={setOpen}
			title="Welcome to SchemaForge"
			description="A sample blog is on the canvas to start from. Seven stops show you the way round, under a minute."
			icon={<DatabaseZapIcon className="size-8" />}
		/>
	);
});
