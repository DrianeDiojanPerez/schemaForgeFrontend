import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cookie-notice";

const listeners = new Set<() => void>();

function readSeen(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === "seen";
	} catch {
		return true;
	}
}

export function dismissCookieNotice() {
	try {
		localStorage.setItem(STORAGE_KEY, "seen");
	} catch {
		// Private browsing can refuse storage. The notice still goes for now.
	}
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Whether the cookie notice has been read. The server says yes, so the
    notice never flashes into a page that was already acknowledged. */
export function useCookieNoticeSeen(): boolean {
	return useSyncExternalStore(subscribe, readSeen, () => true);
}
