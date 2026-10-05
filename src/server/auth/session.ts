import { useSession } from "@tanstack/react-start/server";

import { env } from "../env";

export type Tokens = { token: string; refreshToken: string };

/**
 * What a visitor's cookie holds: the backend's token pair once they are in,
 * and the state of a sign-in that is under way until then.
 */
type SessionData = Partial<Tokens> & { pending?: string };

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/**
 * The visitor's session, sealed into a cookie. Each request reads its own,
 * so two people in two browsers never share a token, and the tokens never
 * reach the page: the cookie is encrypted and the browser cannot read it.
 */
export function session() {
	return useSession<SessionData>({
		name: "schemaforge",
		password: env.SCHEMAFORGE_SESSION_SECRET,
		maxAge: THIRTY_DAYS,
		cookie: { httpOnly: true, sameSite: "lax", secure: import.meta.env.PROD, path: "/" },
	});
}
