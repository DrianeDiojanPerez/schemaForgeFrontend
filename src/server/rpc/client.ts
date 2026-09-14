import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  Metadata,
  credentials,
  loadPackageDefinition,
  status as grpcStatus,
} from "@grpc/grpc-js"
import type { ServiceError } from "@grpc/grpc-js"
import { loadSync } from "@grpc/proto-loader"

import type { RpcError } from "@/features/schema/types/schema"

/**
 * The gRPC client the server functions call through.
 *
 * This runs in Node, never in the browser, which is the point of the
 * arrangement: Node speaks native gRPC over HTTP/2, so there is no gRPC-Web
 * bridge, no CORS, and no protobuf runtime in the client bundle.
 *
 * The `.proto` files are read at runtime from the backend's own directory, so
 * there is one copy of the contract and no codegen step to fall out of date.
 */

const HERE = dirname(fileURLToPath(import.meta.url))

const PROTO_OPTIONS = {
  // Field names arrive as `fromEntityId` rather than `from_entity_id`, which
  // is what the browser types expect.
  keepCase: false,
  // Enum names rather than magic numbers.
  enums: String,
  longs: Number,
  defaults: true,
  // Off: proto3 optional fields are synthetic oneofs, and the markers they add
  // (`_length` next to `length`) are noise. Outbound oneofs still encode.
  oneofs: false,
} as const

/**
 * The backend is a sibling checkout rather than a directory inside this one, so
 * there is nothing to walk down to. The env var wins over the guesses, which is
 * what a checkout under a different name needs.
 */
function protoRoot(): string {
  const candidates = [
    process.env.SCHEMAFORGE_PROTO_DIR,
    resolve(process.cwd(), "../schemaForgeBackend/proto"),
    resolve(process.cwd(), "../schemaforge/backend/proto"),
    resolve(HERE, "../../../../schemaForgeBackend/proto"),
  ].filter((candidate): candidate is string => Boolean(candidate))

  const found = candidates.find((candidate) =>
    existsSync(resolve(candidate, "schemaforge/v1/schema.proto"))
  )

  if (!found) {
    throw new Error(
      `Could not find the proto directory. Looked in:\n  ${candidates.join("\n  ")}\n` +
        "Set SCHEMAFORGE_PROTO_DIR to the backend/proto path."
    )
  }

  return found
}

function address(): string {
  return process.env.SCHEMAFORGE_GRPC_ADDRESS ?? "127.0.0.1:50051"
}

type RpcClient = {
  [method: string]: (
    request: unknown,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: unknown) => void
  ) => void
}

type Constructor = new (
  address: string,
  creds: ReturnType<typeof credentials.createInsecure>
) => RpcClient

let cached:
  { schema: RpcClient; health: RpcClient; auth: RpcClient } | undefined

function serviceFrom(root: string, file: string, name: string): Constructor {
  const definition = loadSync(file, { includeDirs: [root], ...PROTO_OPTIONS })
  const namespace = loadPackageDefinition(definition) as unknown as Record<
    string,
    Record<string, Record<string, unknown>>
  >

  return namespace.schemaforge.v1[name] as Constructor
}

/**
 * One client for the process. A gRPC channel multiplexes concurrent calls over
 * a single HTTP/2 connection, so building a client per request would throw away
 * the pooling that makes the extra hop cheap.
 */
function clients() {
  if (cached) return cached

  const root = protoRoot()
  const SchemaService = serviceFrom(
    root,
    "schemaforge/v1/schema.proto",
    "SchemaService"
  )
  const HealthService = serviceFrom(
    root,
    "schemaforge/v1/health.proto",
    "HealthService"
  )
  const AuthService = serviceFrom(
    root,
    "schemaforge/v1/auth.proto",
    "AuthService"
  )

  cached = {
    schema: new SchemaService(address(), credentials.createInsecure()),
    health: new HealthService(address(), credentials.createInsecure()),
    auth: new AuthService(address(), credentials.createInsecure()),
  }

  return cached
}

/**
 * Turns a gRPC failure into the shape the browser gets. The backend's stable
 * application code and its field violations ride in trailing metadata, so this
 * is where they are unpacked; without it the browser would see only a coarse
 * status and a string.
 */
function toRpcError(error: ServiceError): RpcError {
  // `at` rather than `[0]`, because a backend that never set the header leaves
  // the lookup empty and only `at` admits that in its type.
  const appCodeHeader = error.metadata.get("x-app-code").at(0)
  const violationsHeader = error.metadata.get("x-validation-violations").at(0)

  let violations: Record<string, string[]> | undefined

  if (typeof violationsHeader === "string") {
    try {
      violations = JSON.parse(violationsHeader) as Record<string, string[]>
    } catch {
      // A violations header we cannot parse is not worth failing the whole
      // response over; the message still says what went wrong.
      violations = undefined
    }
  }

  return {
    appCode: Number(appCodeHeader ?? 0),
    // The code is a number on the wire; the name is what a caller can read.
    status: grpcStatus[error.code],
    message: error.details || error.message,
    violations,
  }
}

/** Thrown by the server functions so a failed call rejects rather than resolving with junk. */
export class SchemaForgeRpcError extends Error {
  readonly rpc: RpcError

  constructor(rpc: RpcError) {
    super(rpc.message)
    this.name = "SchemaForgeRpcError"
    this.rpc = rpc
  }
}

/**
 * Credentials, tokens and renewal.
 *
 * Every `SchemaService` call needs a bearer token and a permission behind it.
 * The token lives here rather than in the browser: this process is the only
 * one that speaks gRPC, so a token that never leaves it cannot be read out of a
 * page or replayed from a client bundle.
 */

type Tokens = { token: string; refreshToken: string }

let tokens: Tokens | undefined
let renewal: Promise<Tokens> | undefined

function loginRequest(): { email: string; password: string } {
  const email = process.env.SCHEMAFORGE_EMAIL
  const password = process.env.SCHEMAFORGE_PASSWORD

  if (!email || !password) {
    throw new Error(
      "Set SCHEMAFORGE_EMAIL and SCHEMAFORGE_PASSWORD so the server can sign in to the backend."
    )
  }

  return { email, password }
}

async function obtain(): Promise<Tokens> {
  const current = tokens

  if (current) {
    try {
      return await invoke<{ refreshToken: string }, Tokens>(
        clients().auth,
        "RefreshToken",
        { refreshToken: current.refreshToken }
      )
    } catch {
      // A refresh token the backend has stopped honouring is not a failure
      // worth surfacing while the credentials are still good.
    }
  }

  return invoke<{ email: string; password: string }, Tokens>(
    clients().auth,
    "Login",
    loginRequest()
  )
}

/**
 * Concurrent callers share one renewal. Without that, the first render after a
 * restart would log in once per loader running in parallel.
 */
function renew(): Promise<Tokens> {
  renewal ??= obtain()
    .then((next) => {
      tokens = next
      return next
    })
    .finally(() => {
      renewal = undefined
    })

  return renewal
}

async function bearer(): Promise<string> {
  const current = tokens ?? (await renew())

  return `Bearer ${current.token}`
}

/**
 * True when the backend understands the call but has not built it yet. M2 and
 * M3 answer this way, and it says nothing about the schema that was sent.
 */
export function isUnimplemented(error: unknown): boolean {
  return (
    error instanceof SchemaForgeRpcError &&
    error.rpc.status === grpcStatus[grpcStatus.UNIMPLEMENTED]
  )
}

function isExpired(error: unknown): boolean {
  return (
    error instanceof SchemaForgeRpcError &&
    error.rpc.status === grpcStatus[grpcStatus.UNAUTHENTICATED]
  )
}

export async function callSchema<TRequest, TResponse>(
  method: string,
  request: TRequest,
  requestId?: string
): Promise<TResponse> {
  try {
    return await invoke<TRequest, TResponse>(
      clients().schema,
      method,
      request,
      requestId,
      await bearer()
    )
  } catch (error) {
    if (!isExpired(error)) throw error

    // An access token has a lifetime, and it runs out mid-session rather than
    // between sessions. Renewing and retrying once turns that into a slower
    // call instead of an error the user has to do something about.
    const renewed = await renew()

    return invoke<TRequest, TResponse>(
      clients().schema,
      method,
      request,
      requestId,
      `Bearer ${renewed.token}`
    )
  }
}

export async function callHealth<TRequest, TResponse>(
  method: string,
  request: TRequest
): Promise<TResponse> {
  return invoke<TRequest, TResponse>(clients().health, method, request)
}

function invoke<TRequest, TResponse>(
  client: RpcClient,
  method: string,
  request: TRequest,
  requestId?: string,
  authorization?: string
): Promise<TResponse> {
  const metadata = new Metadata()

  // Passing the id through means one line in the backend's log and one in this
  // process's can be tied to the same user action.
  if (requestId) metadata.set("x-request-id", requestId)
  if (authorization) metadata.set("authorization", authorization)

  return new Promise((settle, reject) => {
    const call = client[method]

    if (typeof call !== "function") {
      reject(new Error(`the contract has no method named ${method}`))
      return
    }

    call.call(client, request, metadata, (error, response) => {
      if (error) {
        reject(new SchemaForgeRpcError(toRpcError(error)))
        return
      }

      settle(response as TResponse)
    })
  })
}
