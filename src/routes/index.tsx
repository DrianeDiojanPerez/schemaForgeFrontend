import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ErdCanvas } from "@/features/erd/components/erd-canvas";
import { exampleSchema1 } from "@/features/erd/data/examples";
import { toDiagram } from "@/features/erd/lib/schema-adapter";
import { schemaQueries } from "@/features/schema/api/queries";

const EXAMPLE = {
	diagram: exampleSchema1,
	schema: { id: "", name: "untitled schema" },
};

export const Route = createFileRoute("/")({
	// Filled on the server, so the first paint already has the diagram rather
	// than flashing an empty canvas while a client fetch resolves.
	loader: ({ context }) => context.queryClient.query(schemaQueries.latest()),
	component: SchemaBuilderPage,
});

function SchemaBuilderPage() {
	const { data: stored } = useSuspenseQuery(schemaQueries.latest());
	const { diagram, schema } = stored
		? {
				diagram: toDiagram(stored),
				schema: { id: stored.id, name: stored.name },
			}
		: EXAMPLE;

	return (
		<main className="h-svh w-full">
			{/* Keyed so another schema arriving starts a fresh canvas. */}
			<ErdCanvas key={schema.id} diagram={diagram} schema={schema} />
		</main>
	);
}
