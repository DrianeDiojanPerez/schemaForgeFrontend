import type { SileoOptions } from "sileo";

import { notify } from "@/lib/toast";

type Kind = "success" | "warning" | "info";

export type VimNotice = { kind: Kind; title: string; description?: string; linger?: number };

// Vim takes its yank message down in a blink and a half, which is less time
// than it takes to read it in a toast.
const YANK_LINGER = 1000;

const YANK = /^(\d+) lines yanked(?: into "(.))?$/;

const TROUBLE = /^(No |Not |Invalid|Argument|Error)|Error:/;

/**
 * Vim's one-line confirmations, read back as a toast. `null` is a message
 * with no words in it, which is nothing to show.
 */
export function vimNotice(text: string): VimNotice | null {
	const message = text.trim();
	if (!message) return null;

	const yank = YANK.exec(message);
	if (yank) {
		const count = Number(yank[1]);
		return {
			kind: "success",
			title: `Yanked ${count} ${count === 1 ? "line" : "lines"}`,
			description: yank[2] ? `Into register "${yank[2]}"` : undefined,
			linger: YANK_LINGER,
		};
	}

	return { kind: TROUBLE.test(message) ? "warning" : "info", title: message };
}

export function showVimNotice(notice: VimNotice, duration: number | undefined) {
	const options: SileoOptions = {
		title: notice.title,
		description: notice.description,
		duration: duration ? duration + (notice.linger ?? 0) : undefined,
	};

	notify[notice.kind](options);
}
