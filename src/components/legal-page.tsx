import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type * as React from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export type LegalSection = { heading: string; body: string[] };

/** The terms and the privacy policy share one page shape: a title, when it
    last changed, and numbered sections of short paragraphs. */
export function LegalPage({
	title,
	updated,
	intro,
	sections,
	footer,
}: {
	title: string;
	updated: string;
	intro: string;
	sections: LegalSection[];
	footer: React.ReactNode;
}) {
	return (
		<main className="relative min-h-svh w-full bg-canvas">
			<div aria-hidden className="fixed inset-0 bg-dots-lg opacity-30" />
			<div className="fixed top-4 right-4">
				<ThemeToggle />
			</div>

			<article className="relative mx-auto flex w-full max-w-2xl flex-col px-6 py-16 sm:py-24">
				<Button variant="ghost" size="sm" className="self-start" render={<Link to="/login" />}>
					<ArrowLeftIcon />
					Back to sign in
				</Button>

				<header className="mt-8 flex flex-col gap-3">
					<p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						SchemaForge
					</p>
					<h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
					<p className="text-sm text-muted-foreground">Last updated {updated}</p>
					<p className="mt-2 max-w-prose text-base leading-relaxed text-pretty">{intro}</p>
				</header>

				<ol className="mt-12 flex flex-col gap-10">
					{sections.map((section, index) => (
						<li key={section.heading} className="flex flex-col gap-3">
							<h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight">
								<span className="text-sm text-muted-foreground tabular-nums">{index + 1}</span>
								{section.heading}
							</h2>
							{section.body.map((paragraph) => (
								<p
									key={paragraph}
									className="max-w-prose text-sm leading-relaxed text-pretty text-foreground/90"
								>
									{paragraph}
								</p>
							))}
						</li>
					))}
				</ol>

				<footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
					{footer}
				</footer>
			</article>
		</main>
	);
}

export function LegalLink({ to, children }: { to: "/terms" | "/privacy"; children: string }) {
	return (
		<Link to={to} className="underline underline-offset-3 hover:text-foreground">
			{children}
		</Link>
	);
}
