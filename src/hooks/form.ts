import { createFormHook } from "@tanstack/react-form";

import { NumberField, TextField, TextareaField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";

import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: { TextField, TextareaField, NumberField },
	formComponents: { SubmitButton },
});
