import type * as React from "react";
import { useState } from "react";
import { MotionConfig, motion } from "motion/react";

import { LegalLink } from "@/components/legal-page";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/lib/toast";
import { startGoogleLogin } from "@/server/auth/google";

const rise = {
	initial: { opacity: 0, y: 12, filter: "blur(4px)" },
	animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const settle = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

/**
 * The form has to sit still while the browser is on its way to Google, so
 * the page owns that flag and hands it to whatever form it is given.
 */
export function AuthPage({
	title,
	blurb,
	googleLabel,
	children,
	footer,
}: {
	title: string;
	blurb: string;
	googleLabel: string;
	children: (leaving: boolean) => React.ReactNode;
	footer: React.ReactNode;
}) {
	const [leaving, setLeaving] = useState(false);

	const openGoogle = async () => {
		setLeaving(true);

		try {
			const { url } = await startGoogleLogin();
			window.location.assign(url);
		} catch (reason) {
			setLeaving(false);
			notify.error({
				title: "Could not open Google",
				description: reason instanceof Error ? reason.message : "Could not reach the backend.",
			});
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
						{title}
					</motion.h1>
					<motion.p
						{...rise}
						transition={{ ...settle, delay: 0.14 }}
						className="mt-1.5 max-w-xs text-center text-sm text-balance text-muted-foreground"
					>
						{blurb}
					</motion.p>

					<motion.div
						{...rise}
						transition={{ ...settle, delay: 0.2 }}
						className="mt-8 flex w-full flex-col gap-4"
					>
						{children(leaving)}
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
								onClick={() => void openGoogle()}
							>
								{leaving ? <Spinner /> : <img src="/google.svg" alt="" className="size-4" />}
								{leaving ? "Opening Google" : googleLabel}
							</Button>
						</div>
						<p className="text-center text-xs text-balance text-muted-foreground">
							By continuing you agree to the <LegalLink to="/terms">Terms of Service</LegalLink> and{" "}
							<LegalLink to="/privacy">Privacy Policy</LegalLink>.
						</p>
					</motion.div>

					<motion.p
						{...rise}
						transition={{ ...settle, delay: 0.26 }}
						className="mt-8 text-center text-sm text-muted-foreground"
					>
						{footer}
					</motion.p>
				</div>
			</main>
		</MotionConfig>
	);
}

/** Wraps an input so the dots do not show through it in the dark theme. */
export function Solid({ children }: { children: React.ReactNode }) {
	return <div className="rounded-md bg-background">{children}</div>;
}
