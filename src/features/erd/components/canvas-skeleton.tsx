import { DatabaseZapIcon } from "lucide-react";
import { cn } from "cn";

import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

/**
 * Covering hides the graph while it is laid out, glass lets it show through
 * behind the loading state, and gone is the fade-out.
 */
export type LoadingPhase = "covering" | "glass" | "gone";

// The tour's curve: quick to start, long and soft to settle.
const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

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
	className,
	...props
}: React.ComponentProps<"div"> & { phase?: LoadingPhase }) {
	return (
		<div
			className={cn(
				"overflow-hidden transition-[opacity,visibility,background-color,backdrop-filter] duration-700",
				EASE,
				// React Flow paints its own dark grey over the theme background, so
				// the same grey is used here or the fade would step through a darker
				// shade on the way.
				phase === "covering"
					? "bg-background dark:bg-[#141414]"
					: "bg-background/70 backdrop-blur-xs dark:bg-[#141414]/70",
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
					<EmptyTitle>Laying out the diagram</EmptyTitle>
					<EmptyDescription className="flex items-center gap-2">
						<Spinner ref={keepTurning} />
						Placing the tables and drawing their relationships
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		</div>
	);
}
