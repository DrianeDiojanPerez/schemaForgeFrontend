import type * as React from "react";
import { useState } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { AuthPage, Solid } from "@/components/auth-page";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { currentSession } from "@/server/auth/google";

export const Route = createFileRoute("/create")({
	beforeLoad: async () => {
		const { signedIn } = await currentSession();
		if (signedIn) throw redirect({ to: "/" });
	},
	head: () => ({ meta: [{ title: "Create account · SchemaForge" }] }),
	component: CreateAccountPage,
});

function CreateAccountPage() {
	return (
		<AuthPage
			title="Create your account"
			blurb="Set up SchemaForge and start drawing your first diagram."
			googleLabel="Sign up with Google"
			footer={
				<>
					Already have an account?{" "}
					<Link to="/login" className="text-foreground underline underline-offset-3">
						Sign in
					</Link>
				</>
			}
		>
			{(leaving) => <SignUpForm disabled={leaving} />}
		</AuthPage>
	);
}

const MIN_PASSWORD = 8;

// TODO: register through the backend once it has a call for it. Until then
// submitting only says so.
function SignUpForm({ disabled }: { disabled: boolean }) {
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");

	const short = password.length > 0 && password.length < MIN_PASSWORD;
	const mismatch = confirm.length > 0 && confirm !== password;

	const submit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (short || mismatch) return;

		notify.info({
			title: "Not built yet",
			description: "Signing up with a password is not wired up yet. Use Google for now.",
		});
	};

	return (
		<form onSubmit={submit} className="flex flex-col gap-4">
			<Field>
				<FieldLabel htmlFor="create-name">Name</FieldLabel>
				<Solid>
					<Input
						id="create-name"
						name="name"
						autoComplete="name"
						placeholder="Ada Lovelace"
						required
						autoFocus
						disabled={disabled}
					/>
				</Solid>
			</Field>
			<Field>
				<FieldLabel htmlFor="create-email">Email</FieldLabel>
				<Solid>
					<Input
						id="create-email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="you@example.com"
						required
						disabled={disabled}
					/>
				</Solid>
			</Field>
			<Field data-invalid={short || undefined}>
				<FieldLabel htmlFor="create-password">Password</FieldLabel>
				<Solid>
					<Input
						id="create-password"
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={MIN_PASSWORD}
						required
						disabled={disabled}
						aria-invalid={short || undefined}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</Solid>
				{short && <FieldError>Use at least {MIN_PASSWORD} characters.</FieldError>}
			</Field>
			<Field data-invalid={mismatch || undefined}>
				<FieldLabel htmlFor="create-confirm">Confirm password</FieldLabel>
				<Solid>
					<Input
						id="create-confirm"
						name="confirm"
						type="password"
						autoComplete="new-password"
						required
						disabled={disabled}
						aria-invalid={mismatch || undefined}
						value={confirm}
						onChange={(event) => setConfirm(event.target.value)}
					/>
				</Solid>
				{mismatch && <FieldError>The passwords do not match.</FieldError>}
			</Field>
			<Button type="submit" size="lg" className="w-full" disabled={disabled}>
				Create account
			</Button>
		</form>
	);
}
