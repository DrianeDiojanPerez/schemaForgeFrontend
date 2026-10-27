// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CreateSchemaDialog } from "@/features/erd/components/create-schema-dialog";
import { EMPTY_SCHEMA } from "@/features/schema/types/schema";

const createSchema = vi.fn();

vi.mock("@/server/rpc/schema", () => ({
	createSchema: (...args: unknown[]) => createSchema(...args),
	updateSchema: vi.fn(),
	deleteSchema: vi.fn(),
	validateSchema: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
	notify: { error: vi.fn(), success: vi.fn(), info: vi.fn(), waiting: vi.fn(), warning: vi.fn() },
}));

afterEach(() => {
	cleanup();
	createSchema.mockReset();
});

test("names a schema and hands back the one the backend made", async () => {
	const saved = { ...EMPTY_SCHEMA, id: "abc", name: "inventory" };
	createSchema.mockResolvedValue(saved);

	const onCreated = vi.fn();
	const onOpenChange = vi.fn();

	render(
		<QueryClientProvider client={new QueryClient()}>
			<CreateSchemaDialog open onOpenChange={onOpenChange} onCreated={onCreated} />
		</QueryClientProvider>,
	);

	expect(screen.getByText("New schema")).toBeTruthy();

	const next = screen.getByRole<HTMLButtonElement>("button", { name: "Next" });
	expect(next.disabled).toBe(true);

	fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  inventory " } });
	expect(next.disabled).toBe(false);
	fireEvent.click(next);
	fireEvent.click(await screen.findByRole("button", { name: "Create" }));

	await waitFor(() => expect(onCreated).toHaveBeenCalledWith(saved));
	expect(createSchema).toHaveBeenCalledWith({
		data: { name: "inventory", description: "", entities: [], relationships: [] },
	});
	expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("starting from the sample sends its tables along", async () => {
	createSchema.mockImplementation(({ data }) =>
		Promise.resolve({ ...EMPTY_SCHEMA, ...data, id: "s" }),
	);

	render(
		<QueryClientProvider client={new QueryClient()}>
			<CreateSchemaDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />
		</QueryClientProvider>,
	);

	fireEvent.change(screen.getByLabelText("Name"), { target: { value: "shop" } });
	fireEvent.click(screen.getByRole("button", { name: "Next" }));
	fireEvent.click(await screen.findByRole("radio", { name: /Sample tables/ }));
	fireEvent.click(screen.getByRole("button", { name: "Create" }));

	await waitFor(() => expect(createSchema).toHaveBeenCalled());
	const sent = createSchema.mock.calls[0][0].data;
	expect(sent.name).toBe("shop");
	expect(sent.entities.length).toBeGreaterThan(0);
	expect(sent.relationships.length).toBeGreaterThan(0);
});
