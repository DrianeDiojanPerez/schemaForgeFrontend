import { memo, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, LocateIcon } from "lucide-react";

import { useTour } from "@/components/tour";
import type { TourStep } from "@/components/tour";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import type { Diagnostic } from "@/features/schema/types/schema";

import { useReveal } from "../hooks/use-reveal";
import type { Generated } from "../hooks/use-schema-sync";
import { setCanvasPreference, useCanvasPreferences } from "../lib/canvas-preferences";
import { downloadText } from "../lib/download";
import { nodeAnchor } from "../lib/tour";
import type { ErdTableNode } from "../types/erd";
import { ProblemMark, ProblemMessage, problemTitle } from "./problem-text";
import { SqlEditor } from "./sql-editor";

export type GeneratedSqlDialogProps = {
	result: Generated | null;
	generating: boolean;
	onClose: () => void;
	onIncludeCommentsChange: (includeComments: boolean) => void;
};

function plural(count: number, word: string) {
	return `${count} ${count === 1 ? word : `${word}s`}`;
}

const setSqlVim = (on: boolean) => setCanvasPreference("sqlVim", on);

const CODE_CHIP = "rounded bg-foreground/8 px-1 py-px font-mono text-2xs text-muted-foreground";

export const GeneratedSqlDialog = memo(function GeneratedSqlDialog({
	result,
	generating,
	onClose,
	onIncludeCommentsChange,
}: GeneratedSqlDialogProps) {
	const [copied, setCopied] = useState(false);
	// Edits are remembered against the script they were made to, so a fresh
	// script from the backend replaces them rather than being overwritten.
	const [edit, setEdit] = useState<{ of: string; text: string } | null>(null);
	const { sqlVim } = useCanvasPreferences();
	const { problemTable, goToProblem } = useReveal();
	const { show } = useTour();

	const ddl = result?.ddl ?? "";
	const diagnostics = result?.diagnostics ?? [];
	const errors = diagnostics.filter((item) => item.severity === "ERROR");
	const warnings = diagnostics.filter((item) => item.severity === "WARNING");
	const blocked = ddl === "";
	const text = edit?.of === ddl ? edit.text : ddl;

	const copy = async () => {
		if (!text) return;

		await navigator.clipboard.writeText(text);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	};

	// The canvas flies to the table the problem is about and a card beside it
	// says what is wrong. One that names no table is only flown to.
	const pointAt = (diagnostic: Diagnostic) => {
		const table = problemTable(diagnostic);

		if (!table) {
			void goToProblem(diagnostic).then((went) => went && onClose());
			return;
		}

		onClose();
		show([stopFor({ diagnostic, table })]);
	};

	const stopFor = ({
		diagnostic,
		table,
	}: {
		diagnostic: Diagnostic;
		table: ErdTableNode;
	}): TourStep => ({
		target: nodeAnchor(table.id),
		side: "right",
		reveal: () => goToProblem(diagnostic),
		content: <ProblemStop diagnostic={diagnostic} />,
	});

	return (
		<Dialog open={result !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>{blocked ? "No SQL generated" : "Generated SQL"}</DialogTitle>
					<DialogDescription>
						{blocked
							? errors.length > 0
								? "The backend writes no SQL a database would refuse. Fix these first."
								: "There is nothing on the canvas to write SQL for."
							: "Produced by the backend from the schema on the canvas. Edits here stay in this window."}
					</DialogDescription>
				</DialogHeader>

				{blocked ? (
					errors.length > 0 && <ProblemList items={errors} onShow={pointAt} />
				) : (
					<>
						{warnings.length > 0 && (
							<div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning/5 p-2">
								<p className="px-2 pt-1 text-xs text-muted-foreground">
									The script is complete. {plural(warnings.length, "warning")} worth a look:
								</p>
								<ProblemList items={warnings} onShow={pointAt} />
							</div>
						)}
						<SqlEditor
							key={sqlVim ? "vim" : "plain"}
							value={text}
							onChange={(next) => setEdit({ of: ddl, text: next })}
							vim={sqlVim}
							className="h-96"
						/>
					</>
				)}

				<DialogFooter showCloseButton>
					<div className="flex items-center gap-5 sm:mr-auto">
						<div className="flex items-center gap-2">
							<Switch
								id="generated-sql-comments"
								checked={result?.includeComments ?? true}
								disabled={generating}
								onCheckedChange={onIncludeCommentsChange}
							/>
							<Label htmlFor="generated-sql-comments" className="cursor-pointer">
								Include comments
							</Label>
						</div>
						{!blocked && (
							<div className="flex items-center gap-2">
								<Switch id="generated-sql-vim" checked={sqlVim} onCheckedChange={setSqlVim} />
								<Label htmlFor="generated-sql-vim" className="cursor-pointer">
									Vim keys
								</Label>
							</div>
						)}
					</div>
					<Button variant="outline" disabled={blocked} onClick={() => void copy()}>
						{copied ? <CheckIcon /> : <CopyIcon />}
						{copied ? "Copied" : "Copy"}
					</Button>
					<Button
						variant="outline"
						disabled={blocked}
						onClick={() => result && downloadText(result.file, text, "application/sql")}
					>
						<DownloadIcon />
						Download
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
});

// Shaped like a tour stop, which it is: a title and one sentence, with the
// names in it drawn as chips the way the list draws them.
function ProblemStop({ diagnostic }: { diagnostic: Diagnostic }) {
	return (
		<div className="space-y-1.5 pr-6">
			<h3 className="text-base font-semibold tracking-snug">{problemTitle(diagnostic.code)}</h3>
			<p className="leading-relaxed text-muted-foreground">
				<ProblemMessage text={diagnostic.message} />
			</p>
		</div>
	);
}

function ProblemList({
	items,
	onShow,
}: {
	items: Diagnostic[];
	onShow: (diagnostic: Diagnostic) => void;
}) {
	return (
		<ScrollArea className="*:data-[slot=scroll-area-viewport]:max-h-72">
			<ul className="flex flex-col gap-1">
				{items.map((diagnostic, index) => {
					const placed = diagnostic.elementIds.length > 0 || diagnostic.location !== undefined;

					return (
						<li
							key={`${diagnostic.code}-${index}`}
							className="flex items-start gap-3 rounded-md px-2 py-2"
						>
							<ProblemMark severity={diagnostic.severity} />
							<span className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-2 text-sm font-medium">
									{problemTitle(diagnostic.code)}
									<code className={CODE_CHIP}>{diagnostic.code}</code>
								</span>
								<span className="text-xs leading-relaxed text-muted-foreground">
									<ProblemMessage text={diagnostic.message} />
								</span>
							</span>
							{placed && (
								<Button variant="ghost" size="sm" onClick={() => onShow(diagnostic)}>
									<LocateIcon />
									Show me
								</Button>
							)}
						</li>
					);
				})}
			</ul>
		</ScrollArea>
	);
}
