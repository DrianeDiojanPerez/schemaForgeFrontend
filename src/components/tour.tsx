import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useHotkey } from "@tanstack/react-hotkeys";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/*
 * Whether a tour was finished lives in storage, so it is read as an external
 * store rather than copied into state after mount. A finish is also kept in
 * memory, since private browsing can refuse the write and the tour still has
 * to stay closed.
 */
const finishedNow = new Set<string>();
const listeners = new Set<() => void>();

function finished(key: string): boolean {
	if (finishedNow.has(key)) return true;

	try {
		return localStorage.getItem(key) === "done";
	} catch {
		return false;
	}
}

function finish(key: string) {
	finishedNow.add(key);

	try {
		localStorage.setItem(key, "done");
	} catch {
		// Storage that cannot be written only means the tour is offered again
		// next time.
	}

	for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	window.addEventListener("storage", listener);

	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", listener);
	};
}

export type TourSide = "top" | "bottom" | "left" | "right" | "center";

export type TourStep = {
	/** The id of the element the step points at. */
	target: string;
	content: ReactNode;
	side?: TourSide;
};

type Box = { top: number; left: number; width: number; height: number };

type TourState = {
	steps: TourStep[];
	setSteps: (steps: TourStep[]) => void;
	step: number;
	count: number;
	active: boolean;
	done: boolean;
	start: () => void;
	next: () => void;
	back: () => void;
	end: () => void;
};

const TourContext = createContext<TourState | null>(null);

const GAP = 6;
const MARGIN = 16;
const CARD_WIDTH = 300;

const GLIDE = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };

/** Where the element is, with a little room around it, or nothing when it is
    not on screen to be pointed at. */
function measure(id: string): Box | null {
	const element = document.getElementById(id);
	if (!element) return null;

	const rect = element.getBoundingClientRect();
	if (rect.width === 0 || rect.height === 0) return null;
	if (rect.right <= 0 || rect.bottom <= 0) return null;
	if (rect.left >= window.innerWidth || rect.top >= window.innerHeight) return null;

	return {
		top: rect.top - GAP,
		left: rect.left - GAP,
		width: rect.width + GAP * 2,
		height: rect.height + GAP * 2,
	};
}

function place(box: Box, side: TourSide, height: number) {
	const centreX = box.left + box.width / 2 - CARD_WIDTH / 2;
	const centreY = box.top + box.height / 2 - height / 2;

	let top = centreY;
	let left = centreX;

	switch (side) {
		case "top":
			top = box.top - height - MARGIN;
			break;
		case "bottom":
			top = box.top + box.height + MARGIN;
			break;
		case "left":
			left = box.left - CARD_WIDTH - MARGIN;
			break;
		case "right":
			left = box.left + box.width + MARGIN;
			break;
		case "center":
			break;
	}

	return {
		top: Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN)),
		left: Math.max(MARGIN, Math.min(left, window.innerWidth - CARD_WIDTH - MARGIN)),
	};
}

// The shade is one polygon that runs round the outside and back in along the
// box, which leaves the box itself clear.
function hole(box: Box) {
	const right = box.left + box.width;
	const bottom = box.top + box.height;

	return `polygon(0px 0px, 0px 100%, 100% 100%, 100% 0px, ${box.left}px 0px, ${box.left}px ${box.top}px, ${right}px ${box.top}px, ${right}px ${bottom}px, ${box.left}px ${bottom}px, ${box.left}px 0px)`;
}

type Restore = (() => void) | undefined;

export function TourProvider({
	children,
	storageKey,
	prepare,
}: {
	children: ReactNode;
	/** Where finishing or skipping is remembered, so the tour runs once. */
	storageKey: string;
	/**
	 * Runs before the stops are measured, for bringing their targets on
	 * screen. Whatever it returns is called when the tour ends, to put them
	 * back.
	 */
	prepare?: () => Promise<Restore> | Restore;
}) {
	const ready = useRef(prepare);
	const restore = useRef<Restore>(undefined);

	useEffect(() => {
		ready.current = prepare;
	});

	const [steps, setSteps] = useState<TourStep[]>([]);
	const [run, setRun] = useState<TourStep[]>([]);
	const [step, setStep] = useState(-1);
	const done = useSyncExternalStore(
		subscribe,
		() => finished(storageKey),
		() => false,
	);
	const [box, setBox] = useState<Box | null>(null);
	const [tall, setTall] = useState(180);

	// The card's height decides where it sits, and its contents change with
	// every step, so it is watched rather than measured once.
	const card = useCallback((node: HTMLDivElement | null) => {
		if (!node) return;

		setTall(node.offsetHeight);
		const watch = new ResizeObserver(() => setTall(node.offsetHeight));
		watch.observe(node);

		return () => watch.disconnect();
	}, []);

	// What the tour moved to show its stops goes back only once the card and
	// the shade have faded, so nothing slides out from under them.
	const settle = useCallback(() => {
		restore.current?.();
		restore.current = undefined;
	}, []);

	const end = useCallback(() => {
		setStep(-1);
		finish(storageKey);
	}, [storageKey]);

	// Only the steps whose target is on screen are walked, so a panel that is
	// folded away or a button the page does not have are passed over.
	const start = useCallback(async () => {
		restore.current = await ready.current?.();

		const here = steps.filter((item) => measure(item.target));
		if (here.length === 0) {
			settle();
			return;
		}

		setRun(here);
		setStep(0);
	}, [steps, settle]);

	const next = useCallback(() => {
		if (step >= run.length - 1) end();
		else setStep(step + 1);
	}, [step, run.length, end]);

	const back = useCallback(() => {
		setStep((current) => Math.max(0, current - 1));
	}, []);

	const current = step >= 0 ? run[step] : undefined;

	// The box is a measurement of the target once it is on screen, so it can
	// only be taken after the render that put it there.
	/* oxlint-disable react/set-state-in-effect */
	useEffect(() => {
		if (!current) {
			setBox(null);
			return;
		}

		const update = () => setBox(measure(current.target));
		update();

		// The toolbar rises and the panel slides to meet the tour, so one more
		// look once they have settled.
		const settled = window.setTimeout(update, 500);
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);

		return () => {
			window.clearTimeout(settled);
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [current]);
	/* oxlint-enable react/set-state-in-effect */

	const running = { enabled: Boolean(current) };

	useHotkey("Escape", end, running);
	useHotkey("ArrowRight", next, running);
	useHotkey("Enter", next, running);
	useHotkey("ArrowLeft", back, running);

	const value = useMemo<TourState>(
		() => ({
			steps,
			setSteps,
			step,
			count: run.length,
			active: step >= 0,
			done,
			start,
			next,
			back,
			end,
		}),
		[steps, step, run.length, done, start, next, back, end],
	);

	const at = box && current ? place(box, current.side ?? "bottom", tall) : null;

	return (
		<TourContext.Provider value={value}>
			{children}
			{typeof document !== "undefined" &&
				createPortal(
					<AnimatePresence onExitComplete={settle}>
						{current && box && at && (
							<motion.div
								key="tour"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.25 }}
								className="fixed inset-0 z-50"
							>
								<motion.div
									initial={false}
									animate={{ clipPath: hole(box) }}
									transition={GLIDE}
									className="absolute inset-0 bg-black/50"
								/>

								<motion.div
									initial={false}
									animate={{
										top: box.top,
										left: box.left,
										width: box.width,
										height: box.height,
									}}
									transition={GLIDE}
									className="absolute rounded-lg shadow-halo ring-2 ring-primary"
								/>

								<motion.div
									ref={card}
									role="dialog"
									aria-label="Tour"
									initial={false}
									animate={{ top: at.top, left: at.left }}
									transition={GLIDE}
									style={{ width: CARD_WIDTH }}
									className="absolute rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
								>
									<AnimatePresence mode="wait" initial={false}>
										<motion.div
											key={step}
											initial={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
											animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
											exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
											transition={{ duration: 0.2 }}
										>
											{current.content}
										</motion.div>
									</AnimatePresence>

									<div className="mt-4 flex items-center justify-between gap-3">
										<div
											className="flex items-center gap-1"
											aria-label={`Step ${step + 1} of ${run.length}`}
										>
											{run.map((item, index) => (
												<span
													key={item.target}
													className={cn(
														"h-1.5 rounded-full transition-all duration-300",
														index === step ? "w-4 bg-primary" : "w-1.5 bg-border",
													)}
												/>
											))}
										</div>

										<div className="flex items-center gap-1">
											{step > 0 && (
												<Button variant="ghost" size="sm" onClick={back}>
													Back
												</Button>
											)}
											<Button size="sm" onClick={next}>
												{step === run.length - 1 ? "Finish" : "Next"}
											</Button>
										</div>
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.body,
				)}
		</TourContext.Provider>
	);
}

export function useTour() {
	const context = useContext(TourContext);
	if (!context) throw new Error("useTour needs a TourProvider above it");

	return context;
}

export function TourWelcome({
	open,
	onOpenChange,
	title,
	description,
	icon,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	icon: ReactNode;
}) {
	const { start, end, done, active, steps } = useTour();

	if (done || active || steps.length === 0) return null;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent size="sm">
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-primary/10 text-primary">
						<motion.div
							initial={{ scale: 0.7, filter: "blur(8px)" }}
							animate={{ scale: 1, filter: "blur(0px)", y: [0, -4, 0] }}
							transition={{
								duration: 0.4,
								ease: "easeOut",
								y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
							}}
							className="flex"
						>
							{icon}
						</motion.div>
					</AlertDialogMedia>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<Button
						variant="ghost"
						onClick={() => {
							onOpenChange(false);
							end();
						}}
					>
						Skip
					</Button>
					<Button
						onClick={() => {
							onOpenChange(false);
							void start();
						}}
					>
						Start tour
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
