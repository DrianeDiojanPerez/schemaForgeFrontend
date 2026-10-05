import { createServerFn } from "@tanstack/react-start";

import { v1 } from "../rpc/client";
import { session } from "./session";

/**
 * Signing in with Google, in two halves. The first asks the backend for the
 * consent link and remembers a random state in the session. The second gets
 * the code Google sent back, checks the state is the one this browser left
 * with, and trades the code for the backend's tokens. The frontend holds no
 * Google settings of its own.
 */

export const currentSession = createServerFn({ method: "GET" }).handler(
	async (): Promise<{ signedIn: boolean }> => ({
		signedIn: Boolean((await session()).data.token),
	}),
);

export const startGoogleLogin = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ url: string }> => {
		const current = await session();
		const state = crypto.randomUUID();

		await current.update({ pending: state });

		return v1.AuthService.googleLoginUrl({ state });
	},
);

export const finishGoogleLogin = createServerFn({ method: "POST" })
	.validator((input: { code: string; state: string }) => input)
	.handler(async ({ data }) => {
		const current = await session();

		if (!current.data.pending || current.data.pending !== data.state) {
			throw new Error("This sign-in did not start here. Try again.");
		}

		const tokens = await v1.AuthService.loginWithGoogle({ code: data.code });

		await current.update({
			token: tokens.token,
			refreshToken: tokens.refreshToken,
			pending: undefined,
		});
	});

export type Account = {
	id: string;
	email: string;
	name: string;
	avatarUrl: string;
	roles: string[];
	permissions: { module: string; name: string }[];
};

export const currentUser = createServerFn({ method: "GET" }).handler(async (): Promise<Account> => {
	const me = await v1.AuthService.getCurrentUser();

	return {
		id: me.id,
		email: me.email,
		name: me.name,
		avatarUrl: me.avatarUrl,
		roles: me.roles,
		permissions: me.permissions.map(({ module, name }) => ({ module, name })),
	};
});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
	await (await session()).clear();
});
