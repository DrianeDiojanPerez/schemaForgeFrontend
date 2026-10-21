import { CopyIcon, MonitorSmartphoneIcon } from "lucide-react";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { dismissBrowserNotice, useBrowserNoticeOpen } from "@/lib/browser-notice";
import { notify } from "@/lib/toast";

function browserLink(href: string, label: string) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="font-medium text-foreground underline underline-offset-4"
		>
			{label}
		</a>
	);
}

/** Opens once on a browser that is not Chromium, and stays away after Continue. */
export function BrowserNotice() {
	const open = useBrowserNoticeOpen();

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			notify.success({ title: "Link copied" });
		} catch {
			notify.error({ title: "Could not copy", description: window.location.href });
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={(next) => !next && dismissBrowserNotice()}>
			{/* Opens on its own rather than from a click, so moving focus would
			    draw a keyboard ring on whichever button took it. */}
			<AlertDialogContent size="sm" className="sm:max-w-sm!" initialFocus={false}>
				<AlertDialogHeader>
					<AlertDialogMedia className="bg-primary/10 text-primary">
						<MonitorSmartphoneIcon className="size-8" />
					</AlertDialogMedia>
					<AlertDialogTitle>Works best in Chrome</AlertDialogTitle>
					<AlertDialogDescription className="text-pretty">
						Your browser is missing some of what the canvas relies on, so a few things will not
						work. For the full experience open this in{" "}
						{browserLink("https://www.google.com/chrome/", "Chrome")} or{" "}
						{browserLink("https://www.microsoft.com/edge/download", "Edge")}.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="*:flex-1">
					<Button variant="outline" onClick={() => void copyLink()}>
						<CopyIcon />
						Copy link
					</Button>
					<Button onClick={dismissBrowserNotice}>Continue anyway</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
