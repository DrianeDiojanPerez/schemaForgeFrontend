import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, relative, resolve } from "node:path"
import { expect, test } from "vitest"

import { GENERATED_DIR, generateTypes } from "./generate-types"

// The variable straight from the environment, or from the .env file the dev
// server reads, since vitest loads neither on its own.
function protoDir(): string | undefined {
  if (process.env.SCHEMAFORGE_PROTO_DIR)
    return process.env.SCHEMAFORGE_PROTO_DIR

  try {
    const line = readFileSync(resolve(".env"), "utf8").match(
      /^SCHEMAFORGE_PROTO_DIR="?([^"\n]+)"?$/m
    )

    return line?.[1]
  } catch {
    return undefined
  }
}

function contents(dir: string, root = dir): Map<string, string> {
  const out = new Map<string, string>()

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      for (const [key, value] of contents(path, root)) out.set(key, value)
    } else {
      out.set(relative(root, path), readFileSync(path, "utf8"))
    }
  }

  return out
}

const dir = protoDir()

test.skipIf(!dir)(
  "the committed types match what the proto files generate",
  () => {
    expect(
      existsSync(dir!),
      `SCHEMAFORGE_PROTO_DIR points at ${dir}, which does not exist`
    ).toBe(true)

    const fresh = mkdtempSync(join(tmpdir(), "proto-types-"))

    try {
      generateTypes(dir!, fresh)

      // A difference means the proto files changed and `npm run proto:types`
      // has not been run since.
      expect(contents(GENERATED_DIR)).toEqual(contents(fresh))
    } finally {
      rmSync(fresh, { recursive: true, force: true })
    }
  }
)
