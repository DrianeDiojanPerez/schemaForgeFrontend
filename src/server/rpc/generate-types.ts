import { execFileSync } from "node:child_process"
import { mkdirSync, readdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"

import { PROTO_OPTIONS } from "./proto-options.ts"

/** Where the types written from the proto files live. */
export const GENERATED_DIR = resolve(import.meta.dirname, "./generated")

const GENERATOR = resolve(
  import.meta.dirname,
  "../../../node_modules/.bin/proto-loader-gen-types"
)

/**
 * Writes TypeScript for every proto file in `dir` into `outDir`, using the
 * same options the runtime loader uses so the types describe exactly what it
 * hands back. Run from inside `dir`, so the header on each file names the
 * proto by its bare name rather than by a path from one machine.
 */
export function generateTypes(dir: string, outDir: string): void {
  const files = readdirSync(dir).filter((file) => file.endsWith(".proto"))

  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  execFileSync(
    GENERATOR,
    [
      `--longs=${PROTO_OPTIONS.longs.name}`,
      `--enums=${PROTO_OPTIONS.enums.name}`,
      "--defaults",
      `--oneofs=${PROTO_OPTIONS.oneofs}`,
      `--keepCase=${PROTO_OPTIONS.keepCase}`,
      "--grpcLib=@grpc/grpc-js",
      `--outDir=${outDir}`,
      ...files,
    ],
    { cwd: dir, stdio: "inherit" }
  )
}
