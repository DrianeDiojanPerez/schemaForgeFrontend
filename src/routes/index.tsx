import { useQuery, useQueryClient } from "@tanstack/react-query";
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
	// The schema is fetched by the browser rather than on the server, so the
	// page itself arrives at once and a backend still waking up only delays
	// the diagram, behind the canvas's own cover.
	component: SchemaBuilderPage,
});

function SchemaBuilderPage() {
	const { data: latest } = useQuery(schemaQueries.latest());
	const queryClient = useQueryClient();
	const { diagram, schema } = latest?.schema
		? {
				diagram: toDiagram(latest.schema),
				schema: { id: latest.schema.id, name: latest.schema.name },
			}
		: EMPTY;

	// Someone with nothing stored is offered a schema to name. A backend that
	// is away gets the empty canvas alone, since there is nothing to create
	// against.
	const reachable = latest?.reachable ?? false;
	const askForSchema = latest !== undefined && !latest.schema && reachable;
	const noticeOpen = useBrowserNoticeOpen();
	const retry = () =>
		void queryClient.refetchQueries({ queryKey: schemaQueries.latest().queryKey });

	return (
		<main className="h-svh w-full">
			<ErdCanvas
				diagram={diagram}
				schema={schema}
				askForSchema={askForSchema}
				reachable={reachable}
				onRetry={retry}
				held={noticeOpen || !reachable}
			/>
			<BrowserNotice />
		</main>
	);
}
