import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		// Vite forwards the browser console to the terminal on its own, and the
		// devtools mirroring the terminal back into the browser turned any error
		// into a loop that ate half the main thread.
		devtools({ consolePiping: { enabled: false } }),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
