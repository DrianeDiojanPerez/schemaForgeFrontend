// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import type { ReactNode } from "react";

import { notify } from "@/lib/toast";
import { useBackendWatch } from "@/features/schema/hooks/use-backend-status";

const { checkBackend } = vi.hoisted(() => ({
	checkBackend: vi.fn<() => Promise<{ status: string; version: string; signedIn: boolean }>>(),
}));

vi.mock("@/server/rpc/schema", () => ({ checkBackend }));

vi.mock("@/lib/toast", () => ({
	notify: {
		waiting: vi.fn(),
		success: vi.fn(),
		warning: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
	},
}));

const online = () => Promise.resolve({ status: "OK", version: "0.1.0", signedIn: true });
const offline = () => Promise.reject(new Error("Nothing is answering"));

function watch() {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const onReconnect = vi.fn(() => Promise.resolve());
	const wrapper = ({ children }: { children: ReactNode }) =>
		createElement(QueryClientProvider, { client }, children);

	renderHook(() => useBackendWatch(onReconnect), { wrapper });

	return onReconnect;
}

const pass = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.useRealTimers();
});

test("a backend that answers within the grace period is never mentioned", async () => {
	checkBackend.mockImplementationOnce(offline).mockImplementation(online);
	const onReconnect = watch();

	await pass(100);
	await pass(3000);
	await pass(5000);

	expect(notify.error).not.toHaveBeenCalled();
	expect(notify.waiting).not.toHaveBeenCalled();
	expect(onReconnect).toHaveBeenCalledTimes(1);
});

test("a longer silence is reported once, and its end is announced", async () => {
	checkBackend.mockImplementation(offline);
	const onReconnect = watch();

	await pass(100);
	await pass(4800);
	expect(notify.error).not.toHaveBeenCalled();

	await pass(300);
	expect(notify.error).toHaveBeenCalledTimes(1);
	expect(notify.error).toHaveBeenCalledWith(
		expect.objectContaining({ title: "Backend unreachable" }),
	);

	checkBackend.mockImplementation(online);
	await pass(3000);
	await pass(100);

	expect(notify.waiting).toHaveBeenCalledWith(expect.objectContaining({ title: "Reconnecting" }));
	expect(onReconnect).toHaveBeenCalledTimes(1);
	expect(notify.success).toHaveBeenCalledWith(expect.objectContaining({ title: "Connected" }));
});
