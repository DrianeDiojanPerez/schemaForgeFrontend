import { createFileRoute } from "@tanstack/react-router";

import { LegalLink, LegalPage } from "@/components/legal-page";
import type { LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
	head: () => ({ meta: [{ title: "Terms of Service · SchemaForge" }] }),
	component: TermsPage,
});

const SECTIONS: LegalSection[] = [
	{
		heading: "What SchemaForge is",
		body: [
			"SchemaForge is a tool for drawing database schemas as diagrams, checking them, and turning them into SQL. It is run by the team or person who gave you access, called the operator below.",
			"These terms are between you and the operator. By signing in or using SchemaForge you agree to them. If you do not agree, do not use it.",
		],
	},
	{
		heading: "Your account",
		body: [
			"You sign in with a Google account, or with an email address and password where that is offered. Access is by invitation: the operator decides which accounts may sign in.",
			"Keep your sign-in details to yourself. Anything done through your account counts as done by you. Tell the operator straight away if you think someone else has used it.",
		],
	},
	{
		heading: "Your schemas",
		body: [
			"The schemas, diagrams and SQL you create belong to you, or to whoever you create them for. The operator does not claim ownership of them.",
			"To run the service, the operator needs to store your schemas, show them back to you, validate them and generate SQL from them. You give the operator permission to do that, and nothing more.",
			"You are responsible for what you put into SchemaForge. Do not upload anything you do not have the right to use, and do not put real personal data into a schema that only needs column names.",
		],
	},
	{
		heading: "Acceptable use",
		body: [
			"Use SchemaForge for designing databases. Do not try to break it, overload it, get around its access controls, or reach data that is not yours.",
			"Do not copy, resell or offer SchemaForge to others as your own service without the operator's agreement.",
		],
	},
	{
		heading: "Availability and changes",
		body: [
			"SchemaForge is offered as it is. The operator aims to keep it running and to keep your work safe, but cannot promise it will always be available or free of mistakes. Keep your own copies of anything important, for example by exporting the SQL.",
			"Features may change, be added or be removed over time. Where a change takes something away that you rely on, the operator will try to say so in advance.",
		],
	},
	{
		heading: "Liability",
		body: [
			"To the extent the law allows, the operator is not liable for loss or damage that comes from using SchemaForge or from being unable to use it, including lost data, lost work or decisions made on the basis of generated SQL. Always review generated SQL before running it against a real database.",
			"Nothing in these terms limits liability that cannot be limited by law.",
		],
	},
	{
		heading: "Ending access",
		body: [
			"You can stop using SchemaForge at any time by signing out and asking the operator to remove your account. The operator may suspend or remove access if these terms are broken or if the service is being wound down.",
			"When an account is removed, the schemas that belong only to it are deleted within a reasonable time, unless the law requires them to be kept.",
		],
	},
	{
		heading: "Changes to these terms",
		body: [
			"These terms may be updated. The date at the top shows when they last changed. Continuing to use SchemaForge after a change means you accept the new terms.",
		],
	},
];

function TermsPage() {
	return (
		<LegalPage
			title="Terms of Service"
			updated="3 October 2026"
			intro="The short version: the schemas you draw are yours, SchemaForge may store and process them to do its job, use it as a design tool and not as something to attack, and check the SQL it gives you before you run it."
			sections={SECTIONS}
			footer={
				<p>
					How your data is handled is described in the{" "}
					<LegalLink to="/privacy">Privacy Policy</LegalLink>. Questions about these terms go to
					whoever runs this SchemaForge.
				</p>
			}
		/>
	);
}
