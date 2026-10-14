import { expect, test } from "vitest";

import { vimNotice } from "./lib/vim-notices";

test("a yank counts its lines in plain words", () => {
	expect(vimNotice("1 lines yanked")).toEqual({
		kind: "success",
		title: "Yanked 1 line",
		description: undefined,
		linger: 1000,
	});
	expect(vimNotice('3 lines yanked into "a')).toEqual({
		kind: "success",
		title: "Yanked 3 lines",
		description: 'Into register "a"',
		linger: 1000,
	});
});

test("a complaint is a warning and anything else is for information", () => {
	expect(vimNotice("No match found foo")?.kind).toBe("warning");
	expect(vimNotice('Not an editor command ":foo"')?.kind).toBe("warning");
	expect(vimNotice("  tabstop=4")).toEqual({ kind: "info", title: "tabstop=4" });
});

test("a blank message is nothing to show", () => {
	expect(vimNotice("   ")).toBeNull();
});
