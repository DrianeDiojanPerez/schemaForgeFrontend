import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { backendKeys } from "@/features/schema/api/keys";
import { useGenerateDdl, useSaveSchema, useValidateSchema } from "@/features/schema/api/mutations";
import type { Diagnostic } from "@/features/schema/types/schema";
import { notify } from "@/lib/toast";

import { problemsByTable, toDraft } from "../lib/schema-adapter";
import type { ErdEdge, ErdNode } from "../types/erd";

type Options = {
	schemaId: string;
	name: string;
	nodes: ErdNode[];
	edges: ErdEdge[];
	autoSave: boolean;
	autoValidate: boolean;
	onSaved: (schemaId: string) => void;
	/** The backend could not answer a validation, so nothing will mark the tables. */
	onValidateUnavailable: () => void;
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
	onSaved,
	onValidateUnavailable,
}: Options) {
	const { mutateAsync: saveDraft, isPending: saving } = useSaveSchema();
	const { mutateAsync: checkDraft, isPending: validating } = useValidateSchema();
	const { mutateAsync: generateFromDraft, isPending: generating } = useGenerateDdl();
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
	const [ddl, setDdl] = useState<string | null>(null);
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

				sent.current = key;
				onSaved(saved.id);

				// Left to finish on its own. Holding the pill is for reading, and the
				// caller has a validation to get on with. A newer save owns the pill by
				// then, so finishing second does not make this the answer on screen.
				void heldFor(shown).then(() => {
					if (saves.current === run) notify.success({ title: "Saved" });
				});
			} catch (error) {
				failed("Save failed", error);
			}
		},
		[draftOrReport, track, saveDraft, schemaId, onSaved, failed],
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
		[draftOrReport, track, checkDraft, schemaId, onValidateUnavailable, failed],
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
	}, [autoSave, autoValidate, name, nodes, edges]);

	const generate = useCallback(async () => {
		const draft = draftOrReport();
		if (!draft) return;

		notify.waiting({ title: "Generating" });

		try {
			const result = await track(generateFromDraft({ draft, id: schemaId }));

			if (result.unavailable) {
				notify.info({ title: "Not built yet", description: result.unavailable });
				return;
			}

			setDiagnostics(result.diagnostics);
			setProblems(problemsByTable(draft, result.diagnostics));
			setDdl(result.ddl);
			notify.success({ title: "Generated" });
		} catch (error) {
			failed("Could not generate", error);
		}
	}, [draftOrReport, track, generateFromDraft, schemaId, failed]);

	const closeDdl = useCallback(() => setDdl(null), []);

	const dismissDiagnostics = useCallback(() => {
		setDiagnostics([]);
		setProblems(new Map());
		setAnswered(false);
	}, []);

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
		ddl,
		closeDdl,
		dismissDiagnostics,
		save,
		validate,
		generate,
	};
}
