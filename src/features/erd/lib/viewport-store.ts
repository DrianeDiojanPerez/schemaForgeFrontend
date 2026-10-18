import type { Viewport } from "@xyflow/react";

// Where each schema was left, by id, so coming back to one opens it at the
// same zoom and place rather than fitted to the window again.
const STORAGE_KEY = "erd-viewports";

function read(): Partial<Record<string, Viewport>> {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as Partial<Record<string, Viewport>>) : {};
	} catch {
		return {};
	}
}

export function savedViewport(schemaId: string): Viewport | undefined {
	if (!schemaId) return undefined;

	const viewport = read()[schemaId];

	return viewport && Number.isFinite(viewport.zoom) && viewport.zoom > 0 ? viewport : undefined;
}

export function rememberViewport(schemaId: string, viewport: Viewport) {
	if (!schemaId) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), [schemaId]: viewport }));
	} catch {
		// Private browsing can refuse storage. The view still works, it just
		// opens fitted next time.
	}
}
