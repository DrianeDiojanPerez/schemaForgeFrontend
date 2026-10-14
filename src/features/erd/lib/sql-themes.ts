import {
	catppuccinFrappe,
	catppuccinLatte,
	catppuccinMacchiato,
	catppuccinMocha,
} from "@catppuccin/codemirror";
import { flavors } from "@catppuccin/palette";
import type { FlavorName } from "@catppuccin/palette";
import type { Extension } from "@codemirror/state";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { gruvboxDark, gruvboxLight } from "@uiw/codemirror-theme-gruvbox-dark";
import { nord } from "@uiw/codemirror-theme-nord";
import { solarizedDark, solarizedLight } from "@uiw/codemirror-theme-solarized";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";

export type SqlTheme =
	| "latte"
	| "frappe"
	| "macchiato"
	| "mocha"
	| "github-light"
	| "github-dark"
	| "gruvbox-light"
	| "gruvbox-dark"
	| "solarized-light"
	| "solarized-dark"
	| "vscode-light"
	| "vscode-dark"
	| "dracula"
	| "nord"
	| "tokyo-night";

export type Palette = {
	base: string;
	ink: string;
	keyword: string;
	type: string;
	string: string;
	number: string;
	mark: string;
	surface: string;
	line: string;
	chip: string;
	accent: string;
	name: string;
	warning: string;
	error: string;
};

export type SqlThemeEntry = {
	id: SqlTheme;
	label: string;
	group: string;
	editor: Extension;
	palette: Palette;
};

function catppuccin(flavour: FlavorName): Palette {
	const c = flavors[flavour].colors;

	return {
		base: c.base.hex,
		ink: c.text.hex,
		keyword: c.mauve.hex,
		type: c.yellow.hex,
		string: c.green.hex,
		number: c.peach.hex,
		mark: c.overlay2.hex,
		surface: c.surface0.hex,
		line: c.surface1.hex,
		chip: c.surface2.hex,
		accent: c.blue.hex,
		name: c.green.hex,
		warning: c.yellow.hex,
		error: c.red.hex,
	};
}

type Ink = Pick<
	Palette,
	"base" | "ink" | "keyword" | "type" | "string" | "number" | "mark" | "name"
>;

// Themes that ship no palette of their own get their card surfaces mixed from
// the page and its text, and warning and error colours that read on either.
function scheme(dark: boolean, ink: Ink): Palette {
	const mix = (share: number) => `color-mix(in srgb, ${ink.base} ${share}%, ${ink.ink})`;

	return {
		...ink,
		surface: mix(92),
		line: mix(80),
		chip: mix(70),
		accent: ink.name,
		warning: dark ? "#e5c07b" : "#9a6700",
		error: dark ? "#f28b82" : "#cf222e",
	};
}

export const SQL_THEME_ENTRIES: readonly SqlThemeEntry[] = [
	{
		id: "latte",
		label: "Latte",
		group: "Catppuccin",
		editor: catppuccinLatte,
		palette: catppuccin("latte"),
	},
	{
		id: "frappe",
		label: "Frappé",
		group: "Catppuccin",
		editor: catppuccinFrappe,
		palette: catppuccin("frappe"),
	},
	{
		id: "macchiato",
		label: "Macchiato",
		group: "Catppuccin",
		editor: catppuccinMacchiato,
		palette: catppuccin("macchiato"),
	},
	{
		id: "mocha",
		label: "Mocha",
		group: "Catppuccin",
		editor: catppuccinMocha,
		palette: catppuccin("mocha"),
	},
	{
		id: "github-light",
		label: "Light",
		group: "GitHub",
		editor: githubLight,
		palette: scheme(false, {
			base: "#ffffff",
			ink: "#24292e",
			keyword: "#d73a49",
			type: "#6f42c1",
			string: "#032f62",
			number: "#005cc5",
			mark: "#6a737d",
			name: "#005cc5",
		}),
	},
	{
		id: "github-dark",
		label: "Dark",
		group: "GitHub",
		editor: githubDark,
		palette: scheme(true, {
			base: "#0d1117",
			ink: "#c9d1d9",
			keyword: "#ff7b72",
			type: "#d2a8ff",
			string: "#a5d6ff",
			number: "#79c0ff",
			mark: "#8b949e",
			name: "#79c0ff",
		}),
	},
	{
		id: "gruvbox-light",
		label: "Light",
		group: "Gruvbox",
		editor: gruvboxLight,
		palette: scheme(false, {
			base: "#fbf1c7",
			ink: "#3c3836",
			keyword: "#9d0006",
			type: "#b57614",
			string: "#3c3836",
			number: "#8f3f71",
			mark: "#928374",
			name: "#076678",
		}),
	},
	{
		id: "gruvbox-dark",
		label: "Dark",
		group: "Gruvbox",
		editor: gruvboxDark,
		palette: scheme(true, {
			base: "#282828",
			ink: "#ebdbb2",
			keyword: "#fb4934",
			type: "#fabd2f",
			string: "#ebdbb2",
			number: "#d3869b",
			mark: "#928374",
			name: "#83a598",
		}),
	},
	{
		id: "solarized-light",
		label: "Light",
		group: "Solarized",
		editor: solarizedLight,
		palette: scheme(false, {
			base: "#fdf6e3",
			ink: "#657b83",
			keyword: "#859900",
			type: "#b58900",
			string: "#2aa198",
			number: "#d33682",
			mark: "#93a1a1",
			name: "#268bd2",
		}),
	},
	{
		id: "solarized-dark",
		label: "Dark",
		group: "Solarized",
		editor: solarizedDark,
		palette: scheme(true, {
			base: "#002b36",
			ink: "#839496",
			keyword: "#859900",
			type: "#b58900",
			string: "#2aa198",
			number: "#d33682",
			mark: "#586e75",
			name: "#268bd2",
		}),
	},
	{
		id: "vscode-light",
		label: "Light",
		group: "VS Code",
		editor: vscodeLight,
		palette: scheme(false, {
			base: "#ffffff",
			ink: "#383a42",
			keyword: "#0000ff",
			type: "#267f99",
			string: "#a31515",
			number: "#098658",
			mark: "#008000",
			name: "#0070c1",
		}),
	},
	{
		id: "vscode-dark",
		label: "Dark",
		group: "VS Code",
		editor: vscodeDark,
		palette: scheme(true, {
			base: "#1e1e1e",
			ink: "#d4d4d4",
			keyword: "#569cd6",
			type: "#4ec9b0",
			string: "#ce9178",
			number: "#b5cea8",
			mark: "#6a9955",
			name: "#9cdcfe",
		}),
	},
	{
		id: "dracula",
		label: "Dracula",
		group: "More",
		editor: dracula,
		palette: scheme(true, {
			base: "#282a36",
			ink: "#f8f8f2",
			keyword: "#ff79c6",
			type: "#8be9fd",
			string: "#f1fa8c",
			number: "#bd93f9",
			mark: "#6272a4",
			name: "#50fa7b",
		}),
	},
	{
		id: "nord",
		label: "Nord",
		group: "More",
		editor: nord,
		palette: scheme(true, {
			base: "#2e3440",
			ink: "#eceff4",
			keyword: "#5e81ac",
			type: "#ebcb8b",
			string: "#a3be8c",
			number: "#b48ead",
			mark: "#4c566a",
			name: "#8fbcbb",
		}),
	},
	{
		id: "tokyo-night",
		label: "Tokyo Night",
		group: "More",
		editor: tokyoNight,
		palette: scheme(true, {
			base: "#1a1b26",
			ink: "#c0caf5",
			keyword: "#bb9af7",
			type: "#0db9d7",
			string: "#9ece6a",
			number: "#ff9e64",
			mark: "#565f89",
			name: "#7aa2f7",
		}),
	},
];

export const SQL_THEMES: readonly { id: SqlTheme; label: string }[] = SQL_THEME_ENTRIES.map(
	({ id, label }) => ({ id, label }),
);

export const SQL_THEME_GROUPS = [...new Set(SQL_THEME_ENTRIES.map((entry) => entry.group))];

export function sqlThemeOf(theme: SqlTheme): SqlThemeEntry {
	return SQL_THEME_ENTRIES.find((entry) => entry.id === theme) ?? SQL_THEME_ENTRIES[0];
}
