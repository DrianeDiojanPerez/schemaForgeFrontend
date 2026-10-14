import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { ErdTableNode, TableColumn } from "../types/erd";

export type Described = {
	description?: string;
	columns: Record<string, string>;
};

export type DescribeDialogProps = {
	table: ErdTableNode;
	/** The columns the finding named. Empty means every one still without a description. */
	columnIds: string[];
	onSave: (described: Described) => void;
	onClose: () => void;
};

// One form for everything a "missing descriptions" finding lists, so the
// whole finding clears in one go rather than a dialog per name.
export function DescribeDialog({ table, columnIds, onSave, onClose }: DescribeDialogProps) {
	const named = new Set(columnIds);
	const columns = table.data.columns.filter((column) =>
		named.size > 0 ? named.has(column.id) : !column.description?.trim(),
	);
	const wantsTable = !table.data.description?.trim();

	const [description, setDescription] = useState(table.data.description ?? "");
	const [texts, setTexts] = useState<Record<string, string>>(() =>
		Object.fromEntries(columns.map((column) => [column.id, column.description ?? ""])),
	);

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		onSave({ description: wantsTable ? description.trim() : undefined, columns: texts });
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<form onSubmit={submit} className="grid gap-4">
					<DialogHeader>
						<DialogTitle>Describe {table.data.name}</DialogTitle>
						<DialogDescription>
							What each one means. Empty ones are left as they are.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						{wantsTable && (
							<Field>
								<FieldLabel htmlFor="describe-table">Table</FieldLabel>
								<Textarea
									id="describe-table"
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									placeholder="What this means, not how it is typed"
									autoFocus
								/>
							</Field>
						)}
						{columns.map((column) => (
							<ColumnField
								key={column.id}
								column={column}
								value={texts[column.id] ?? ""}
								onChange={(next) => setTexts((prev) => ({ ...prev, [column.id]: next }))}
							/>
						))}
					</FieldGroup>

					<DialogFooter showCloseButton>
						<Button type="submit">Save</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function ColumnField({
	column,
	value,
	onChange,
}: {
	column: TableColumn;
	value: string;
	onChange: (value: string) => void;
}) {
	const id = `describe-${column.id}`;

	return (
		<Field>
			<FieldLabel htmlFor={id}>
				<code className="font-mono text-xs">{column.name}</code>
			</FieldLabel>
			<Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
		</Field>
	);
}
