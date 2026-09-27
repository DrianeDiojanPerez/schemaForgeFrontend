import { readdirSync } from "node:fs"
import { join } from "node:path"
import {
  Metadata,
  credentials,
  loadPackageDefinition,
  status as grpcStatus,
} from "@grpc/grpc-js"
import type {
  CallOptions,
  Client,
  ClientUnaryCall,
  ServiceError,
  requestCallback,
} from "@grpc/grpc-js"
import { loadSync } from "@grpc/proto-loader"

import type { RpcError } from "@/features/schema/types/schema"
import { env } from "../env"
import type { ProtoGrpcType as AuthProto } from "./generated/auth"
import type { ProtoGrpcType as HealthProto } from "./generated/health"
import type { ProtoGrpcType as SchemaProto } from "./generated/schema"
import type { AuthServiceClient } from "./generated/schemaforge/v1/AuthService"
import type { HealthServiceClient } from "./generated/schemaforge/v1/HealthService"
import type { SchemaServiceClient } from "./generated/schemaforge/v1/SchemaService"
import { PROTO_OPTIONS } from "./proto-options"

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

function address(): string {
  return env.SCHEMAFORGE_GRPC_ADDRESS
}

/**
 * The generated types for the three proto files, joined: the loader reads all
 * of them into one package, and this is what that package looks like.
 */
type Proto = SchemaProto & HealthProto & AuthProto

/**
 * A unary call as the generated clients declare it. Each method has several
 * overloads, and the last one, request and callback alone, is the one a
 * conditional type sees, so that is the shape matched here.
 */
type Unary<
  TClient extends Client,
  TMethod extends keyof TClient,
> = TClient[TMethod] extends (
  argument: infer TRequest,
  callback: requestCallback<infer TResponse>
) => ClientUnaryCall
  ? [TRequest, TResponse]
  : never

/** The names of a client's unary methods, as the proto spells them. */
export type MethodOf<TClient extends Client> = {
  [K in keyof TClient & string]: TClient[K] extends (
    argument: never,
    callback: never
  ) => ClientUnaryCall
    ? K
    : never
}[keyof TClient & string]

export type RequestOf<
  TClient extends Client,
  TMethod extends keyof TClient,
> = Unary<TClient, TMethod>[0]

export type ResponseOf<
  TClient extends Client,
  TMethod extends keyof TClient,
> = Unary<TClient, TMethod>[1]

// Left to itself the channel backs off further after every failed dial, up
// to two minutes, and a backend that has just come back would be reported
// down until that ran out. The health check asks every three seconds.
const CHANNEL_OPTIONS = {
  "grpc.initial_reconnect_backoff_ms": 1000,
  "grpc.max_reconnect_backoff_ms": 3000,
}

type Clients = {
  schema: SchemaServiceClient
  health: HealthServiceClient
  auth: AuthServiceClient
}

let cached: Clients | undefined

/**
 * One client per service for the process, built from every proto file in the
 * directory. A gRPC channel multiplexes concurrent calls over a single HTTP/2
 * connection, so building a client per request would throw away the pooling
 * that makes the extra hop cheap.
 */
function clients(): Clients {
  if (cached) return cached

  const dir = env.SCHEMAFORGE_PROTO_DIR
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".proto"))
    .map((file) => join(dir, file))
  const proto = loadPackageDefinition(
    loadSync(files, PROTO_OPTIONS)
  ) as unknown as Proto
  const insecure = credentials.createInsecure()

  cached = {
    schema: new proto.schemaforge.v1.SchemaService(
      address(),
      insecure,
      CHANNEL_OPTIONS
    ),
    health: new proto.schemaforge.v1.HealthService(
      address(),
      insecure,
      CHANNEL_OPTIONS
    ),
    auth: new proto.schemaforge.v1.AuthService(
      address(),
      insecure,
      CHANNEL_OPTIONS
    ),
  }

  return cached
}

/**
 * A channel that has lost the backend sits out its backoff before it dials
 * again, and every call made meanwhile fails without trying. Throwing the
 * clients away means the next call, which may be the check that asks whether
 * the backend is back, dials straight away.
 */
function dropClients() {
  if (!cached) return

  for (const client of Object.values(cached)) client.close()

  cached = undefined
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
    message: plainMessage(error),
    violations,
  }
}

// What reaches the toast. The transport's own wording, "No connection
// established. Last error: connect ECONNREFUSED", is for the person running
// the server, not the one drawing.
function plainMessage(error: ServiceError): string {
  switch (error.code) {
    case grpcStatus.UNAVAILABLE:
      return `Nothing is answering at ${address()}. Is the backend running?`
    case grpcStatus.DEADLINE_EXCEEDED:
      return `The backend took longer than ${env.SCHEMAFORGE_RPC_TIMEOUT_MS / 1000}s to answer.`
    case grpcStatus.UNAUTHENTICATED:
      return "The backend refused the sign-in. Check SCHEMAFORGE_EMAIL and SCHEMAFORGE_PASSWORD."
    case grpcStatus.PERMISSION_DENIED:
      return "The account the server signs in with is not allowed to do this."
    default:
      return error.details || error.message
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
  return { email: env.SCHEMAFORGE_EMAIL, password: env.SCHEMAFORGE_PASSWORD }
}

async function obtain(): Promise<Tokens> {
  const current = tokens

  if (current) {
    try {
      return await invoke(clients().auth, "RefreshToken", {
        refreshToken: current.refreshToken,
      })
    } catch {
      // A refresh token the backend has stopped honouring is not a failure
      // worth surfacing while the credentials are still good.
    }
  }

  return invoke(clients().auth, "Login", loginRequest())
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

export async function callSchema<TMethod extends MethodOf<SchemaServiceClient>>(
  method: TMethod,
  request: RequestOf<SchemaServiceClient, TMethod>,
  requestId?: string
): Promise<ResponseOf<SchemaServiceClient, TMethod>> {
  try {
    return await invoke(
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

    return invoke(
      clients().schema,
      method,
      request,
      requestId,
      `Bearer ${renewed.token}`
    )
  }
}

export async function callHealth<TMethod extends MethodOf<HealthServiceClient>>(
  method: TMethod,
  request: RequestOf<HealthServiceClient, TMethod>
): Promise<ResponseOf<HealthServiceClient, TMethod>> {
  return invoke(clients().health, method, request)
}

function invoke<TClient extends Client, TMethod extends MethodOf<TClient>>(
  client: TClient,
  method: TMethod,
  request: RequestOf<TClient, TMethod>,
  requestId?: string,
  authorization?: string
): Promise<ResponseOf<TClient, TMethod>> {
  const metadata = new Metadata()

  // Passing the id through means one line in the backend's log and one in this
  // process's can be tied to the same user action.
  if (requestId) metadata.set("x-request-id", requestId)
  if (authorization) metadata.set("authorization", authorization)

  // The overload with everything: the generated types declare it, and the
  // conditional types above only ever looked at the shortest one.
  const call = client[method] as unknown as (
    argument: RequestOf<TClient, TMethod>,
    metadata: Metadata,
    options: CallOptions,
    callback: requestCallback<ResponseOf<TClient, TMethod>>
  ) => ClientUnaryCall

  return new Promise((settle, reject) => {
    // Without a deadline a backend that accepts the connection and then
    // hangs would hold the page request open for as long as it liked.
    const options = { deadline: Date.now() + env.SCHEMAFORGE_RPC_TIMEOUT_MS }

    call.call(client, request, metadata, options, (error, response) => {
      if (error) {
        if (error.code === grpcStatus.UNAVAILABLE) dropClients()
        reject(new SchemaForgeRpcError(toRpcError(error)))
        return
      }

      if (response === undefined) {
        reject(new Error(`the backend answered ${method} with nothing`))
        return
      }

      settle(response)
    })
  })
}
