import type * as React from "react";
import { useEffect, useState } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { AuthPage, Solid } from "@/components/auth-page";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { currentSession } from "@/server/auth/google";
import { signInWithPassword } from "@/server/auth/password";

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
			{(leaving) => <PasswordForm disabled={leaving} onDone={() => navigate({ to: "/" })} />}
		</AuthPage>
	);
}

function PasswordForm({ disabled, onDone }: { disabled: boolean; onDone: () => Promise<void> }) {
	const [sending, setSending] = useState(false);
	const busy = disabled || sending;

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (sending) return;

		const form = new FormData(event.currentTarget);
		setSending(true);

		try {
			await signInWithPassword({
				data: {
					email: String(form.get("email") ?? ""),
					password: String(form.get("password") ?? ""),
				},
			});
			await onDone();
		} catch (reason) {
			notify.error({
				title: "Could not sign you in",
				description: reason instanceof Error ? reason.message : "Try again in a moment.",
			});
			setSending(false);
		}
	};

	return (
		<form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
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
						disabled={busy}
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
						disabled={busy}
					/>
				</Solid>
			</Field>
			<Button type="submit" size="lg" className="w-full" disabled={busy} aria-busy={sending}>
				{sending ? "Signing you in" : "Sign in"}
			</Button>
		</form>
	);
}
