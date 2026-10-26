import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OptionTile } from "@/components/ui/option-tile";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSaveSchema } from "@/features/schema/api/mutations";
import type { Schema, SchemaDraft } from "@/features/schema/types/schema";
import { notify } from "@/lib/toast";

import { sampleDraft } from "../data/examples";

export type CreateSchemaDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** The schema the backend made, ready to draw on. */
	onCreated: (schema: Schema) => void;
	/** A drawing to save under the name, instead of starting empty or from the sample. */
	draft?: SchemaDraft;
};

type Start = "empty" | "sample";

const STARTS: { id: Start; label: string; detail: string }[] = [
	{ id: "empty", label: "Empty canvas", detail: "Right-click to add your first table." },
	{ id: "sample", label: "Sample tables", detail: "A small blog: users, posts, comments." },
];

// ConnectKit's modal, timing for timing. The box opens at 150ms from a
// touch smaller. A page change takes 200ms on the browser's own ease: the
// box follows the new page's height, the heading crossfades over 170ms, the
// back button over 100ms. Going forward the new page grows in from small
// while the old one keeps growing out of the way a frame behind, and coming
// back runs the same the other way round.
const EASE = { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } as const;

const PAGE = {
	enter: (forward: boolean) => ({ opacity: 0, scale: forward ? 0.85 : 1.1 }),
	shown: { opacity: 1, scale: 1, transition: EASE },
	exit: (forward: boolean) => ({
		opacity: 0,
		scale: forward ? 1.1 : 0.85,
		pointerEvents: "none" as const,
		transition: { ...EASE, delay: forward ? 1 / 60 : 0 },
	}),
};

const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

function draftFor(name: string, start: Start): SchemaDraft {
	return start === "sample"
		? sampleDraft(name)
		: { name, description: "", entities: [], relationships: [] };
}

export function CreateSchemaDialog({
	open,
	onOpenChange,
	onCreated,
	draft,
}: CreateSchemaDialogProps) {
	const [name, setName] = useState("");
	const [start, setStart] = useState<Start>("empty");
	const [step, setStep] = useState<1 | 2>(1);
	const [forward, setForward] = useState(true);
	const [height, setHeight] = useState<number>();
	const { mutateAsync: create, isPending } = useSaveSchema();

	const measure = useCallback((node: HTMLDivElement | null) => {
		if (node) setHeight(node.offsetHeight);
	}, []);

	const go = (next: 1 | 2) => {
		setForward(next > step);
		setStep(next);
	};

	const trimmed = name.trim();
	const heading = step === 1 ? (draft ? "Name this schema" : "New schema") : "Start with";

	const submit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!trimmed) return;

		// A drawing already on the canvas has nothing to start from, so the
		// name is the whole of it.
		if (step === 1 && !draft) {
			go(2);
			return;
		}

		try {
			const saved = await create(draft ? { ...draft, name: trimmed } : draftFor(trimmed, start));

			setName("");
			setStep(1);
			onOpenChange(false);
			onCreated(saved);
		} catch (error) {
			notify.error({
				title: "Could not create schema",
				description: error instanceof Error ? error.message : "Something went wrong",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="gap-0 p-0 duration-150 data-open:zoom-in-97 data-closed:zoom-out-97"
			>
				<form onSubmit={(event) => void submit(event)}>
					<div className="relative h-16">
						<AnimatePresence>
							{step === 2 && (
								<motion.div
									key="back"
									{...FADE}
									transition={{ duration: 0.1 }}
									className="absolute top-4 left-4"
								>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label="Back"
										onClick={() => go(1)}
									>
										<ArrowLeftIcon />
									</Button>
								</motion.div>
							)}
						</AnimatePresence>

						<DialogTitle className="absolute inset-x-13 inset-y-0 flex items-center justify-center">
							<AnimatePresence>
								<motion.span
									key={heading}
									{...FADE}
									transition={{ duration: 0.17 }}
									className="absolute truncate"
								>
									{heading}
								</motion.span>
							</AnimatePresence>
						</DialogTitle>
					</div>

					{/* Both pages sit in the one cell, so the outgoing page never
              pushes the incoming one down for the frame before it is
              taken out of flow. */}
					<motion.div
						className="grid items-start overflow-clip *:col-start-1 *:row-start-1"
						initial={false}
						animate={height === undefined ? undefined : { height }}
						transition={EASE}
					>
						<AnimatePresence initial={false} custom={forward}>
							<motion.div
								key={step}
								ref={measure}
								custom={forward}
								variants={PAGE}
								initial="enter"
								animate="shown"
								exit="exit"
								className="grid gap-4 px-6 pb-6"
							>
								{step === 1 ? (
									<>
										<DialogDescription>
											{draft
												? "What is on the canvas is saved under this name from now on."
												: "Opens a canvas under this name. Your current schema stays as it is."}
										</DialogDescription>

										<FieldGroup>
											<Field>
												<FieldLabel htmlFor="create-schema-name">Name</FieldLabel>
												<Input
													id="create-schema-name"
													value={name}
													onChange={(event) => setName(event.target.value)}
													placeholder="inventory"
													autoFocus
													required
												/>
											</Field>
										</FieldGroup>

										<DialogFooter>
											<Button type="submit" disabled={!trimmed || isPending}>
												{draft ? "Save" : "Next"}
											</Button>
										</DialogFooter>
									</>
								) : (
									<>
										<DialogDescription>
											How {trimmed} begins. Either way it is yours to change.
										</DialogDescription>

										<RadioGroup value={start} onValueChange={(next) => setStart(next as Start)}>
											{STARTS.map((item) => (
												<OptionTile key={item.id} variant="row" htmlFor={`create-start-${item.id}`}>
													<RadioGroupItem id={`create-start-${item.id}`} value={item.id} />
													<span className="flex flex-col gap-0.5">
														<span className="font-medium">{item.label}</span>
														<span className="text-xs text-muted-foreground">{item.detail}</span>
													</span>
												</OptionTile>
											))}
										</RadioGroup>

										<DialogFooter>
											<Button type="submit" disabled={isPending}>
												Create
											</Button>
										</DialogFooter>
									</>
								)}
							</motion.div>
						</AnimatePresence>
					</motion.div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
