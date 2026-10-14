// The production server. Vite builds the app into a fetch handler and a
// folder of static files; this is the Node process that puts them on a port.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

import handler from "./dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);
const app = new Hono();

// Built assets carry a hash in their name, so they can be cached for good.
app.use(
	"/assets/*",
	serveStatic({
		root: "./dist/client",
		onFound: (_path, c) => c.header("Cache-Control", "public, max-age=31536000, immutable"),
	}),
);
app.use("*", serveStatic({ root: "./dist/client" }));
app.all("*", (c) => handler.fetch(c.req.raw));

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
	console.log(`listening on http://${info.address}:${info.port}`);
});
