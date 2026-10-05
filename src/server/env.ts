import { readdirSync } from "node:fs";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/** Whether the path is a directory holding `.proto` files and nothing else. */
function protoDirectory(dir: string): boolean {
	try {
		const files = readdirSync(dir);

		return files.length > 0 && files.every((file) => file.endsWith(".proto"));
	} catch {
		return false;
	}
}

/**
 * Everything the server reads from its environment, checked once when the
 * first server module loads. A bad `.env` fails here with every problem
 * named, not on the first request that happened to need the value.
 */
export const env = createEnv({
	server: {
		SCHEMAFORGE_GRPC_ADDRESS: z
			.string()
			.regex(/^[^\s:]+:\d{1,5}$/, "expected host:port")
			.default("127.0.0.1:50051"),
		SCHEMAFORGE_SESSION_SECRET: z.string().min(32),
		SCHEMAFORGE_PROTO_DIR: z
			.string()
			.min(1)
			.refine(protoDirectory, "must be a directory of .proto files"),
		SCHEMAFORGE_RPC_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
	},
	runtimeEnv: process.env,
	// A line left as `NAME=` in a .env file means not set, not the empty string.
	emptyStringAsUndefined: true,
});
