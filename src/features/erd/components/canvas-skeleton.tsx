import { DatabaseZapIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

import { EASE_IN_EXPO, EASE_OUT_EXPO } from "../lib/eases";

/**
 * Covering hides the graph while it is laid out, glass lets it show through
 * behind the loading state, and gone is the fade-out.
 */
export type LoadingPhase = "covering" | "glass" | "gone";

// The tour's curve: quick to start, long and soft to settle.
const EASE = "ease-out-expo";

// What the cover says in each of its states. The text swaps with a fade, the
// icon and the spinner stay where they are.
const WORDS = {
	laying: {
		title: "Laying out the diagram",
		detail: "Placing the tables and drawing their relationships",
	},
	reaching: {
		title: "Reaching the server",
		detail: "Waking up after a quiet spell, back in a moment",
	},
	slow: {
		title: "The server is taking longer than usual",
		detail: "Still asking every few seconds. It may be down.",
	},
} as const;

const swap = {
	initial: { opacity: 0, y: 4 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT_EXPO } },
	exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: EASE_IN_EXPO } },
};

// The loader is mounted twice on a fresh load, once by the server and once
// more when the browser takes the page over, and a spinner that started
// over on the second would jump back. Both copies are timed off the page's
// own clock instead, so the second carries on where the first was.
function keepTurning(node: SVGSVGElement | null) {
	for (const animation of node?.getAnimations() ?? []) animation.startTime = 0;
}

/** The canvas as it will be laid out, shown while React Flow cannot render. */
export function CanvasSkeleton({
	phase = "covering",
	entering = false,
	waiting = false,
	slow = false,
	onRetry,
	className,
	...props
}: React.ComponentProps<"div"> & {
	phase?: LoadingPhase;
	/** Fade in over a canvas already on screen, instead of being there from the start. */
	entering?: boolean;
	/** The backend has not answered yet, so there is nothing to lay out. */
	waiting?: boolean;
	/** The wait has gone on longer than a wake-up takes. */
	slow?: boolean;
	onRetry?: () => void;
}) {
	const state = waiting ? (slow ? "slow" : "reaching") : "laying";
	const words = WORDS[state];

	return (
		<div
			className={cn(
				"overflow-hidden transition-veil duration-700",
				EASE,
				entering && "animate-in animation-duration-350 fade-in",
				// React Flow paints its own dark grey over the theme background, so
				// the same grey is used here or the fade would step through a darker
				// shade on the way.
				phase === "covering" ? "bg-canvas" : "bg-canvas/70 backdrop-blur-xs",
				phase === "gone" && "invisible opacity-0",
				className,
			)}
			{...props}
		>
			<Empty className="h-full">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<DatabaseZapIcon />
					</EmptyMedia>
					<EmptyTitle>
						<AnimatePresence mode="wait" initial={false}>
							<motion.span key={state} className="block" {...swap}>
								{words.title}
							</motion.span>
						</AnimatePresence>
					</EmptyTitle>
					<EmptyDescription>
						<span className="flex items-center justify-center gap-2">
							<Spinner ref={keepTurning} className="shrink-0" />
							<AnimatePresence mode="wait" initial={false}>
								<motion.span key={state} className="whitespace-nowrap" {...swap}>
									{words.detail}
								</motion.span>
							</AnimatePresence>
						</span>
					</EmptyDescription>
				</EmptyHeader>
				<AnimatePresence initial={false}>
					{state === "slow" && onRetry && (
						<motion.div key="retry" {...swap}>
							<EmptyContent>
								<Button variant="outline" size="sm" onClick={onRetry}>
									Try again
								</Button>
							</EmptyContent>
						</motion.div>
					)}
				</AnimatePresence>
			</Empty>
		</div>
	);
}
