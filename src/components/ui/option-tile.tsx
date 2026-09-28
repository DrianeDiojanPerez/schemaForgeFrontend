import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * A label wrapped around a hidden radio, drawn as the choice it stands for.
 * The tile takes the checked state from the control inside it.
 */
const optionTileVariants = cva(
	"flex cursor-pointer items-center gap-2 text-sm leading-none font-medium transition select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
	{
		variants: {
			variant: {
				card: "flex-col items-stretch rounded-lg border border-border p-2 hover:bg-muted/50 has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary",
				row: "rounded-lg border border-border p-2.5 font-normal hover:bg-muted/50 has-data-checked:border-primary has-data-checked:ring-1 has-data-checked:ring-primary",
				cell: "h-8 justify-center rounded-sm text-muted-foreground/30 hover:bg-muted hover:text-muted-foreground/70 has-focus-visible:ring-2 has-focus-visible:ring-ring has-data-checked:bg-primary/10 has-data-checked:text-primary",
			},
		},
		defaultVariants: {
			variant: "card",
		},
	},
);

function OptionTile({
	className,
	variant = "card",
	...props
}: React.ComponentProps<"label"> & VariantProps<typeof optionTileVariants>) {
	return (
		<label
			data-slot="option-tile"
			data-variant={variant}
			className={cn(optionTileVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { OptionTile, optionTileVariants };
