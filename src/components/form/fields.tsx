import type { ComponentProps } from "react";
import { useStore } from "@tanstack/react-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFieldContext } from "@/hooks/form-context";

type Issue = { message?: string };

function useIssues(): Issue[] {
	const field = useFieldContext<string>();

	return useStore(field.store, (state) =>
		state.meta.isTouched ? (state.meta.errors as Issue[]) : [],
	);
}

export function TextField({
	label,
	...props
}: { label: string } & Omit<
	ComponentProps<typeof Input>,
	"id" | "name" | "value" | "onBlur" | "onChange"
>) {
	const field = useFieldContext<string>();
	const issues = useIssues();

	return (
		<Field data-invalid={issues.length > 0 || undefined}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<Input
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={issues.length > 0 || undefined}
				{...props}
			/>
			<FieldError errors={issues} />
		</Field>
	);
}

/** A whole number the schema checks as text, so the box can be left empty. */
export function NumberField(props: Omit<ComponentProps<typeof TextField>, "type" | "inputMode">) {
	return <TextField type="number" inputMode="numeric" step={1} {...props} />;
}

export function TextareaField({
	label,
	...props
}: { label: string } & Omit<
	ComponentProps<typeof Textarea>,
	"id" | "name" | "value" | "onBlur" | "onChange"
>) {
	const field = useFieldContext<string>();
	const issues = useIssues();

	return (
		<Field data-invalid={issues.length > 0 || undefined}>
			<FieldLabel htmlFor={field.name}>{label}</FieldLabel>
			<Textarea
				id={field.name}
				name={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
				aria-invalid={issues.length > 0 || undefined}
				{...props}
			/>
			<FieldError errors={issues} />
		</Field>
	);
}
