// @vitest-environment jsdom
import type * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ShareDialog } from "@/features/erd/components/share-dialog";
import { initials } from "@/features/erd/components/share-dialog";

const shareSchema = vi.fn();
const listPeople = vi.fn();

vi.mock("@/server/rpc/schema", () => ({
	shareSchema: (...args: unknown[]) => shareSchema(...args),
	listPeople: (...args: unknown[]) => listPeople(...args),
	changeShareRole: vi.fn(),
	revokeShare: vi.fn(),
	cancelInvitation: vi.fn(),
	acceptInvitation: vi.fn(),
	createSchema: vi.fn(),
	updateSchema: vi.fn(),
	deleteSchema: vi.fn(),
	validateSchema: vi.fn(),
	listSchemas: vi.fn(),
	listSharedSchemas: vi.fn(),
	getSchema: vi.fn(),
	generateDdl: vi.fn(),
	checkBackend: vi.fn(),
}));

vi.mock("@/server/auth/google", () => ({
	currentUser: () =>
		Promise.resolve({
			id: "me",
			email: "ada@example.com",
			name: "Ada Lovelace",
			avatarUrl: "",
			roles: [],
			permissions: [],
		}),
}));

const notify = vi.hoisted(() => ({
	error: vi.fn(),
	success: vi.fn(),
	info: vi.fn(),
	waiting: vi.fn(),
	warning: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({ notify }));

// The role label morphs through the Web Animations API, which jsdom lacks.
vi.mock("torph/react", () => ({
	TextMorph: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

afterEach(() => {
	cleanup();
	shareSchema.mockReset();
	listPeople.mockReset();
	notify.success.mockReset();
});

function open() {
	listPeople.mockResolvedValue({ members: [], invitations: [] });

	render(
		<QueryClientProvider
			client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
		>
			<ShareDialog open onOpenChange={vi.fn()} schemaId="s1" schemaName="shop" />
		</QueryClientProvider>,
	);
}

test("the owner heads the list and a new member joins it", async () => {
	open();
	shareSchema.mockResolvedValue({
		ok: true,
		value: {
			member: {
				user: { id: "u2", email: "bob@example.com", name: "Bob" },
				role: "viewer",
				sharedBy: "me",
				createdAt: "",
				updatedAt: "",
			},
		},
	});

	expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
	expect(screen.getByText("Owner")).toBeTruthy();

	fireEvent.change(screen.getByLabelText("Email"), { target: { value: " bob@example.com " } });
	fireEvent.click(screen.getByRole("button", { name: "Invite" }));

	expect(await screen.findByText("Bob")).toBeTruthy();
	expect(shareSchema).toHaveBeenCalledWith({
		data: {
			schemaId: "s1",
			email: "bob@example.com",
			role: "viewer",
			callbackUri: `${window.location.origin}/invitations/`,
		},
	});
	expect(notify.success).toHaveBeenCalled();
});

test("an address that already has access is said so under the box", async () => {
	open();
	shareSchema.mockResolvedValue({
		ok: false,
		status: "ALREADY_EXISTS",
		appCode: 1004,
		message: "`bob@example.com` already has access to this schema",
	});

	await screen.findByText("Ada Lovelace");
	fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bob@example.com" } });
	fireEvent.click(screen.getByRole("button", { name: "Invite" }));

	expect(await screen.findByRole("alert")).toHaveProperty(
		"textContent",
		"bob@example.com already has access.",
	);
	expect(notify.error).not.toHaveBeenCalled();
});

test("an address already invited is told apart from one with access", async () => {
	open();
	shareSchema.mockResolvedValue({
		ok: false,
		status: "ALREADY_EXISTS",
		appCode: 1004,
		message: "`bob@example.com` has already been invited to this schema",
	});

	await screen.findByText("Ada Lovelace");
	fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bob@example.com" } });
	fireEvent.click(screen.getByRole("button", { name: "Invite" }));

	await waitFor(() =>
		expect(screen.getByRole("alert").textContent).toBe("bob@example.com has already been invited."),
	);
});

test("initials come from the name, or the address when there is none", () => {
	expect(initials({ name: "Ada Lovelace", email: "ada@example.com" })).toBe("AL");
	expect(initials({ name: "Ada", email: "ada@example.com" })).toBe("AD");
	expect(initials({ name: "", email: "bob@example.com" })).toBe("BO");
});
