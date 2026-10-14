import { createServerFn } from "@tanstack/react-start";

import { SchemaForgeRpcError, v1 } from "../rpc/client";
import { session } from "./session";

export type Credentials = { email: string; password: string };
export type Registration = Credentials & { name: string };

async function keep(tokens: { token: string; refreshToken: string }) {
	await (
		await session()
	).update({
		token: tokens.token,
		refreshToken: tokens.refreshToken,
		pending: undefined,
		via: "password",
	});
}

/** Signs in with an email and password, and keeps the backend's tokens in the cookie. */
export const signInWithPassword = createServerFn({ method: "POST" })
	.validator((input: Credentials) => input)
	.handler(async ({ data }) => {
		try {
			await keep(await v1.AuthService.login({ email: data.email.trim(), password: data.password }));
		} catch (reason) {
			// The client words an unauthenticated answer as a sign-in that has run
			// out, which is right everywhere but here, where there is none yet.
			if (reason instanceof SchemaForgeRpcError && reason.rpc.status === "UNAUTHENTICATED") {
				throw new Error("Wrong email or password.");
			}
			throw reason;
		}
	});

/**
 * Creates the account and signs it in, so the page can send the new person
 * straight to the canvas. The backend checks the fields again and answers
 * with a message the page can show as it is.
 */
export const registerWithPassword = createServerFn({ method: "POST" })
	.validator((input: Registration) => input)
	.handler(async ({ data }) => {
		const tokens = await v1.AuthService.register({
			name: data.name.trim(),
			email: data.email.trim(),
			password: data.password,
		});

		await keep(tokens);
	});
