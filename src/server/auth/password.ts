import { createServerFn } from "@tanstack/react-start";

import { v1 } from "../rpc/client";
import { session } from "./session";

export type Registration = { name: string; email: string; password: string };

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

		await (
			await session()
		).update({
			token: tokens.token,
			refreshToken: tokens.refreshToken,
			pending: undefined,
		});
	});
