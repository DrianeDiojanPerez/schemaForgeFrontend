import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Everything the browser bundle reads from its environment. Vite bakes these
 * in at build time, so they are public and only `VITE_` names get through.
 */
export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
