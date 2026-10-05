import { createFileRoute } from "@tanstack/react-router";

import { LegalLink, LegalPage } from "@/components/legal-page";
import type { LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
	head: () => ({ meta: [{ title: "Privacy Policy · SchemaForge" }] }),
	component: PrivacyPage,
});

const SECTIONS: LegalSection[] = [
	{
		heading: "What is collected",
		body: [
			"When you sign in with Google, SchemaForge receives your name, your email address and your profile picture. These identify your account and are shown to you on the Account tab in settings.",
			"The schemas, diagrams and SQL you create are stored so they can be shown back to you, validated and turned into SQL.",
			"Like most web services, the server keeps technical logs: the time of a request, the address it came from, and whether it succeeded. These help find and fix problems.",
		],
	},
	{
		heading: "How it is used",
		body: [
			"Your account details are used to sign you in, to decide what you are allowed to do, and to show who is signed in. Your schemas are used only to provide the features you ask for.",
			"Nothing you put into SchemaForge is used for advertising, sold, or used to train anything.",
		],
	},
	{
		heading: "Cookies and storage",
		body: [
			"SchemaForge sets one cookie, named schemaforge, which keeps you signed in for up to 30 days. It is sealed so that only the server can read it. There are no advertising or tracking cookies.",
			"Your preferences, such as the theme, the canvas settings and the look of your account cover, are kept in your own browser and never leave it.",
		],
	},
	{
		heading: "Who else sees it",
		body: [
			"Google handles the sign-in itself. What Google does with that is covered by Google's own privacy policy.",
			"The service runs on hosting chosen by the operator, which stores the data on the operator's behalf. Beyond that, your data is not shared with anyone unless the law requires it.",
		],
	},
	{
		heading: "How long it is kept",
		body: [
			"Your account and schemas are kept for as long as you have access. When your account is removed, schemas that belong only to it are deleted within a reasonable time. Technical logs are kept for a short, fixed period and then discarded.",
		],
	},
	{
		heading: "Your choices",
		body: [
			"You can see what is held about your account on the Account tab in settings, and you can export your schemas as SQL at any time.",
			"You can ask the operator to correct your details, to hand over a copy of your data, or to delete your account and everything in it.",
		],
	},
	{
		heading: "Security",
		body: [
			"Traffic between your browser and the server is encrypted. Sessions expire, and sign-in is handled by Google rather than by passwords stored here. No system is perfectly secure, so tell the operator at once if you suspect a problem.",
		],
	},
	{
		heading: "Changes to this policy",
		body: [
			"This policy may be updated. The date at the top shows when it last changed, and meaningful changes will be pointed out where you sign in.",
		],
	},
];

function PrivacyPage() {
	return (
		<LegalPage
			title="Privacy Policy"
			updated="3 October 2026"
			intro="The short version: SchemaForge keeps your name, email and picture from Google so it knows who you are, stores the schemas you draw so it can show them back to you, and does nothing else with any of it."
			sections={SECTIONS}
			footer={
				<p>
					The rules for using the service are in the{" "}
					<LegalLink to="/terms">Terms of Service</LegalLink>. Questions about your data go to
					whoever runs this SchemaForge.
				</p>
			}
		/>
	);
}
