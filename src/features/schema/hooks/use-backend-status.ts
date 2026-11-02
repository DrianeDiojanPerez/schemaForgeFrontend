import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { notify } from "@/lib/toast";

import { CHECKING, backendQueries } from "../api/queries";
import type { BackendStatus } from "../api/queries";

export type { BackendState, BackendStatus } from "../api/queries";

let announced = false;

// A backend waking from suspend answers within a few seconds, and the canvas
// is already covering that wait. Only a silence longer than a wake-up is
// worth a toast.
const GRACE = 5000;

/**
 * Watches the connection for the canvas. A working backend is what the app
 * is supposed to have, so it passes without comment and only trouble
 * interrupts: the first bad answer of the session is reported once, after a
 * grace period a wake-up fits inside, the retries after it are silent, and
 * the answer that ends them says so while the caller reloads. A silence
 * that ends inside the grace period is never mentioned.
 */
export function useBackendWatch(onReconnect: () => Promise<void> | void) {
	const { data } = useQuery(backendQueries.status());
	const before = useRef(data?.state);
	const grace = useRef<number>(undefined);
	const told = useRef(false);

	useEffect(() => () => window.clearTimeout(grace.current), []);

	useEffect(() => {
		if (!data) return;

		const was = before.current;
		before.current = data.state;

		if (data.state === "checking" || data.state === was) return;

		if (data.state !== "online") {
			if (announced) return;

			// Up and answering, and every save will still fail. That is a warning
			// rather than an error: nothing is broken, the credentials are wrong.
			if (data.state === "unauthorised") {
				announced = true;
				told.current = true;
				notify.warning({
					title: "Backend refused sign-in",
					description: data.detail,
				});
				return;
			}

			window.clearTimeout(grace.current);
			grace.current = window.setTimeout(() => {
				announced = true;
				told.current = true;
				notify.error({ title: "Backend unreachable", description: data.detail });
			}, GRACE);
			return;
		}

		window.clearTimeout(grace.current);

		// Online from nothing is the ordinary start, so nothing is said. Online
		// after a bad answer is the wait ending; the caller reloads either way,
		// and is only told about it when the outage itself was mentioned.
		if (was === undefined) return;

		const mentioned = told.current;
		told.current = false;

		if (!mentioned) {
			void onReconnect();
			return;
		}

		notify.waiting({ title: "Reconnecting" });

		void Promise.resolve(onReconnect()).then(() =>
			notify.success({
				title: "Connected",
				description: data.version ? `Backend v${data.version}` : undefined,
			}),
		);
	}, [data, onReconnect]);
}

export function useBackendStatus(): {
	status: BackendStatus;
	check: () => void;
} {
	const queryClient = useQueryClient();
	const query = useQuery(backendQueries.status());

	return {
		status: query.isFetching ? CHECKING : (query.data ?? CHECKING),
		check: () => void queryClient.refetchQueries(backendQueries.status()),
	};
}
