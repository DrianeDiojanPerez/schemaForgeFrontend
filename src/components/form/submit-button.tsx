import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useFormContext } from "@/hooks/form-context";

export function SubmitButton(props: Omit<ComponentProps<typeof Button>, "type" | "disabled">) {
	const form = useFormContext();

	return (
		<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
			{([canSubmit, isSubmitting]) => (
				<Button type="submit" disabled={!canSubmit || isSubmitting} {...props} />
			)}
		</form.Subscribe>
	);
}
