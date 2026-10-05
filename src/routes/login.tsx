import type * as React from "react";
import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { MotionConfig, motion } from "motion/react";

import { LegalLink } from "@/components/legal-page";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/lib/toast";
import { currentSession, startGoogleLogin } from "@/server/auth/google";

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

const rise = {
	initial: { opacity: 0, y: 12, filter: "blur(4px)" },
	animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const settle = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

function LoginPage() {
	const { error } = Route.useSearch();
	const navigate = Route.useNavigate();
	const [leaving, setLeaving] = useState(false);

	// Google sends failures back in the address bar. Say it once, then take
	// it out of the address so a reload does not repeat it.
	useEffect(() => {
		if (!error) return;
		failedToSignIn(error);
		void navigate({ search: {}, replace: true });
	}, [error, navigate]);

	const signIn = async () => {
		setLeaving(true);

		try {
			const { url } = await startGoogleLogin();
			window.location.assign(url);
		} catch (reason) {
			setLeaving(false);
			failedToSignIn(reason instanceof Error ? reason.message : "Could not reach the backend.");
		}
	};

	return (
		<MotionConfig reducedMotion="user">
			<main className="relative flex min-h-svh w-full flex-col items-center overflow-x-hidden bg-canvas px-6 py-12">
				{/* The same dots as the canvas, so the page reads as a corner of it. */}
				<div aria-hidden className="fixed inset-0 bg-dots-lg opacity-30" />
				<div className="fixed top-4 right-4">
					<ThemeToggle />
				</div>

				<div className="relative my-auto flex w-full max-w-sm flex-col items-center">
					<motion.a
						{...rise}
						transition={settle}
						href="/"
						aria-label="SchemaForge"
						className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<img src="/favicon.svg" alt="" className="size-14 rounded-xl" />
					</motion.a>

					<motion.h1
						{...rise}
						transition={{ ...settle, delay: 0.08 }}
						className="mt-6 text-center text-2xl font-semibold tracking-tight"
					>
						Welcome back
					</motion.h1>
					<motion.p
						{...rise}
						transition={{ ...settle, delay: 0.14 }}
						className="mt-1.5 max-w-xs text-center text-sm text-balance text-muted-foreground"
					>
						Sign in to SchemaForge to pick up your diagrams where you left them.
					</motion.p>

					<motion.div
						{...rise}
						transition={{ ...settle, delay: 0.2 }}
						className="mt-8 flex w-full flex-col gap-4"
					>
						<PasswordForm disabled={leaving} />
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							<span aria-hidden className="h-px flex-1 bg-border" />
							or
							<span aria-hidden className="h-px flex-1 bg-border" />
						</div>
						{/* The outline button is see-through in the dark theme, and the
                dots would show through it. */}
						<div className="rounded-md bg-background">
							<Button
								variant="outline"
								size="lg"
								className="w-full"
								disabled={leaving}
								aria-busy={leaving}
								onClick={() => void signIn()}
							>
								{leaving ? <Spinner /> : <img src="/google.svg" alt="" className="size-4" />}
								{leaving ? "Opening Google" : "Continue with Google"}
							</Button>
						</div>
						<p className="text-center text-xs text-balance text-muted-foreground">
							By continuing you agree to the <LegalLink to="/terms">Terms of Service</LegalLink> and{" "}
							<LegalLink to="/privacy">Privacy Policy</LegalLink>.
						</p>
					</motion.div>
				</div>
			</main>
		</MotionConfig>
	);
}

function failedToSignIn(description: string) {
	notify.error({ title: "Sign-in did not go through", description });
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
				<div className="rounded-md bg-background">
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
				</div>
			</Field>
			<Field>
				<FieldLabel htmlFor="login-password">Password</FieldLabel>
				<div className="rounded-md bg-background">
					<Input
						id="login-password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						disabled={disabled}
					/>
				</div>
			</Field>
			<Button type="submit" size="lg" className="w-full" disabled={disabled}>
				Sign in
			</Button>
		</form>
	);
}
