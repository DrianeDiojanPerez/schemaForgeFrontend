import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useAppForm } from "@/hooks/form";

import {
	columnDetailsSchema,
	columnDetailsValues,
	descriptionSchema,
	descriptionValues,
	toColumnPatch,
	toDetails,
} from "../lib/details-forms";
import type { Details } from "../lib/details-forms";
import { takesLength, takesPrecision } from "../lib/type-parameters";
import type { TableColumn } from "../types/erd";

export type DescriptionDialogProps = {
	title: string;
	subject: string;
	withName?: boolean;
	details: Details;
	onSave: (details: Details) => void;
	onClose: () => void;
};

export function DescriptionDialog({
	title,
	subject,
	withName = false,
	details,
	onSave,
	onClose,
}: DescriptionDialogProps) {
	const form = useAppForm({
		defaultValues: descriptionValues(details),
		validators: { onChange: descriptionSchema },
		onSubmit: ({ value }) => {
			onSave(toDetails(value, withName));
			onClose();
		},
	});

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
					className="grid gap-4"
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{subject}</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						{withName && (
							<form.AppField name="name">
								{(field) => <field.TextField label="Name" />}
							</form.AppField>
						)}
						<form.AppField name="description">
							{(field) => (
								<field.TextareaField
									label="Description"
									placeholder="What this means, not how it is typed"
								/>
							)}
						</form.AppField>
					</FieldGroup>

					<DialogFooter showCloseButton>
						<form.AppForm>
							<form.SubmitButton>Save</form.SubmitButton>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export type ColumnDetailsDialogProps = {
	tableName: string;
	column: TableColumn;
	onSave: (patch: Partial<TableColumn>) => void;
	onClose: () => void;
};

export function ColumnDetailsDialog({
	tableName,
	column,
	onSave,
	onClose,
}: ColumnDetailsDialogProps) {
	const form = useAppForm({
		defaultValues: columnDetailsValues(column),
		validators: { onChange: columnDetailsSchema },
		onSubmit: ({ value }) => {
			onSave(toColumnPatch(value, column.format));
			onClose();
		},
	});

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
					className="grid gap-4"
				>
					<DialogHeader>
						<DialogTitle>Column details</DialogTitle>
						<DialogDescription>
							{tableName}.{column.name} ({column.format})
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						{takesLength(column.format) && (
							<form.AppField name="length">
								{(field) => <field.NumberField label="Length" min={1} />}
							</form.AppField>
						)}
						{takesPrecision(column.format) && (
							<div className="grid grid-cols-2 gap-3">
								<form.AppField name="precision">
									{(field) => <field.NumberField label="Precision" min={1} />}
								</form.AppField>
								<form.AppField name="scale">
									{(field) => <field.NumberField label="Scale" min={0} />}
								</form.AppField>
							</div>
						)}
						<form.AppField name="defaultValue">
							{(field) => <field.TextField label="Default value" placeholder="now()" />}
						</form.AppField>
						<form.AppField name="description">
							{(field) => (
								<field.TextareaField label="Description" placeholder="What this column holds" />
							)}
						</form.AppField>
					</FieldGroup>

					<DialogFooter showCloseButton>
						<form.AppForm>
							<form.SubmitButton>Save</form.SubmitButton>
						</form.AppForm>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
