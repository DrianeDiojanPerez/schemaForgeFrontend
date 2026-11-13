import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { ClockIcon, LinkIcon, MailCheckIcon, UserRoundXIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { schemaKeys } from "@/features/schema/api/keys";
import { useAcceptInvitation } from "@/features/schema/api/mutations";
import { accountQueries, schemaQueries } from "@/features/schema/api/queries";
import type { Latest } from "@/features/schema/api/queries";
import { isForbidden, isInvalid, isMissing } from "@/features/schema/lib/failures";
import { currentSession, signOut } from "@/server/auth/google";

const rise = {
	initial: { opacity: 0, y: 12, filter: "blur(4px)" },
	animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const settle = { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const };

/**
 * Where the link in an invitation email lands. Nobody signed in is sent to
 * sign in first and brought back here; the rest is one call to the backend
 * and a page that says how it went.
 */
export const Route = createFileRoute("/invitations/$token")({
	// Set by the sign-up page: the account was made for this invitation just
	// now, which gave it the schema already.
	validateSearch: (search: Record<string, unknown>): { claimed?: boolean } =>
		search.claimed === true || search.claimed === "1" || search.claimed === 1
			? { claimed: true }
			: {},
	beforeLoad: async ({ params }) => {
		const { signedIn } = await currentSession();
		if (!signedIn) {
			throw redirect({ to: "/login", search: { next: `/invitations/${params.token}` } });
		}
	},
	head: () => ({ meta: [{ title: "Invitation · SchemaForge" }] }),
	component: InvitationPage,
});

type Shown = {
	icon: LucideIcon;
	title: string;
	blurb: React.ReactNode;
	actions: React.ReactNode;
};

function InvitationPage() {
	const { token } = Route.useParams();
	const { claimed = false } = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryClient = useQueryClient();
	const { data: me } = useQuery(accountQueries.me());
	const accept = useAcceptInvitation();
	const [leaving, setLeaving] = useState(false);
	// Strict mode runs the effect twice, and a link only works once.
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		void (async () => {
			try {
				const shared = await accept.mutateAsync(token);
				// Opening the schema is handing it to the canvas as the one to show.
				const schema = await queryClient.fetchQuery(schemaQueries.detail(shared.schema.id));
				queryClient.setQueryData<Latest>(schemaKeys.latest(), { schema, reachable: true });
				await navigate({ to: "/", replace: true });
			} catch {
				// Read off the mutation below.
			}
		})();
	}, [accept, token, queryClient, navigate]);

	// A full load rather than a navigation, so nothing fetched as this person
	// is left in memory for the next.
	const switchAccount = async () => {
		setLeaving(true);
		await signOut();
		window.location.assign(`/login?next=${encodeURIComponent(`/invitations/${token}`)}`);
	};

	const toCanvas = (
		<Button nativeButton={false} render={<Link to="/" />}>
			Open SchemaForge
		</Button>
	);

	let shown: Shown | null = null;

	if (accept.isError) {
		const error = accept.error;

		if (isMissing(error) && claimed) {
			shown = {
				icon: MailCheckIcon,
				title: "It's already yours",
				blurb:
					"Signing up with the address the invitation went to gave you the schema. Find it under Shared with me.",
				actions: toCanvas,
			};
		} else if (isMissing(error)) {
			shown = {
				icon: LinkIcon,
				title: "This link has been used",
				blurb:
					"An invitation link works once. If you accepted it before, the schema is already under Shared with me. If not, ask the owner to share it again.",
				actions: toCanvas,
			};
		} else if (isForbidden(error)) {
			shown = {
				icon: UserRoundXIcon,
				title: "Signed in as someone else",
				blurb: (
					<>
						This invitation was sent to another address
						{me?.email ? (
							<>
								, and you are signed in as <span className="text-foreground">{me.email}</span>
							</>
						) : null}
						. Switch to the account it was sent to and open the link again.
					</>
				),
				actions: (
					<>
						<Button variant="outline" nativeButton={false} render={<Link to="/" />}>
							Stay signed in
						</Button>
						<Button disabled={leaving} aria-busy={leaving} onClick={() => void switchAccount()}>
							{leaving ? <Spinner /> : null}
							Switch account
						</Button>
					</>
				),
			};
		} else if (isInvalid(error)) {
			shown = {
				icon: ClockIcon,
				title: "This invitation has expired",
				blurb: "Invitations last a week. Ask the owner to share the schema with you again.",
				actions: toCanvas,
			};
		} else {
			shown = {
				icon: LinkIcon,
				title: "Could not open the invitation",
				blurb: error.message,
				actions: (
					<>
						<Button
							variant="outline"
							onClick={() => {
								started.current = false;
								accept.reset();
							}}
						>
							Try again
						</Button>
						{toCanvas}
					</>
				),
			};
		}
	}

	return (
		<main className="relative flex min-h-svh w-full flex-col items-center overflow-x-hidden bg-canvas px-6 py-12">
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

				{shown ? (
					<motion.div
						key={shown.title}
						{...rise}
						transition={{ ...settle, delay: 0.08 }}
						className="mt-6 flex flex-col items-center"
					>
						<span className="flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-1 ring-foreground/10">
							<shown.icon className="size-5" />
						</span>
						<h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">
							{shown.title}
						</h1>
						<p className="mt-1.5 max-w-xs text-center text-sm text-balance text-muted-foreground">
							{shown.blurb}
						</p>
						<div className="mt-8 flex items-center gap-2">{shown.actions}</div>
					</motion.div>
				) : (
					<motion.div
						{...rise}
						transition={{ ...settle, delay: 0.08 }}
						className="mt-6 flex flex-col items-center"
						role="status"
					>
						<span className="text-muted-foreground">
							<Spinner className="size-5" />
						</span>
						<h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">
							Opening your invitation
						</h1>
						<p className="mt-1.5 max-w-xs text-center text-sm text-balance text-muted-foreground">
							One moment while the schema is added to what you can see.
						</p>
					</motion.div>
				)}
			</div>
		</main>
	);
}
