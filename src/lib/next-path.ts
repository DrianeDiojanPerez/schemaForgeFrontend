/**
 * Where to go once signed in, as a search parameter on the sign-in pages.
 * Only a path on this site is kept, so a link cannot send someone off to
 * another one after they have typed a password here.
 */
export function localPath(value: unknown): string | undefined {
	return typeof value === "string" && /^\/(?!\/)/.test(value) ? value : undefined;
}

/** The invitation page, told that the account was made just now for it. */
export function afterSignUp(next: string | undefined): string {
	if (!next) return "/";

	return next.startsWith("/invitations/") ? `${next}?claimed=1` : next;
}
