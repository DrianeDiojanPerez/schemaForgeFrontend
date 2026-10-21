import { useSyncExternalStore } from "react";

const STORAGE_KEY = "browser-notice";

const listeners = new Set<() => void>();

/**
 * Chromium browsers all carry "Chrome" in the user agent, Edge and Brave
 * included. Safari and Firefox do not, and they are the ones the canvas has
 * trouble on.
 */
export function isChromium(userAgent: string): boolean {
	return /Chrome\/|Chromium\//.test(userAgent);
}

function readSeen(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === "seen";
	} catch {
		return true;
	}
}

export function dismissBrowserNotice() {
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

/** Whether the person has chosen to carry on in their browser. The server
    says yes, so the dialog only ever opens on the client. */
export function useBrowserNoticeSeen(): boolean {
	return useSyncExternalStore(subscribe, readSeen, () => true);
}
