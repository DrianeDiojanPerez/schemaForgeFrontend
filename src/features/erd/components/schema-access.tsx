import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlusIcon, UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { accountQueries, schemaQueries } from "@/features/schema/api/queries";
import { SHARE_ROLE_LABELS } from "@/features/schema/types/schema";
import type { Access } from "@/features/schema/types/schema";

import { Person, ShareDialog } from "./share-dialog";

export type SchemaAccessProps = {
	access: Access;
	schemaId: string;
	schemaName: string;
};

/**
 * The top-right corner of the canvas. The owner gets the share button;
 * anyone the schema was shared with gets a note of what they may do, which
 * opens on who else is in.
 */
export const SchemaAccess = memo(function SchemaAccess({
	access,
	schemaId,
	schemaName,
}: SchemaAccessProps) {
	const [sharing, setSharing] = useState(false);

	if (access === "owner") {
		return (
			<>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Share"
								onClick={() => setSharing(true)}
							/>
						}
					>
						<UserPlusIcon />
					</TooltipTrigger>
					<TooltipContent side="left">Share</TooltipContent>
				</Tooltip>

				<ShareDialog
					open={sharing}
					onOpenChange={setSharing}
					schemaId={schemaId}
					schemaName={schemaName}
				/>
			</>
		);
	}

	return <AccessInfo access={access} schemaId={schemaId} />;
});

function AccessInfo({ access, schemaId }: { access: "editor" | "viewer"; schemaId: string }) {
	const [open, setOpen] = useState(false);
	const { data: me } = useQuery(accountQueries.me());
	const { data: shared } = useQuery(schemaQueries.shared());
	const people = useQuery(schemaQueries.people(schemaId));
	const owner = shared?.schemas.find((item) => item.schema.id === schemaId)?.owner;
	const others = (people.data?.members ?? []).filter((member) => member.user.id !== me?.id);

	return (
		<Popover
			open={open}
			onOpenChange={(next, details) => {
				// A mouse click would pin it open until a click elsewhere. Keep it a
				// hover card for a pointer that hovers; keyboard and touch still open it.
				if (details.reason === "trigger-press" && details.event.detail !== 0 && canHover()) {
					details.cancel();
					return;
				}
				setOpen(next);
			}}
		>
			<PopoverTrigger
				openOnHover
				delay={200}
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`${access === "viewer" ? "View only" : "Can edit"}. Who has access`}
					/>
				}
			>
				<UsersIcon />
			</PopoverTrigger>

			<PopoverContent align="end" className="w-80">
				<PopoverHeader>
					<PopoverTitle>People with access</PopoverTitle>
					<PopoverDescription>
						{access === "viewer"
							? "You can look around, but nothing you change is saved."
							: "You can edit, and your changes are saved as you go."}
					</PopoverDescription>
				</PopoverHeader>

				<ul className="flex max-h-56 flex-col overflow-y-auto">
					{owner && (
						<Person who={owner}>
							<span className="shrink-0 pr-1 text-xs text-muted-foreground">Owner</span>
						</Person>
					)}
					{me && (
						<Person who={me} detail="You">
							<span className="shrink-0 pr-1 text-xs text-muted-foreground">
								{SHARE_ROLE_LABELS[access]}
							</span>
						</Person>
					)}
					{people.isPending && (
						<li className="flex h-12 items-center gap-3" aria-hidden>
							<Skeleton className="size-8" />
							<Skeleton className="h-3.5 w-32" />
						</li>
					)}
					{people.isError && (
						<li className="py-2 text-xs text-destructive">
							Could not read who else is in. {people.error.message}
						</li>
					)}
					{others.map((member) => (
						<Person key={member.user.id} who={member.user}>
							<span className="shrink-0 pr-1 text-xs text-muted-foreground">
								{SHARE_ROLE_LABELS[member.role]}
							</span>
						</Person>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}

function canHover() {
	return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}
