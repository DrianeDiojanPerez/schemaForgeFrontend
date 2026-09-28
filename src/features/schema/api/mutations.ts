import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
	createSchema,
	deleteSchema,
	generateDdl,
	updateSchema,
	validateSchema,
} from "@/server/rpc/schema";

import { EMPTY_SCHEMA } from "../types/schema";
import type { Dialect, SchemaDraft } from "../types/schema";
import { schemaKeys } from "./keys";

/**
 * Writes. Each hook wraps one backend call and knows which cached reads it
 * puts out of date, so a caller only says what it wants done. What to tell
 * the user about it stays with the caller.
 */

export function useSaveSchema() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...draft }: SchemaDraft & { id?: string }) =>
			id ? updateSchema({ data: { ...draft, id } }) : createSchema({ data: draft }),
		onSuccess: (saved) => {
			queryClient.setQueryData(schemaKeys.detail(saved.id), saved);
			void queryClient.invalidateQueries({ queryKey: schemaKeys.lists() });
		},
	});
}

export function useDeleteSchema() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteSchema({ data: { id } }),
		onSuccess: ({ id }) => {
			queryClient.removeQueries({ queryKey: schemaKeys.detail(id) });
			void queryClient.invalidateQueries({ queryKey: schemaKeys.lists() });
		},
	});
}

type Checked = { draft: SchemaDraft; id: string };

/** Validation and generation report on the draft and change nothing stored. */
export function useValidateSchema() {
	return useMutation({
		mutationFn: ({ draft, id }: Checked) =>
			validateSchema({ data: { draft: { ...EMPTY_SCHEMA, ...draft, id } } }),
	});
}

export function useGenerateDdl() {
	return useMutation({
		mutationFn: ({ draft, id, dialect }: Checked & { dialect?: Dialect }) =>
			generateDdl({
				data: { draft: { ...EMPTY_SCHEMA, ...draft, id }, dialect },
			}),
	});
}
