import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { ErdCanvas } from "@/features/erd/components/erd-canvas";
import { exampleSchema1 } from "@/features/erd/data/examples";
import { toDiagram } from "@/features/erd/lib/schema-adapter";
import { schemaQueries } from "@/features/schema/api/queries";
import { currentSession } from "@/server/auth/google";

const UNTITLED = { id: "", name: "untitled schema" };

// A fresh backend opens on the example. One that is away opens on nothing,
// since a full canvas would read as stored work that is not there.
const EXAMPLE = { diagram: exampleSchema1, schema: UNTITLED };
const EMPTY = { diagram: { nodes: [], edges: [] }, schema: UNTITLED };

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const { signedIn } = await currentSession();
		if (!signedIn) throw redirect({ to: "/login" });
	},
	// Filled on the server, so the first paint already has the diagram rather
	// than flashing an empty canvas while a client fetch resolves.
	loader: ({ context }) => context.queryClient.query(schemaQueries.latest()),
	component: SchemaBuilderPage,
});

function SchemaBuilderPage() {
	const { data: latest } = useSuspenseQuery(schemaQueries.latest());
	const { diagram, schema } = latest.schema
		? {
				diagram: toDiagram(latest.schema),
				schema: { id: latest.schema.id, name: latest.schema.name },
			}
		: latest.reachable
			? EXAMPLE
			: EMPTY;

	return (
		<main className="h-svh w-full">
			{/* Keyed so another schema arriving starts a fresh canvas. */}
			<ErdCanvas key={schema.id} diagram={diagram} schema={schema} />
		</main>
	);
}
