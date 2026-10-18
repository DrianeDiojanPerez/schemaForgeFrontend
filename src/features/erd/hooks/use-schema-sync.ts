import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { backendKeys } from "@/features/schema/api/keys";
import { useSaveSchema, useValidateSchema } from "@/features/schema/api/mutations";
import { ddlQueries } from "@/features/schema/api/queries";
import { EMPTY_SCHEMA } from "@/features/schema/types/schema";
import type { Diagnostic, Schema } from "@/features/schema/types/schema";
import { notify } from "@/lib/toast";
import { exportSchema, importSchema } from "@/server/rpc/schema";
import type { ImportFormat } from "@/server/rpc/schema";

import { downloadText, fileSlug } from "../lib/download";
import { problemsByTable, toDraft } from "../lib/schema-adapter";
import type { ErdEdge, ErdNode } from "../types/erd";

type Options = {
	schemaId: string;
	name: string;
	nodes: ErdNode[];
	edges: ErdEdge[];
	autoSave: boolean;
	autoValidate: boolean;
	/** Whether a script carries where each table sits, as comments at the end. */
	includePositions: boolean;
	onSaved: (schemaId: string) => void;
	/** The backend could not answer a validation, so nothing will mark the tables. */
	onValidateUnavailable: () => void;
};

export type Generated = {
	/** Empty when the schema has errors, since the backend writes no SQL for one. */
	ddl: string;
	diagnostics: Diagnostic[];
	includeComments: boolean;
	includePositions: boolean;
	/** The name the script is saved under. */
	file: string;
};

export type GenerateOptions = {
	includeComments?: boolean;
	includePositions?: boolean;
	/** Save the script as a file instead of opening it, when there is one. */
	download?: boolean;
};

// Long enough that dragging a table across the canvas is one round rather than
// one per frame the pointer rested on.
const AUTO_DELAY = 300;

// A pill that comes and goes inside a frame reads as a flicker rather than as
// an answer, so "Saving" stays up this long even when the write beats it.
const SAVING_SHOWN = 1000;

function heldFor(since: number): Promise<void> {
	const left = SAVING_SHOWN - (Date.now() - since);

	if (left <= 0) return Promise.resolve();
	return new Promise((resolve) => setTimeout(resolve, left));
}

/** Empty when the diagram cannot be sent at all, which never matches a write. */
function draftKey(name: string, nodes: ErdNode[], edges: ErdEdge[]): string {
	const result = toDraft(name, "", nodes, edges);

	return result.ok ? JSON.stringify(result.draft) : "";
}

function describe(error: unknown): string {
	return error instanceof Error ? error.message : "Something went wrong";
}

/**
 * Save, validate and generate against the backend.
 *
 * Every call sends the picture the canvas is holding rather than a stored id,
 * so what is checked is what is on screen. The draft is rebuilt per call
 * instead of being memoised, because a stale one would report on a diagram the
 * user has already moved on from.
 */
export function useSchemaSync({
	schemaId,
	name,
	nodes,
	edges,
	autoSave,
	autoValidate,
	includePositions: positions,
	onSaved,
	onValidateUnavailable,
}: Options) {
	const { mutateAsync: saveDraft, isPending: saving } = useSaveSchema();
	const { mutateAsync: checkDraft, isPending: validating } = useValidateSchema();
	const [generating, setGenerating] = useState(false);
	const busy = saving || validating || generating;

	// A call that fails may have lost the backend, and the connection check
	// only asks again once it has been told to. Asking here is what starts the
	// retries that end in "Connected".
	const queryClient = useQueryClient();

	const failed = useCallback(
		(title: string, error: unknown) => {
			notify.error({ title, description: describe(error) });
			void queryClient.invalidateQueries({ queryKey: backendKeys.status });
		},
		[queryClient],
	);

	// The mutations report `isPending` a render late, and the timer below
	// checks between renders, so the calls out are also counted here as they go.
	const inFlight = useRef(0);

	const track = useCallback(<T>(call: Promise<T>): Promise<T> => {
		inFlight.current++;

		return call.finally(() => {
			inFlight.current--;
		});
	}, []);

	const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
	const [problems, setProblems] = useState<Map<string, Diagnostic[]>>(new Map());
	const [generated, setGenerated] = useState<Generated | null>(null);
	// Whether an answer has come back yet, so "no problems" is not claimed
	// before anything was asked.
	const [answered, setAnswered] = useState(false);

	/**
	 * Reports the columns the backend has no type for instead of translating
	 * them, and returns nothing so the caller stops.
	 */
	const draftOrReport = useCallback(() => {
		const result = toDraft(name, "", nodes, edges);

		if (result.ok) return result.draft;

		const [first, ...rest] = result.unsupported;
		const more = rest.length > 0 ? ` and ${rest.length} more` : "";

		notify.error({
			title: "Unsupported column type",
			description: `${first.table}.${first.column} is ${first.format}, which the backend has no type for${more}.`,
		});

		return undefined;
	}, [name, nodes, edges]);

	// What the last write put on the server. The diagram it was loaded with
	// counts as already there, so arriving at one does not save it back.
	const sent = useRef<string | null>(null);
	sent.current ??= draftKey(name, nodes, edges);

	const saves = useRef(0);

	// Whether a table is in hand, and who is waiting for it to be put down.
	// An answer from the backend that lands mid-drag would redraw the canvas
	// and swap a toast under the moving table, so it waits for the drop.
	const inHand = useRef(false);
	const waiting = useRef<(() => void)[]>([]);

	useEffect(() => {
		inHand.current = nodes.some((node) => node.dragging);
		if (inHand.current) return;

		const woken = waiting.current;
		waiting.current = [];
		for (const wake of woken) wake();
	}, [nodes]);

	const settled = useCallback(
		() =>
			new Promise<void>((resolve) => {
				if (inHand.current) waiting.current.push(resolve);
				else resolve();
			}),
		[],
	);

	/**
	 * Every save says so, automatic or asked for, since a write the user cannot
	 * see happening is a write they have to take on trust. `auto` only decides
	 * whether a diagram the server already holds is skipped.
	 */
	const save = useCallback(
		async (auto = false) => {
			const draft = draftOrReport();
			if (!draft) return;

			const key = JSON.stringify(draft);

			// Selecting a table and measuring one both reach here as changes, so an
			// automatic save has to look at what it would send before it writes.
			if (auto && key === sent.current) return;

			notify.waiting({ title: "Saving" });

			const shown = Date.now();
			const run = ++saves.current;

			try {
				const saved = await track(saveDraft({ ...draft, id: schemaId }));
				await settled();

				sent.current = key;
				onSaved(saved.id);

				// Left to finish on its own. Holding the pill is for reading, and the
				// caller has a validation to get on with. A newer save owns the pill by
				// then, so finishing second does not make this the answer on screen.
				void heldFor(shown).then(() => {
					if (saves.current === run) notify.success({ title: "Saved" });
				});
			} catch (error) {
				await settled();
				failed("Save failed", error);
			}
		},
		[draftOrReport, track, saveDraft, schemaId, settled, onSaved, failed],
	);

	/** The last diagram checked, so settling on one twice only asks once. */
	const checked = useRef<string | null>(null);

	/**
	 * Quiet runs say nothing at all. The defects land in the panel and on the
	 * tables that hold them, which is the same answer without a toast for every
	 * pause in typing.
	 *
	 * A backend that cannot answer is reported either way, because the marks it
	 * was asked for are not coming and the canvas gives no sign of that.
	 */
	const validate = useCallback(
		async (quiet = false) => {
			const draft = draftOrReport();
			if (!draft) return;

			const key = JSON.stringify(draft);
			if (quiet && key === checked.current) return;

			if (!quiet) notify.waiting({ title: "Validating" });

			try {
				const report = await track(checkDraft({ draft, id: schemaId }));
				await settled();

				if (report.unavailable) {
					notify.info({
						title: "Not built yet",
						description: report.unavailable,
					});
					onValidateUnavailable();
					return;
				}

				checked.current = key;
				// Marking the tables redraws every one of them, which in one go
				// stalls whatever is moving on screen, like the list sliding open.
				startTransition(() => {
					setDiagnostics(report.diagnostics);
					setProblems(problemsByTable(draft, report.diagnostics));
					setAnswered(true);
				});
				if (quiet) return;

				if (report.valid) {
					notify.success({ title: "No defects found" });
					return;
				}

				const count = report.diagnostics.length;

				notify.warning({
					title: `${count} defect${count === 1 ? "" : "s"}`,
					description: report.diagnostics.at(0)?.message,
				});
			} catch (error) {
				failed("Could not validate", error);
				onValidateUnavailable();
			}
		},
		[draftOrReport, track, checkDraft, schemaId, settled, onValidateUnavailable, failed],
	);

	// Both callbacks take a new identity whenever the diagram does, so the timer
	// reaches them through a ref. Keying the effect on them instead would mean
	// storing the id from one save scheduled the next.
	const latest = useRef({ save, validate });

	useEffect(() => {
		latest.current = { save, validate };
	});

	// Saving first, so what the backend is asked about is what it was just told.
	useEffect(() => {
		if (!autoSave && !autoValidate) return;

		// A table still in hand is not a diagram that has settled. Writing it out
		// mid-drag, and the toasts that come with that, is what made a drag stutter.
		if (nodes.some((node) => node.dragging)) return;

		let timer: ReturnType<typeof setTimeout>;

		// A write already out is holding the diagram as it was a moment ago, so an
		// edit that lands while it is in flight waits for its turn. Giving up here
		// instead would leave that edit unwritten until the next one came along.
		const run = () => {
			if (inFlight.current > 0) {
				timer = setTimeout(run, AUTO_DELAY);
				return;
			}

			void (async () => {
				if (autoSave) await latest.current.save(true);
				if (autoValidate) await latest.current.validate(true);
			})();
		};

		timer = setTimeout(run, AUTO_DELAY);

		return () => clearTimeout(timer);
		// The diagram is not read here, but any change to it restarts the delay.
		// oxlint-disable-next-line react/exhaustive-effect-dependencies
	}, [autoSave, autoValidate, name, nodes, edges]);

	// The script is asked for as soon as the pointer reaches the button, so
	// the dialog has it by the time it opens. Nothing is said on the way: a
	// diagram the backend has no type for is reported when the click comes.
	const prefetch = useCallback(
		(includeComments = true) => {
			const result = toDraft(name, "", nodes, edges);
			if (!result.ok) return;

			void queryClient.prefetchQuery(
				ddlQueries.generated(result.draft, schemaId, includeComments, positions),
			);
		},
		[name, nodes, edges, schemaId, positions, queryClient],
	);

	const generate = useCallback(
		async ({
			includeComments = true,
			includePositions = positions,
			download = false,
		}: GenerateOptions = {}) => {
			const draft = draftOrReport();
			if (!draft) return;

			if (download) notify.waiting({ title: "Exporting" });
			setGenerating(true);

			try {
				const result = await track(
					queryClient.fetchQuery(
						ddlQueries.generated(draft, schemaId, includeComments, includePositions),
					),
				);

				if (result.unavailable) {
					notify.info({ title: "Not built yet", description: result.unavailable });
					return;
				}

				setDiagnostics(result.diagnostics);
				setProblems(problemsByTable(draft, result.diagnostics));
				setAnswered(true);

				const file = `${fileSlug(name)}.sql`;

				if (result.ddl !== "" && download) {
					downloadText(file, result.ddl, "application/sql");
					notify.success({ title: "Exported", description: file });
					return;
				}

				// The dialog says the rest itself. A script that was asked for as a
				// file but could not be written opens the same way, so the errors in
				// the way can be read.
				setGenerated({
					ddl: result.ddl,
					diagnostics: result.diagnostics,
					includeComments,
					includePositions,
					file,
				});
				if (!download) return;

				// An empty script with errors beside it is how a broken diagram
				// comes back, not a failure: the backend writes no SQL a database
				// would refuse.
				const errors = result.diagnostics.filter((item) => item.severity === "ERROR");

				if (errors.length === 0) {
					notify.info({ title: "Nothing to export" });
					return;
				}

				notify.warning({
					title: `${errors.length} error${errors.length === 1 ? "" : "s"} to fix first`,
					description: errors[0].message,
				});
			} catch (error) {
				failed("Could not generate", error);
			} finally {
				setGenerating(false);
			}
		},
		[draftOrReport, track, queryClient, schemaId, name, positions, failed],
	);

	const exportJson = useCallback(async () => {
		const draft = draftOrReport();
		if (!draft) return;

		notify.waiting({ title: "Exporting" });

		try {
			const file = await track(
				exportSchema({
					data: { draft: { ...EMPTY_SCHEMA, ...draft, id: schemaId }, includePositions: positions },
				}),
			);

			downloadText(file.fileName, file.content, file.contentType);
			notify.success({ title: "Exported", description: file.fileName });
		} catch (error) {
			failed("Could not export", error);
		}
	}, [draftOrReport, track, schemaId, positions, failed]);

	const importFile = useCallback(
		async (content: string, format: ImportFormat): Promise<Schema | undefined> => {
			notify.waiting({ title: "Importing" });

			try {
				const result = await track(
					importSchema({ data: { content, format, includePositions: positions } }),
				);
				const skipped = result.diagnostics.length;

				if (skipped === 0) {
					notify.success({ title: "Imported", description: result.draft.name });
				} else {
					notify.warning({
						title: `Imported with ${skipped} part${skipped === 1 ? "" : "s"} skipped`,
						description: result.diagnostics[0].message,
					});
				}

				return result.draft;
			} catch (error) {
				failed("Could not import", error);
				return undefined;
			}
		},
		[track, positions, failed],
	);

	const closeGenerated = useCallback(() => setGenerated(null), []);

	const dismissDiagnostics = useCallback(() => {
		setDiagnostics([]);
		setProblems(new Map());
		setAnswered(false);
	}, []);

	// A stored diagram arriving on the canvas counts as already written, the
	// same as the one it opened with, and nothing said about the last one
	// holds for it.
	const loaded = useCallback(
		(diagramName: string, loadedNodes: ErdNode[], loadedEdges: ErdEdge[]) => {
			sent.current = draftKey(diagramName, loadedNodes, loadedEdges);
			checked.current = null;
			setDiagnostics([]);
			setProblems(new Map());
			setAnswered(false);
			setGenerated(null);
		},
		[],
	);

	/** Whether the diagram on screen differs from what the backend holds. */
	const isDirty = useCallback(
		() => draftKey(name, nodes, edges) !== sent.current,
		[name, nodes, edges],
	);

	return {
		busy,
		generating,
		isDirty,
		diagnostics,
		checked: answered,
		problems,
		generated,
		closeGenerated,
		dismissDiagnostics,
		save,
		validate,
		generate,
		prefetch,
		exportJson,
		importFile,
		loaded,
		draft: draftOrReport,
	};
}
