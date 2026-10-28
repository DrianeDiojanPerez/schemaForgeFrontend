import {
	BugIcon,
	CircleAlertIcon,
	CircleCheckIcon,
	EyeIcon,
	EyeOffIcon,
	TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Diagnostic } from "@/features/schema/types/schema";
import { cn } from "@/lib/utils";

import { useReveal } from "../hooks/use-reveal";
import { PROBLEMS_SHOWN } from "../lib/canvas-preferences";
import type { ProblemsShown } from "../lib/canvas-preferences";
import { ProblemMark, ProblemMessage, problemTitle } from "./problem-text";

export type DiagnosticsMenuProps = {
	diagnostics: Diagnostic[];
	/** Whether an answer has come back, which is what gives the bug a colour. */
	checked: boolean;
	/** Which findings are marked and listed. Chosen from the menu itself. */
	shown: ProblemsShown;
	onShownChange: (shown: ProblemsShown) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** For the button, so it matches the bar it sits in. */
	className?: string;
};

function plural(count: number, word: string) {
	return `${count} ${count === 1 ? word : `${word}s`}`;
}

const SHORT: Record<ProblemsShown, string> = { all: "All", errors: "Errors", none: "Hidden" };

const TILE: Record<ProblemsShown, { icon: typeof EyeIcon; tint: string }> = {
	all: { icon: TriangleAlertIcon, tint: "bg-warning/10 text-warning!" },
	errors: { icon: CircleAlertIcon, tint: "bg-destructive/10 text-destructive!" },
	none: { icon: EyeOffIcon, tint: "bg-foreground/8 text-muted-foreground!" },
};

function summary(errors: number, warnings: number) {
	if (errors === 0 && warnings === 0) return "No problems";
	if (errors === 0) return plural(warnings, "warning");
	if (warnings === 0) return plural(errors, "error");

	return `${plural(errors, "error")}, ${plural(warnings, "warning")}`;
}

export function DiagnosticsMenu({
	diagnostics,
	checked,
	shown,
	onShownChange,
	open,
	onOpenChange,
	className,
}: DiagnosticsMenuProps) {
	const { goToProblem } = useReveal();

	const errors = diagnostics.filter((item) => item.severity === "ERROR");
	const warnings = diagnostics.filter((item) => item.severity === "WARNING");

	const hidden = shown === "none";
	const label = hidden
		? "Problems hidden"
		: checked
			? summary(errors.length, warnings.length)
			: "Checking";

	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange}>
			<DropdownMenuTrigger
				openOnHover
				delay={100}
				closeDelay={200}
				render={<Button variant="bar" size="icon" aria-label={label} className={className} />}
			>
				<BugIcon
					className={cn(
						"size-5 transition-colors duration-500",
						hidden || !checked
							? "text-current"
							: errors.length > 0
								? "text-destructive"
								: warnings.length > 0
									? "text-warning"
									: "text-primary",
					)}
				/>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				side="top"
				align="center"
				sideOffset={10}
				className="w-96 overflow-hidden p-0"
			>
				<DropdownMenuGroup>
					<div className="flex h-10 items-center justify-between gap-2 pr-1 pl-3">
						<span className="flex items-center gap-1.5 text-xs font-medium">
							<BugIcon className="size-3.5" />
							Diagnostics
							{diagnostics.length > 0 && (
								<span className="rounded-full bg-muted px-1.5 text-2xs leading-4 text-muted-foreground tabular-nums">
									{diagnostics.length}
								</span>
							)}
						</span>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="h-7">
								<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
									{hidden ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
									{SHORT[shown]}
								</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="w-72 p-1">
								<DropdownMenuLabel>Show on the canvas</DropdownMenuLabel>
								<DropdownMenuRadioGroup
									value={shown}
									onValueChange={(next) => onShownChange(next as ProblemsShown)}
								>
									{PROBLEMS_SHOWN.map((item) => {
										const { icon: Icon, tint } = TILE[item.id];

										return (
											<DropdownMenuRadioItem
												key={item.id}
												value={item.id}
												className="gap-3 px-2 py-1.5"
											>
												<span
													className={cn(
														"flex size-7 shrink-0 items-center justify-center rounded-md",
														tint,
													)}
												>
													<Icon className="size-4 text-current! *:text-inherit!" />
												</span>
												<span className="font-medium">{item.label}</span>
											</DropdownMenuRadioItem>
										);
									})}
								</DropdownMenuRadioGroup>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					</div>
				</DropdownMenuGroup>

				<DropdownMenuSeparator className="my-0" />

				{hidden ? (
					<p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
						<EyeOffIcon className="size-4" />
						Nothing is marked. Choose what to show above.
					</p>
				) : diagnostics.length === 0 ? (
					<p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
						<CircleCheckIcon className="size-4 text-primary" />
						Nothing to fix.
					</p>
				) : (
					// The cap goes on the viewport itself. A percentage height has
					// nothing to resolve against in a popup sized by its contents.
					<ScrollArea className="*:data-[slot=scroll-area-viewport]:max-h-72">
						<DropdownMenuGroup className="p-1">
							{[...errors, ...warnings].map((diagnostic, index) => (
								<DropdownMenuItem
									key={`${diagnostic.code}-${index}`}
									onClick={() => void goToProblem(diagnostic)}
									className="items-start gap-3 px-2.5 py-2.5"
								>
									<ProblemMark severity={diagnostic.severity} />
									<span className="flex min-w-0 flex-1 flex-col gap-1">
										<span className="text-sm font-medium text-foreground!">
											{problemTitle(diagnostic.code)}
										</span>
										<span className="text-xs leading-relaxed whitespace-normal text-muted-foreground!">
											<ProblemMessage text={diagnostic.message} />
										</span>
									</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</ScrollArea>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
