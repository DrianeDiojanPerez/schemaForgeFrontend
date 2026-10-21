import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { BrowserNotice } from "@/components/browser-notice";
import { ErdCanvas } from "@/features/erd/components/erd-canvas";
import { toDiagram } from "@/features/erd/lib/schema-adapter";
import { schemaQueries } from "@/features/schema/api/queries";
import { useBrowserNoticeOpen } from "@/lib/browser-notice";
import { EMPTY_SCHEMA } from "@/features/schema/types/schema";
import { currentSession } from "@/server/auth/google";

const UNTITLED = { id: "", name: EMPTY_SCHEMA.name };

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
		: EMPTY;

	// Someone with nothing stored is asked to name a schema first. A backend
	// that is away gets the empty canvas alone, since there is nothing to
	// create against.
	const askForSchema = !latest.schema && latest.reachable;
	const noticeOpen = useBrowserNoticeOpen();

	return (
		<main className="h-svh w-full">
			<ErdCanvas diagram={diagram} schema={schema} askForSchema={askForSchema} held={noticeOpen} />
			<BrowserNotice />
		</main>
	);
}
