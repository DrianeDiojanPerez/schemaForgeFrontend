import type * as React from "react";
import { useEffect } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { AuthPage, Solid } from "@/components/auth-page";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { currentSession } from "@/server/auth/google";

export const Route = createFileRoute("/login")({
	validateSearch: (search: Record<string, unknown>): { error?: string } =>
		typeof search.error === "string" ? { error: search.error } : {},
	beforeLoad: async () => {
		const { signedIn } = await currentSession();
		if (signedIn) throw redirect({ to: "/" });
	},
	head: () => ({ meta: [{ title: "Sign in · SchemaForge" }] }),
	component: LoginPage,
});

function LoginPage() {
	const { error } = Route.useSearch();
	const navigate = Route.useNavigate();

	// Google sends failures back in the address bar. Say it once, then take
	// it out of the address so a reload does not repeat it.
	useEffect(() => {
		if (!error) return;
		notify.error({ title: "Sign-in did not go through", description: error });
		void navigate({ search: {}, replace: true });
	}, [error, navigate]);

	return (
		<AuthPage
			title="Welcome back"
			blurb="Sign in to SchemaForge to pick up your diagrams where you left them."
			googleLabel="Continue with Google"
			footer={
				<>
					New to SchemaForge?{" "}
					<Link to="/create" className="text-foreground underline underline-offset-3">
						Create an account
					</Link>
				</>
			}
		>
			{(leaving) => <PasswordForm disabled={leaving} />}
		</AuthPage>
	);
}

// TODO: sign in with the email and password through the backend once it
// has a call for it. Until then submitting only says so.
function PasswordForm({ disabled }: { disabled: boolean }) {
	const submit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		notify.info({
			title: "Not built yet",
			description: "Signing in with a password is not wired up yet. Use Google for now.",
		});
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-4">
			<Field>
				<FieldLabel htmlFor="login-email">Email</FieldLabel>
				<Solid>
					<Input
						id="login-email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						required
						autoFocus
						disabled={disabled}
					/>
				</Solid>
			</Field>
			<Field>
				<FieldLabel htmlFor="login-password">Password</FieldLabel>
				<Solid>
					<Input
						id="login-password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						disabled={disabled}
					/>
				</Solid>
			</Field>
			<Button type="submit" size="lg" className="w-full" disabled={disabled}>
				Sign in
			</Button>
		</form>
	);
}
