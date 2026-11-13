import { useRef, useState } from "react";
import type * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { TextMorph } from "torph/react";
import { EyeIcon, MailIcon, PencilLineIcon, XIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	useCancelInvitation,
	useChangeShareRole,
	useRevokeShare,
	useShareSchema,
} from "@/features/schema/api/mutations";
import { accountQueries, schemaQueries } from "@/features/schema/api/queries";
import { RpcFailure, isConflict, isInvalid } from "@/features/schema/lib/failures";
import { SHARE_ROLE_LABELS } from "@/features/schema/types/schema";
import type { Collaborator, Invitation, Member, ShareRole } from "@/features/schema/types/schema";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/toast";

type RoleOption = { value: ShareRole; label: string; detail: string; icon: LucideIcon };

const ROLES: RoleOption[] = [
	{ value: "viewer", label: "Viewer", detail: "Can look, not change", icon: EyeIcon },
	{
		value: "editor",
		label: "Editor",
		detail: "Can change tables and columns",
		icon: PencilLineIcon,
	},
];

const roleOption = (value: ShareRole) => ROLES.find((role) => role.value === value) ?? ROLES[0];

/** The first letters of a name, or of the address when there is no name. */
export function initials(person: Pick<Collaborator, "name" | "email">): string {
	const parts = person.name.trim().split(/\s+/).filter(Boolean);

	if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

	return person.email.slice(0, 2).toUpperCase();
}

// Enough to catch a name typed where an address goes. The backend has the
// last word on what counts.
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function RoleSelect({
	id,
	value,
	onChange,
	disabled,
	label,
}: {
	id?: string;
	value: ShareRole;
	onChange: (role: ShareRole) => void;
	disabled?: boolean;
	label: string;
}) {
	return (
		<Select value={value} onValueChange={(next) => onChange(next as ShareRole)} items={ROLES}>
			<SelectTrigger id={id} size="sm" aria-label={label} disabled={disabled} className="w-28">
				<SelectValue>
					{(current: ShareRole) => {
						const role = roleOption(current);

						return (
							<>
								{/* The icon pops out and the next one pops in, while the word
                    morphs letter by letter, so the switch reads as a change
                    rather than a repaint. */}
								<span className="relative flex size-4 shrink-0 items-center justify-center">
									<AnimatePresence initial={false}>
										<motion.span
											key={role.value}
											initial={{ opacity: 0, scale: 0.7 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.7 }}
											transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
											className="absolute inset-0 flex items-center justify-center text-muted-foreground"
										>
											<role.icon />
										</motion.span>
									</AnimatePresence>
								</span>
								{/* Held to one width, so the chevron does not shuffle while the
                    letters are still settling. */}
								<TextMorph
									as="span"
									duration={320}
									ease="cubic-bezier(0.16, 1, 0.3, 1)"
									scale={false}
									className="min-w-12"
								>
									{role.label}
								</TextMorph>
							</>
						);
					}}
				</SelectValue>
			</SelectTrigger>
			{/* The group is what keeps the highlight off the popup's edge. */}
			<SelectContent alignItemWithTrigger={false} align="end" className="w-56">
				<SelectGroup>
					{ROLES.map((role) => (
						<SelectItem key={role.value} value={role.value} className="items-start">
							<role.icon className="mt-0.5 text-muted-foreground" />
							<span className="flex flex-col gap-0.5">
								<span>{role.label}</span>
								<span className="text-xs text-muted-foreground!">{role.detail}</span>
							</span>
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}

export function Person({
	who,
	detail,
	children,
}: {
	who: Pick<Collaborator, "name" | "email" | "avatarUrl">;
	detail?: string;
	children?: React.ReactNode;
}) {
	const name = who.name || who.email;

	return (
		<li className="flex h-12 items-center gap-3">
			<Avatar size="default">
				<AvatarImage src={who.avatarUrl || undefined} alt="" referrerPolicy="no-referrer" />
				<AvatarFallback>{initials(who)}</AvatarFallback>
			</Avatar>
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="truncate text-sm font-medium">{name}</span>
				<span className="truncate text-xs text-muted-foreground">
					{detail ?? (who.name ? who.email : "")}
				</span>
			</span>
			{children}
		</li>
	);
}

function PeopleSkeleton() {
	return (
		<ul aria-hidden className="flex flex-col">
			{[0, 1].map((row) => (
				<li key={row} className="flex h-12 items-center gap-3">
					<Skeleton className="size-8" />
					<span className="flex flex-1 flex-col gap-1.5">
						<Skeleton className="h-3.5 w-28" />
						<Skeleton className="h-3 w-40" />
					</span>
				</li>
			))}
		</ul>
	);
}

/** How long an invitation has left, as a person would say it. */
function timeLeft(invitation: Invitation): string {
	const at = new Date(invitation.expiresAt);
	if (Number.isNaN(at.getTime())) return "Pending";

	return at.getTime() < Date.now() ? "Expired" : `${formatDistanceToNow(at)} left`;
}

/**
 * Addresses typed so far, each a chip, and the box for the next one. Enter,
 * a comma, a space or leaving the box turns what was typed into a chip, and
 * backspace in an empty box takes the last chip back for editing.
 */
function Recipients({
	emails,
	onEmailsChange,
	draft,
	onDraftChange,
	problems,
	disabled,
	onSend,
}: {
	emails: string[];
	onEmailsChange: (emails: string[]) => void;
	draft: string;
	onDraftChange: (draft: string) => void;
	/** What the backend said about an address, kept beside its chip. */
	problems: Record<string, string>;
	disabled: boolean;
	onSend: () => void;
}) {
	const box = useRef<HTMLInputElement>(null);

	const remove = (email: string) => onEmailsChange(emails.filter((item) => item !== email));

	const keyed = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			if (draft.trim()) onDraftChange(`${draft},`);
			else onSend();
			return;
		}

		if ((event.key === "," || event.key === " ") && draft.trim()) {
			event.preventDefault();
			onDraftChange(`${draft},`);
			return;
		}

		if (event.key === "Backspace" && draft === "" && emails.length > 0) {
			const last = emails[emails.length - 1];
			remove(last);
			onDraftChange(last);
		}
	};

	return (
		<div
			onClick={() => box.current?.focus()}
			className={cn(
				"flex min-h-9 flex-1 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 shadow-xs transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
				disabled && "opacity-50",
			)}
		>
			{emails.map((email) => {
				const problem = problems[email];

				return (
					<span
						key={email}
						title={problem}
						className={cn(
							"flex h-6 max-w-full items-center gap-1 rounded-md pr-1 pl-2 text-xs",
							problem ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-foreground",
						)}
					>
						<span className="truncate">{email}</span>
						<button
							type="button"
							aria-label={`Remove ${email}`}
							disabled={disabled}
							onClick={() => remove(email)}
							className="flex size-4 shrink-0 items-center justify-center rounded-sm opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
						>
							<XIcon className="size-3" />
						</button>
					</span>
				);
			})}
			<input
				ref={box}
				type="text"
				value={draft}
				onChange={(event) => onDraftChange(event.target.value)}
				onKeyDown={keyed}
				onBlur={() => draft.trim() && onDraftChange(`${draft},`)}
				placeholder={emails.length === 0 ? "Add people by email" : "Add more"}
				aria-label="Email"
				autoComplete="off"
				autoFocus
				disabled={disabled}
				className="h-6 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
		</div>
	);
}

export type ShareDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	schemaId: string;
	schemaName: string;
};

/**
 * Who a schema is shared with, and a way to add people, the way a file is
 * shared in Drive. Only the owner sees it: the people list is theirs alone
 * to read, and they are the owner row at the top of it.
 */
export function ShareDialog({ open, onOpenChange, schemaId, schemaName }: ShareDialogProps) {
	const { data: me } = useQuery(accountQueries.me());
	const people = useQuery(schemaQueries.people(schemaId));
	const share = useShareSchema(schemaId);
	const changeRole = useChangeShareRole(schemaId);
	const revoke = useRevokeShare();
	const cancel = useCancelInvitation(schemaId);

	const [emails, setEmails] = useState<string[]>([]);
	const [draft, setDraft] = useState("");
	const [role, setRole] = useState<ShareRole>("viewer");
	// What was wrong with an address, shown under the box until it is taken
	// out or sent again, rather than in a toast that goes.
	const [problems, setProblems] = useState<Record<string, string>>({});
	const [sending, setSending] = useState(false);

	const forget = (email: string) =>
		setProblems((current) =>
			Object.fromEntries(Object.entries(current).filter(([key]) => key !== email)),
		);

	// A trailing comma is the signal that what was typed is finished.
	const changeDraft = (next: string) => {
		if (!next.endsWith(",")) {
			setDraft(next);
			return;
		}

		const email = next.slice(0, -1).trim().toLowerCase();
		setDraft("");
		if (!email || emails.includes(email)) return;

		if (!looksLikeEmail(email)) {
			setProblems((current) => ({ ...current, [email]: `${email} is not an email address.` }));
		}

		setEmails((current) => [...current, email]);
	};

	const changeEmails = (next: string[]) => {
		for (const gone of emails.filter((email) => !next.includes(email))) forget(gone);
		setEmails(next);
	};

	const send = async () => {
		const pending = draft.trim() ? [...emails, draft.trim().toLowerCase()] : emails;
		setDraft("");
		if (pending.length === 0 || sending) return;

		setSending(true);
		const sent: string[] = [];
		const failed: Record<string, string> = {};

		for (const email of new Set(pending)) {
			if (!looksLikeEmail(email)) {
				failed[email] = `${email} is not an email address.`;
				continue;
			}

			try {
				const outcome = await share.mutateAsync({ email, role });
				sent.push(
					"member" in outcome
						? outcome.member.user.name || outcome.member.user.email
						: `an invitation to ${email}`,
				);
			} catch (error) {
				if (isConflict(error)) {
					failed[email] = /invited/i.test(String((error as Error).message))
						? `${email} has already been invited.`
						: `${email} already has access.`;
				} else if (isInvalid(error)) {
					failed[email] =
						(error instanceof RpcFailure && error.violations?.email?.[0]) ||
						(error as Error).message;
				} else {
					failed[email] = error instanceof Error ? error.message : "Something went wrong";
				}
			}
		}

		setEmails(Object.keys(failed));
		setProblems(failed);
		setSending(false);

		if (sent.length > 0) {
			notify.success({
				title: sent.length === 1 ? "Shared" : `Shared with ${sent.length} people`,
				description: `${schemaName} is now with ${sent.join(", ")}.`,
			});
		}
	};

	const setMemberRole = async (member: Member, next: ShareRole) => {
		if (next === member.role) return;

		try {
			await changeRole.mutateAsync({ userId: member.user.id, role: next });
		} catch (error) {
			notify.error({
				title: "Could not change the role",
				description: error instanceof Error ? error.message : "Something went wrong",
			});
		}
	};

	const remove = async (member: Member) => {
		try {
			await revoke.mutateAsync({ schemaId, userId: member.user.id });
		} catch (error) {
			notify.error({
				title: "Could not remove access",
				description: error instanceof Error ? error.message : "Something went wrong",
			});
		}
	};

	const withdraw = async (invitation: Invitation) => {
		try {
			await cancel.mutateAsync(invitation.id);
		} catch (error) {
			notify.error({
				title: "Could not cancel the invitation",
				description: error instanceof Error ? error.message : "Something went wrong",
			});
		}
	};

	const members = people.data?.members ?? [];
	const invitations = people.data?.invitations ?? [];
	const complaints = Object.values(problems);
	const nothingToSend = emails.length === 0 && draft.trim() === "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="gap-5">
				<DialogHeader>
					<DialogTitle>Share &ldquo;{schemaName}&rdquo;</DialogTitle>
					<DialogDescription>Invite people to view or edit this schema.</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(event) => {
						event.preventDefault();
						void send();
					}}
					className="flex flex-col gap-2"
				>
					<Field data-invalid={complaints.length > 0 ? true : undefined}>
						<div className="flex items-start gap-2">
							<Recipients
								emails={emails}
								onEmailsChange={changeEmails}
								draft={draft}
								onDraftChange={changeDraft}
								problems={problems}
								disabled={sending}
								onSend={() => void send()}
							/>
							<RoleSelect
								id="share-role"
								label="Role for the people added"
								value={role}
								onChange={setRole}
								disabled={sending}
							/>
						</div>
						{complaints.map((complaint) => (
							<FieldError key={complaint}>{complaint}</FieldError>
						))}
					</Field>
				</form>

				<section className="flex flex-col gap-1">
					<h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						People with access
					</h3>
					{me && (
						<ul className="flex max-h-64 flex-col overflow-y-auto">
							<Person who={me}>
								<span className="shrink-0 pr-1 text-xs text-muted-foreground">Owner</span>
							</Person>

							{people.isPending && <PeopleSkeleton />}
							{people.isError && (
								<li className="py-2 text-sm text-destructive">
									Could not read who has access. {people.error.message}
								</li>
							)}

							{members.map((member) => {
								const busy =
									(changeRole.isPending && changeRole.variables?.userId === member.user.id) ||
									(revoke.isPending && revoke.variables?.userId === member.user.id);

								return (
									<Person key={member.user.id} who={member.user}>
										<RoleSelect
											label={`Role for ${member.user.name || member.user.email}`}
											value={member.role}
											onChange={(next) => void setMemberRole(member, next)}
											disabled={busy}
										/>
										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={`Remove ${member.user.name || member.user.email}`}
														disabled={busy}
														onClick={() => void remove(member)}
													/>
												}
											>
												<XIcon />
											</TooltipTrigger>
											<TooltipContent>Remove access</TooltipContent>
										</Tooltip>
									</Person>
								);
							})}
						</ul>
					)}
					{!me && <PeopleSkeleton />}
				</section>

				{invitations.length > 0 && (
					<section className="flex flex-col gap-1">
						<h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
							Pending
						</h3>
						<ul className="flex max-h-40 flex-col overflow-y-auto">
							{invitations.map((invitation) => {
								const busy = cancel.isPending && cancel.variables === invitation.id;

								return (
									<li key={invitation.id} className="flex h-12 items-center gap-3">
										<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
											<MailIcon className="size-4" />
										</span>
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm font-medium">{invitation.email}</span>
											<span className="truncate text-xs text-muted-foreground">
												{SHARE_ROLE_LABELS[invitation.role]} · {timeLeft(invitation)}
											</span>
										</span>
										<Button
											variant="ghost"
											size="sm"
											aria-label={`Cancel the invitation to ${invitation.email}`}
											disabled={busy}
											onClick={() => void withdraw(invitation)}
										>
											Cancel
										</Button>
									</li>
								);
							})}
						</ul>
					</section>
				)}

				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
					<Button
						type="button"
						disabled={nothingToSend || sending}
						aria-busy={sending}
						onClick={() => void send()}
					>
						Invite
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
