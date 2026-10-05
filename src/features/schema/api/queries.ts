import { queryOptions } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";

import { currentUser } from "@/server/auth/google";
import { checkBackend, getSchema, listSchemas } from "@/server/rpc/schema";

import type { Schema } from "../types/schema";
import { accountKeys, backendKeys, schemaKeys } from "./keys";

export type BackendState = "checking" | "online" | "unauthorised" | "offline";

export type BackendStatus = {
	state: BackendState;
	version: string;
	/** What the backend reported, or why the call never got there. */
	detail: string;
};

const RETRY_EVERY = 3000;

export type Latest = { schema: Schema | null; reachable: boolean };

export const CHECKING: BackendStatus = {
	state: "checking",
	version: "",
	detail: "",
};

/**
 * Reads. Each one is the whole recipe for a query, so a loader, a component
 * and an invalidation all name the same thing and cannot drift apart.
 */
export const schemaQueries = {
	list: (page = 1, perPage = 25) =>
		queryOptions({
			queryKey: schemaKeys.list(page, perPage),
			queryFn: () => listSchemas({ data: { page, perPage } }),
		}),

	detail: (id: string) =>
		queryOptions({
			queryKey: schemaKeys.detail(id),
			queryFn: () => getSchema({ data: { id } }),
		}),

	/**
	 * The most recently updated schema, or null when the backend holds none.
	 * `reachable` says whether the backend answered at all, so the canvas can
	 * open on the example for a fresh backend and on nothing for one that is
	 * away. The connection itself is reported by the status query.
	 *
	 * Never stale: the canvas takes the diagram once and owns it from there, so
	 * a refetch would only rebuild something nobody reads.
	 */
	latest: () =>
		queryOptions({
			queryKey: schemaKeys.latest(),
			queryFn: async (): Promise<Latest> => {
				try {
					const listing = await listSchemas({ data: { page: 1, perPage: 1 } });
					const first = listing.schemas.at(0);

					return {
						schema: first ? await getSchema({ data: { id: first.id } }) : null,
						reachable: true,
					};
				} catch (error) {
					if (isRedirect(error)) throw error;

					return { schema: null, reachable: false };
				}
			},
			staleTime: Infinity,
			retry: false,
		}),
};

export const backendQueries = {
	/**
	 * A backend that answers is asked once and then only on request. One that
	 * does not is asked again every three seconds until it does, so coming back
	 * up is noticed without anyone pressing Check.
	 */
	status: () =>
		queryOptions({
			queryKey: backendKeys.status,
			refetchInterval: (query) =>
				query.state.data && query.state.data.state !== "online" ? RETRY_EVERY : false,
			queryFn: async (): Promise<BackendStatus> => {
				try {
					const result = await checkBackend();

					if (result.signedIn) {
						return {
							state: "online",
							version: result.version,
							detail: result.status,
						};
					}

					return {
						state: "unauthorised",
						version: result.version,
						detail: result.reason ?? "The backend refused the sign-in",
					};
				} catch (error) {
					if (isRedirect(error)) throw error;

					return {
						state: "offline",
						version: "",
						detail: error instanceof Error ? error.message : "No answer",
					};
				}
			},
			staleTime: Infinity,
			retry: false,
		}),
};

export const accountQueries = {
	/** Who is signed in. It changes only by signing out, which reloads the page. */
	me: () =>
		queryOptions({
			queryKey: accountKeys.me,
			queryFn: () => currentUser(),
			staleTime: Infinity,
		}),
};
