import { useReactFlow } from "@xyflow/react";
import { BugIcon, CircleCheckIcon, EraserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Diagnostic } from "@/features/schema/types/schema";
import { cn } from "@/lib/utils";

import { useReveal } from "../hooks/use-reveal";
import { isTableNode } from "../lib/node-guards";
import type { ErdNode } from "../types/erd";
import { ProblemMark, ProblemMessage, problemTitle } from "./problem-text";

export type DiagnosticsMenuProps = {
	diagnostics: Diagnostic[];
	onDismiss: () => void;
	/** Whether an answer has come back, which is what gives the bug a colour. */
	checked: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** For the button, so it matches the bar it sits in. */
	className?: string;
};

function plural(count: number, word: string) {
	return `${count} ${count === 1 ? word : `${word}s`}`;
}

function summary(errors: number, warnings: number) {
	if (errors === 0 && warnings === 0) return "No problems";
	if (errors === 0) return plural(warnings, "warning");
	if (warnings === 0) return plural(errors, "error");

	return `${plural(errors, "error")}, ${plural(warnings, "warning")}`;
}

export function DiagnosticsMenu({
	diagnostics,
	onDismiss,
	checked,
	open,
	onOpenChange,
	className,
}: DiagnosticsMenuProps) {
	const { getNodes, setNodes } = useReactFlow<ErdNode>();
	const { goTo } = useReveal();

	const errors = diagnostics.filter((item) => item.severity === "ERROR");
	const warnings = diagnostics.filter((item) => item.severity === "WARNING");

	// The ids blamed can be a table or one of its columns, and either way it
	// is the table the canvas can fly to. The first one blamed is the one the
	// message is about, so that is the one flown to.
	const reveal = (diagnostic: Diagnostic) => {
		const nodes = getNodes();
		const owner = (id: string) =>
			nodes.find(
				(node) =>
					isTableNode(node) &&
					(node.id === id || node.data.columns.some((column) => column.id === id)),
			);
		const table = diagnostic.elementIds.map(owner).find(Boolean);
		if (!table) return;

		setNodes((current) =>
			current.map((node) =>
				node.selected === (node.id === table.id)
					? node
					: { ...node, selected: node.id === table.id },
			),
		);
		goTo(table);
	};

	const label = checked ? summary(errors.length, warnings.length) : "Checking";

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
						!checked
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
						{diagnostics.length > 0 && (
							<DropdownMenuItem onClick={onDismiss} className="h-7 px-2">
								<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<EraserIcon className="size-3.5" />
									Clear
								</span>
							</DropdownMenuItem>
						)}
					</div>
				</DropdownMenuGroup>

				<DropdownMenuSeparator className="my-0" />

				{diagnostics.length === 0 ? (
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
									onClick={() => reveal(diagnostic)}
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
