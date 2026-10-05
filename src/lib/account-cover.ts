import { useSyncExternalStore } from "react";

export const COVERS = [
	{ id: "dots", label: "Dots" },
	{ id: "grid", label: "Grid" },
	{ id: "stripes", label: "Stripes" },
	{ id: "checks", label: "Checks" },
	{ id: "waves", label: "Waves" },
	{ id: "plain", label: "Plain" },
] as const;

export type CoverPattern = (typeof COVERS)[number]["id"];

/** The band behind the account header: a pattern, drawn over a colour of
    the person's choosing or the theme's muted surface when there is none. */
export type Cover = { pattern: CoverPattern; color: string | null };

const DEFAULT_COVER: Cover = { pattern: "dots", color: null };
const STORAGE_KEY = "account-cover";

const listeners = new Set<() => void>();

const isPattern = (value: unknown): value is CoverPattern =>
	COVERS.some((item) => item.id === value);

// Six digits from a swatch, eight when the wheel added an alpha.
const isHex = (value: unknown): value is string =>
	typeof value === "string" && /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);

// Parsed once per write so the store hands back the same object until then.
let cached: Cover | undefined;

function readCover(): Cover {
	if (cached) return cached;
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
		const { pattern, color } = (stored ?? {}) as Partial<Record<keyof Cover, unknown>>;
		cached = {
			pattern: isPattern(pattern) ? pattern : DEFAULT_COVER.pattern,
			color: isHex(color) ? color : null,
		};
	} catch {
		cached = DEFAULT_COVER;
	}
	return cached;
}

export function setCover(next: Partial<Cover>) {
	cached = { ...readCover(), ...next };
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
	} catch {
		// Private browsing can refuse storage. The choice still shows until reload.
	}
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function useCover(): Cover {
	return useSyncExternalStore(subscribe, readCover, () => DEFAULT_COVER);
}

/** Any CSS colour as the `#rrggbb` a colour input understands. A `var()`
    is looked up on the root first, since the canvas cannot read one. */
export function toHex(color: string): string {
	const context = document.createElement("canvas").getContext("2d");
	if (!context) return "#000000";
	const variable = /^var\((--[\w-]+)\)$/.exec(color)?.[1];
	context.fillStyle = variable
		? getComputedStyle(document.documentElement).getPropertyValue(variable)
		: color;
	context.fillRect(0, 0, 1, 1);
	const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
	return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
