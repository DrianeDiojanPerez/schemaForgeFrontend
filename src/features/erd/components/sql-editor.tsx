import { useEffect, useMemo, useRef, useState } from "react";
import { catppuccinLatte, catppuccinMocha } from "@catppuccin/codemirror";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { getCM, vim } from "@replit/codemirror-vim";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";

import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type SqlEditorProps = {
	value: string;
	onChange: (value: string) => void;
	vim: boolean;
	className?: string;
};

type VimMode = "normal" | "insert" | "visual" | "replace";

const MODES: Record<VimMode, string> = {
	normal: "bg-primary/15 text-primary",
	insert: "bg-info/15 text-info",
	visual: "bg-warning/15 text-warning",
	replace: "bg-destructive/15 text-destructive",
};

const isVimMode = (mode: string): mode is VimMode => mode in MODES;

export function SqlEditor({ value, onChange, vim: vimOn, className }: SqlEditorProps) {
	const theme = useTheme();
	const editor = useRef<ReactCodeMirrorRef>(null);
	const [mode, setMode] = useState<VimMode>("normal");

	const extensions = useMemo(
		() => (vimOn ? [vim(), sql({ dialect: PostgreSQL })] : [sql({ dialect: PostgreSQL })]),
		[vimOn],
	);

	useEffect(() => {
		if (!vimOn) return;

		const view = editor.current?.view;
		if (!view) return;

		const cm = getCM(view);
		if (!cm) return;

		const handler = (event: { mode: string }) => {
			if (isVimMode(event.mode)) setMode(event.mode);
		};

		cm.on("vim-mode-change", handler);
		return () => cm.off("vim-mode-change", handler);
	}, [vimOn]);

	return (
		<div className={cn("relative overflow-hidden rounded-md border border-border", className)}>
			<CodeMirror
				ref={editor}
				value={value}
				onChange={onChange}
				height="100%"
				theme={theme === "dark" ? catppuccinMocha : catppuccinLatte}
				extensions={extensions}
				basicSetup={{
					lineNumbers: true,
					foldGutter: true,
					// The active line's wash sits on top of vim's visual selection
					// and hides where it starts and ends.
					highlightActiveLine: !vimOn,
					highlightActiveLineGutter: !vimOn,
				}}
				className="h-full text-sm"
			/>
			{vimOn && (
				<span
					className={cn(
						"pointer-events-none absolute top-2 right-2 rounded px-1.5 py-0.5 font-mono text-2xs font-semibold tracking-wider uppercase",
						MODES[mode],
					)}
				>
					{mode}
				</span>
			)}
		</div>
	);
}
