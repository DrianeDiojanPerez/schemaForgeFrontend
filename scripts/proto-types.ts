// Writes the TypeScript types for the backend's proto files.
//
//   npm run proto:types
//
// Reads SCHEMAFORGE_PROTO_DIR from the environment or .env, and writes into
// src/server/rpc/generated. Run it again whenever the proto files change; the
// test in src/server/rpc/generated.test.ts fails while the output is stale.

import {
  GENERATED_DIR,
  generateTypes,
} from "../src/server/rpc/generate-types.ts"

const dir = process.env.SCHEMAFORGE_PROTO_DIR

if (!dir) {
  console.error("Set SCHEMAFORGE_PROTO_DIR to the directory of proto files.")
  process.exit(1)
}

generateTypes(dir, GENERATED_DIR)
console.log(`Wrote types for the proto files in ${dir} to ${GENERATED_DIR}`)
