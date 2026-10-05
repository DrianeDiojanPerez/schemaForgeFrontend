import { Link } from "@tanstack/react-router";
import { CookieIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dismissCookieNotice, useCookieNoticeSeen } from "@/lib/cookie-notice";

export function CookieNotice() {
	const seen = useCookieNoticeSeen();
	if (seen) return null;

	return (
		<aside
			aria-label="Cookies"
			className="fixed inset-x-4 bottom-4 z-50 flex max-w-sm animate-in flex-col gap-3 rounded-lg bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-300 fade-in-0 slide-in-from-bottom-2 sm:inset-x-auto sm:left-4"
		>
			<div className="flex items-start gap-3">
				<CookieIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
				<p className="text-pretty">
					SchemaForge sets one cookie, to keep you signed in. There is no tracking and nothing is
					shared with advertisers.{" "}
					<Link to="/privacy" className="underline underline-offset-3 hover:text-foreground">
						How your data is handled
					</Link>
				</p>
			</div>
			<Button size="sm" className="self-end" onClick={dismissCookieNotice}>
				Got it
			</Button>
		</aside>
	);
}
