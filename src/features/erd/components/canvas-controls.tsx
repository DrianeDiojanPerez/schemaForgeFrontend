import { memo } from "react";
import { useReactFlow, useStore, useStoreApi } from "@xyflow/react";
import { LockIcon, LockOpenIcon, MaximizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ZOOM_DURATION = 200;
const FIT_DURATION = 300;

function Control({
	label,
	icon: Icon,
	disabled,
	onClick,
}: {
	label: string;
	icon: LucideIcon;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="bar"
						size="icon-sm"
						aria-label={label}
						disabled={disabled}
						onClick={onClick}
					/>
				}
			>
				<Icon />
			</TooltipTrigger>
			<TooltipContent side="right">{label}</TooltipContent>
		</Tooltip>
	);
}

export const CanvasControls = memo(function CanvasControls() {
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const store = useStoreApi();
	const zoom = useStore((state) => state.transform[2]);
	const minZoom = useStore((state) => state.minZoom);
	const maxZoom = useStore((state) => state.maxZoom);
	// React Flow has no single locked flag. The three permissions always move
	// together here, so any one of them answers for the group.
	const locked = useStore((state) => !state.nodesDraggable);

	const toggleLock = () => {
		store.setState({
			nodesDraggable: locked,
			nodesConnectable: locked,
			elementsSelectable: locked,
		});
	};

	return (
		<div className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card shadow-sm">
			<TooltipProvider delay={200}>
				<Control
					label="Zoom in"
					icon={PlusIcon}
					disabled={zoom >= maxZoom}
					onClick={() => void zoomIn({ duration: ZOOM_DURATION })}
				/>
				<Control
					label="Zoom out"
					icon={MinusIcon}
					disabled={zoom <= minZoom}
					onClick={() => void zoomOut({ duration: ZOOM_DURATION })}
				/>
				<Control
					label="Fit to screen"
					icon={MaximizeIcon}
					onClick={() => void fitView({ duration: FIT_DURATION })}
				/>
				<Control
					label={locked ? "Unlock canvas" : "Lock canvas"}
					icon={locked ? LockIcon : LockOpenIcon}
					onClick={toggleLock}
				/>
			</TooltipProvider>
		</div>
	);
});
