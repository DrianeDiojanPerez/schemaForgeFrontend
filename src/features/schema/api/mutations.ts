import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
	acceptInvitation,
	cancelInvitation,
	changeShareRole,
	createSchema,
	deleteSchema,
	revokeShare,
	shareSchema,
	updateSchema,
	validateSchema,
} from "@/server/rpc/schema";

import { unwrap } from "../lib/failures";
import { EMPTY_SCHEMA } from "../types/schema";
import type { People, SchemaDraft, ShareRole } from "../types/schema";
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

/** Validation reports on the draft and changes nothing stored. */
export function useValidateSchema() {
	return useMutation({
		mutationFn: ({ draft, id }: Checked) =>
			validateSchema({ data: { draft: { ...EMPTY_SCHEMA, ...draft, id } } }),
	});
}

/**
 * Sharing. Each write lands in the cached people list for the schema, so
 * the dialog shows the new member or the changed role without asking again.
 */
export function useShareSchema(schemaId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ email, role }: { email: string; role: ShareRole }) =>
			unwrap(
				await shareSchema({
					data: {
						schemaId,
						email,
						role,
						callbackUri: `${window.location.origin}/invitations/`,
					},
				}),
			),
		onSuccess: (outcome) => {
			queryClient.setQueryData<People>(schemaKeys.people(schemaId), (people) => {
				if (!people) return people;

				return "member" in outcome
					? { ...people, members: [...people.members, outcome.member] }
					: { ...people, invitations: [...people.invitations, outcome.invitation] };
			});
		},
	});
}

export function useChangeShareRole(schemaId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ userId, role }: { userId: string; role: ShareRole }) =>
			unwrap(await changeShareRole({ data: { schemaId, userId, role } })),
		onSuccess: (member) => {
			queryClient.setQueryData<People>(
				schemaKeys.people(schemaId),
				(people) =>
					people && {
						...people,
						members: people.members.map((item) =>
							item.user.id === member.user.id ? member : item,
						),
					},
			);
		},
	});
}

/**
 * The owner taking someone's access away, or a person giving up their own.
 * Either way the person no longer sees the schema, so what they held of it
 * is dropped along with the share.
 */
export function useRevokeShare() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ schemaId, userId }: { schemaId: string; userId: string }) =>
			unwrap(await revokeShare({ data: { schemaId, userId } })),
		onSuccess: ({ userId }, { schemaId }) => {
			queryClient.setQueryData<People>(
				schemaKeys.people(schemaId),
				(people) =>
					people && {
						...people,
						members: people.members.filter((item) => item.user.id !== userId),
					},
			);
			void queryClient.invalidateQueries({ queryKey: schemaKeys.shared() });
		},
	});
}

export function useCancelInvitation(schemaId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (invitationId: string) =>
			unwrap(await cancelInvitation({ data: { schemaId, invitationId } })),
		onSuccess: ({ invitationId }) => {
			queryClient.setQueryData<People>(
				schemaKeys.people(schemaId),
				(people) =>
					people && {
						...people,
						invitations: people.invitations.filter((item) => item.id !== invitationId),
					},
			);
		},
	});
}

export function useAcceptInvitation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (token: string) => unwrap(await acceptInvitation({ data: { token } })),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: schemaKeys.shared() });
		},
	});
}
