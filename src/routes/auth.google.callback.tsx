import { createFileRoute, redirect } from "@tanstack/react-router";

import { finishGoogleLogin } from "@/server/auth/google";

/**
 * Where Google sends the browser back. The work is all done before anything
 * renders: a good code becomes a session and the canvas, anything else goes
 * back to the sign-in page with the reason.
 */
export const Route = createFileRoute("/auth/google/callback")({
	validateSearch: (search: Record<string, unknown>) => ({
		code: typeof search.code === "string" ? search.code : undefined,
		state: typeof search.state === "string" ? search.state : undefined,
		error: typeof search.error === "string" ? search.error : undefined,
	}),
	beforeLoad: async ({ search }) => {
		if (!search.code || !search.state) {
			throw redirect({
				to: "/login",
				search: { error: search.error ?? "Google sent you back without a sign-in." },
			});
		}

		try {
			await finishGoogleLogin({ data: { code: search.code, state: search.state } });
		} catch (reason) {
			throw redirect({
				to: "/login",
				search: { error: reason instanceof Error ? reason.message : "Could not sign in." },
			});
		}

		throw redirect({ to: "/" });
	},
	component: () => null,
});
