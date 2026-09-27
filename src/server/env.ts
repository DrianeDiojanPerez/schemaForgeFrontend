import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

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
    SCHEMAFORGE_EMAIL: z.email(),
    SCHEMAFORGE_PASSWORD: z.string().min(1),
    SCHEMAFORGE_PROTO_DIR: z.string().min(1).optional(),
    SCHEMAFORGE_RPC_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15000),
  },
  runtimeEnv: process.env,
  // A line left as `NAME=` in a .env file means not set, not the empty string.
  emptyStringAsUndefined: true,
})
