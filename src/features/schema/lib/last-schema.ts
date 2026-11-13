// The schema each person last had open in this browser, by account, so
// coming back lands on it rather than on whichever was saved most recently.
const STORAGE_KEY = "erd-last-schema";

function read(): Partial<Record<string, string>> {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as unknown;
		return stored && typeof stored === "object" ? (stored as Partial<Record<string, string>>) : {};
	} catch {
		return {};
	}
}

export function rememberedSchema(userId: string): string | undefined {
	if (!userId || typeof localStorage === "undefined") return undefined;

	return read()[userId] || undefined;
}

export function rememberSchema(userId: string, schemaId: string) {
	if (!userId || !schemaId) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), [userId]: schemaId }));
	} catch {
		// Private browsing can refuse storage. The canvas still works, it just
		// opens on the latest schema next time.
	}
}
