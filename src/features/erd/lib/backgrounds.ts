import { BackgroundVariant } from "@xyflow/react";

/** The pattern behind the tables, listed like the other canvas options. */
export type BackgroundStyle = BackgroundVariant | "none";

export const BACKGROUNDS: { id: BackgroundStyle; label: string }[] = [
	{ id: BackgroundVariant.Dots, label: "Dots" },
	{ id: BackgroundVariant.Lines, label: "Lines" },
	{ id: BackgroundVariant.Cross, label: "Cross" },
	{ id: "none", label: "None" },
];

export const DEFAULT_BACKGROUND: BackgroundStyle = BackgroundVariant.Dots;
