import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	BracesIcon,
	CodeXmlIcon,
	DownloadIcon,
	FileArchiveIcon,
	FileCodeIcon,
	ImageIcon,
	SettingsIcon,
	TablePropertiesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { TOUR } from "../lib/tour";
import { DiagnosticsMenu } from "./diagnostics-menu";
import type { DiagnosticsMenuProps } from "./diagnostics-menu";
import { MigrationDialog } from "./migration-dialog";

export type SchemaToolbarProps = {
	generating: boolean;
	onAddTable: () => void;
	onGenerate: () => void;
	settingsOpen: boolean;
	onSettingsOpenChange: (open: boolean, byKeyboard?: boolean) => void;
	/** Holds the bar up for as long as something is pointing at it. */
	raised?: boolean;
	/** Left out while there is nothing to show. */
	diagnostics?: Pick<DiagnosticsMenuProps, "diagnostics" | "checked" | "onDismiss">;
};

/** Astro's HOVER_DELAY, the wait before the bar drops back. */
const LINGER = 2000;

/** Astro's DEVBAR_HITBOX_ABOVE, the strip that catches a pointer on its way. */
const REACH = 42;

// Astro's own shadow, six layers of their near-black. It stays that colour in
// both themes, since a shadow drawn in the foreground glows white on a dark
// canvas instead of sitting the bar down on it.
const SHADOW =
	"shadow-[0px_1px_2px_0px_rgb(19_21_26_/_0.29),0px_4px_4px_0px_rgb(19_21_26_/_0.26),0px_10px_6px_0px_rgb(19_21_26_/_0.15),0px_17px_7px_0px_rgb(19_21_26_/_0.04),0px_26px_7px_0px_rgb(19_21_26_/_0.01)]";

// 40 tall inside a 1px border, a fill that thins towards the bottom, and the
// ends clipped so the first and last items round with the bar.
const BAR =
	"nodrag nopan pointer-events-auto flex h-[42px] items-stretch overflow-hidden rounded-full border border-border bg-linear-to-b from-card to-card/88";

// Astro's curve, which carries the bar a little past its mark and settles back.
const SLIDE = "transition-transform duration-350 ease-[cubic-bezier(0.485,-0.05,0.285,1.505)]";

const ITEM =
	"h-full w-11 rounded-none transition-opacity duration-200 ease-out hover:bg-foreground/10";

const FILES = [
	{ id: "sql", label: "SQL", extension: ".sql", icon: FileCodeIcon },
	{ id: "svg", label: "Diagram", extension: ".svg", icon: ImageIcon },
	{ id: "html", label: "HTML", extension: ".html", icon: CodeXmlIcon },
	{ id: "json", label: "JSON", extension: ".json", icon: BracesIcon },
] as const;

function soon(extension: string) {
	notify.info({
		title: "Not built yet",
		description: `Exporting as ${extension} is not wired up yet.`,
	});
}

export const SchemaToolbar = memo(function SchemaToolbar({
	generating,
	onAddTable,
	onGenerate,
	settingsOpen,
	onSettingsOpenChange,
	raised = false,
	diagnostics,
}: SchemaToolbarProps) {
	// Up to begin with, so the two things it holds are there to be found. The
	// first time the pointer comes and goes is what hands it the run of itself.
	const [wanted, setWanted] = useState(true);
	const [exporting, setExporting] = useState(false);
	const [migrating, setMigrating] = useState(false);
	const [checking, setChecking] = useState(false);
	// The bug keeps the colour of the other icons until it has slid in, so an
	// answer that was already back still shows as a change.
	const [entered, setEntered] = useState(false);
	if (!diagnostics && entered) setEntered(false);
	const dropping = useRef<number | undefined>(undefined);
	const settling = useRef(false);
	const typed = useRef(false);

	const show = () => {
		window.clearTimeout(dropping.current);
		setWanted(true);
	};

	// Leaving does not drop the bar at once, so a pointer that slips off an edge
	// on its way to the next button keeps what it was aiming at.
	const hide = () => {
		window.clearTimeout(dropping.current);
		dropping.current = window.setTimeout(() => setWanted(false), LINGER);
	};

	useEffect(() => {
		const dismiss = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;

			window.clearTimeout(dropping.current);
			setWanted(false);
		};

		document.addEventListener("keyup", dismiss);

		return () => {
			document.removeEventListener("keyup", dismiss);
			window.clearTimeout(dropping.current);
		};
	}, []);

	const opened = exporting || migrating || checking || settingsOpen;

	// The menu and the dialog stand away from the bar, so the pointer is off it
	// the whole time they are open and it would drop out from under them.
	const up = wanted || opened || raised;

	// What one of them hands back on the way out is let past. Focus returns to
	// the button that opened it, which is the menu tidying up rather than the
	// reader asking for the bar again. The settings dialog opened with the
	// keyboard is the one that means it, so that focus keeps the bar up.
	useEffect(() => {
		if (opened) {
			settling.current = !(settingsOpen && typed.current);
			return;
		}

		if (!settling.current) return;

		const done = window.setTimeout(() => (settling.current = false), 350);

		return () => window.clearTimeout(done);
	}, [opened, settingsOpen]);

	return (
		<div
			className={cn(
				"pointer-events-none flex flex-col items-center",
				SLIDE,
				!up && "translate-y-10",
			)}
			onMouseEnter={show}
			onMouseLeave={hide}
			// Focus holds the bar up for someone working the keyboard, who has
			// nothing else to hold it with.
			onFocus={() => !settling.current && show()}
			onBlur={hide}
		>
			{/* Room above the bar to aim at while it is down, since the sliver left
          showing is a thin thing to hit. It is given back once the bar is up. */}
			<div className="pointer-events-auto w-full" style={{ height: up ? 0 : REACH }} />

			<div id={TOUR.toolbar} className={cn(BAR, SHADOW)}>
				<TooltipProvider delay={200}>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									aria-label="New table"
									onClick={onAddTable}
									className={cn(ITEM, "w-[42px] rounded-l-full pl-1", !up && "opacity-20")}
								/>
							}
						>
							<TablePropertiesIcon className="size-5" />
						</TooltipTrigger>
						<TooltipContent>New table</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									aria-label="Generate SQL"
									disabled={generating}
									onClick={onGenerate}
									className={cn(ITEM, !up && "opacity-20")}
								/>
							}
						>
							<FileCodeIcon className="size-5" />
						</TooltipTrigger>
						<TooltipContent>Generate SQL</TooltipContent>
					</Tooltip>

					<DropdownMenu open={exporting} onOpenChange={setExporting}>
						<Tooltip>
							<TooltipTrigger
								render={
									<DropdownMenuTrigger
										render={
											<Button
												variant="ghost"
												size="icon"
												aria-label="Export"
												className={cn(ITEM, !up && "opacity-20")}
											/>
										}
									/>
								}
							>
								<DownloadIcon className="size-5" />
							</TooltipTrigger>
							<TooltipContent>Export</TooltipContent>
						</Tooltip>

						{/* Wider than the button it hangs off, which the default width
                would otherwise pin it to. */}
						<DropdownMenuContent side="top" align="end" sideOffset={10} className="w-44">
							<DropdownMenuGroup>
								<DropdownMenuLabel>Export as</DropdownMenuLabel>
								{FILES.map((file) => (
									<DropdownMenuItem key={file.id} onClick={() => soon(file.extension)}>
										<file.icon />
										{file.label}
										<DropdownMenuShortcut className="font-mono tracking-normal">
											{file.extension}
										</DropdownMenuShortcut>
									</DropdownMenuItem>
								))}
							</DropdownMenuGroup>

							<DropdownMenuSeparator />

							<DropdownMenuItem onClick={() => setMigrating(true)}>
								<FileArchiveIcon />
								Migration
								<DropdownMenuShortcut className="font-mono tracking-normal">
									.zip
								</DropdownMenuShortcut>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Opens up a slot of its own, so the bar widens around it rather
              than jumping to the new size. */}
					<AnimatePresence>
						{diagnostics && (
							<motion.div
								key="diagnostics"
								initial={{ width: 0, opacity: 0 }}
								animate={{ width: 44, opacity: 1 }}
								exit={{ width: 0, opacity: 0 }}
								transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
								onAnimationComplete={() => setEntered(true)}
								className="flex h-full overflow-hidden"
							>
								<DiagnosticsMenu
									{...diagnostics}
									checked={diagnostics.checked && entered}
									open={checking}
									onOpenChange={setChecking}
									className={cn(ITEM, "shrink-0", !up && "opacity-20")}
								/>
							</motion.div>
						)}
					</AnimatePresence>

					<Separator orientation="vertical" className="bg-border" />

					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									aria-label="Canvas settings"
									// A click carries the number of clicks behind it, so a zero
									// is a button pressed with the keyboard rather than aimed at.
									onClick={(event) => {
										typed.current = event.detail === 0;
										onSettingsOpenChange(true, typed.current);
									}}
									className={cn(ITEM, "w-[42px] rounded-r-full pr-1", !up && "opacity-20")}
								/>
							}
						>
							<SettingsIcon className="size-5" />
						</TooltipTrigger>
						<TooltipContent>Settings</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			{/* The same strip below, so the bar is still reachable from the very
          bottom edge of the window. */}
			<div className="pointer-events-auto h-4 w-full" />

			<MigrationDialog open={migrating} onOpenChange={setMigrating} />
		</div>
	);
});
