import { useState } from "react";
import { FileArchiveIcon } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/lib/toast";
import type { Dialect } from "@/features/schema/types/schema";

const TOOLS = [
	{
		id: "plain",
		label: "Plain SQL",
		file: (name: string) => `001_${name}.sql`,
	},
	{ id: "flyway", label: "Flyway", file: (name: string) => `V1__${name}.sql` },
	{
		id: "liquibase",
		label: "Liquibase",
		file: (name: string) => `changelog/${name}.xml`,
	},
	{
		id: "golang-migrate",
		label: "golang-migrate",
		file: (name: string) => `000001_${name}.up.sql`,
	},
] as const;

type Tool = (typeof TOOLS)[number]["id"];

const DIALECTS: { id: Dialect; label: string }[] = [
	{ id: "POSTGRES", label: "PostgreSQL" },
	{ id: "MYSQL", label: "MySQL" },
];

const CARD =
	"cursor-pointer rounded-lg border border-border p-2.5 text-sm font-normal transition hover:bg-muted/50 has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary";

function slug(name: string) {
	return name.trim().toLowerCase().replace(/\s+/g, "_") || "create_schema";
}

function SwitchRow({
	id,
	label,
	hint,
	checked,
	onCheckedChange,
}: {
	id: string;
	label: string;
	hint: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<Label htmlFor={id} className="cursor-pointer items-center justify-between">
			<span className="flex flex-col gap-0.5">
				{label}
				<span className="text-xs font-normal text-muted-foreground">{hint}</span>
			</span>
			<Switch id={id} aria-label={label} checked={checked} onCheckedChange={onCheckedChange} />
		</Label>
	);
}

export type MigrationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function MigrationDialog({ open, onOpenChange }: MigrationDialogProps) {
	const [tool, setTool] = useState<Tool>("flyway");
	const [dialect, setDialect] = useState<Dialect>("POSTGRES");
	const [name, setName] = useState("create_schema");
	const [down, setDown] = useState(true);
	const [perTable, setPerTable] = useState(false);

	const first = TOOLS.find((item) => item.id === tool)!.file(slug(name));

	const pack = () => {
		onOpenChange(false);
		notify.info({
			title: "Not built yet",
			description: "The migration zip is not wired up yet.",
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Export migration</DialogTitle>
					<DialogDescription>
						The schema written out as migration files, zipped for the tool that runs them.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-5">
					<div className="grid gap-2">
						<Label>Tool</Label>
						<RadioGroup
							aria-label="Tool"
							value={tool}
							onValueChange={(next) => setTool(next as Tool)}
							className="grid-cols-2"
						>
							{TOOLS.map((item) => (
								<Label key={item.id} htmlFor={`migration-tool-${item.id}`} className={CARD}>
									<RadioGroupItem id={`migration-tool-${item.id}`} value={item.id} />
									{item.label}
								</Label>
							))}
						</RadioGroup>
					</div>

					<div className="grid gap-2">
						<Label>Dialect</Label>
						<RadioGroup
							aria-label="Dialect"
							value={dialect}
							onValueChange={(next) => setDialect(next as Dialect)}
							className="grid-cols-2"
						>
							{DIALECTS.map((item) => (
								<Label key={item.id} htmlFor={`migration-dialect-${item.id}`} className={CARD}>
									<RadioGroupItem id={`migration-dialect-${item.id}`} value={item.id} />
									{item.label}
								</Label>
							))}
						</RadioGroup>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="migration-name">Name</Label>
						<Input
							id="migration-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="create_schema"
						/>
						<p className="font-mono text-2xs text-muted-foreground">{first}</p>
					</div>

					<div className="grid gap-4">
						<SwitchRow
							id="migration-down"
							label="Rollback file"
							hint="A matching file that undoes the migration"
							checked={down}
							onCheckedChange={setDown}
						/>
						<SwitchRow
							id="migration-per-table"
							label="One file per table"
							hint="Off puts the whole schema in a single file"
							checked={perTable}
							onCheckedChange={setPerTable}
						/>
					</div>
				</div>

				<DialogFooter>
					<DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
					<Button onClick={pack}>
						<FileArchiveIcon />
						Export zip
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
