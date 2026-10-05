import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Metadata, credentials, loadPackageDefinition, status as grpcStatus } from "@grpc/grpc-js";
import type { CallOptions, ClientUnaryCall, ServiceError, requestCallback } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

import type { RpcError } from "@/features/schema/types/schema";
import { env } from "../env";
import type { ProtoGrpcType as AuthProto } from "./generated/auth";
import type { ProtoGrpcType as HealthProto } from "./generated/health";
import type { ProtoGrpcType as SchemaProto } from "./generated/schema";
import { redirect } from "@tanstack/react-router";

import { session } from "../auth/session";
import type { Tokens } from "../auth/session";
import type { AuthServiceClient } from "./generated/schemaforge/v1/AuthService";
import type { CheckResponse__Output } from "./generated/schemaforge/v1/CheckResponse";
import type { CreateSchemaRequest } from "./generated/schemaforge/v1/CreateSchemaRequest";
import type { CreateSchemaResponse__Output } from "./generated/schemaforge/v1/CreateSchemaResponse";
import type { DeleteSchemaRequest } from "./generated/schemaforge/v1/DeleteSchemaRequest";
import type { DeleteSchemaResponse__Output } from "./generated/schemaforge/v1/DeleteSchemaResponse";
import type { GenerateDdlRequest } from "./generated/schemaforge/v1/GenerateDdlRequest";
import type { GenerateDdlResponse__Output } from "./generated/schemaforge/v1/GenerateDdlResponse";
import type { GetSchemaRequest } from "./generated/schemaforge/v1/GetSchemaRequest";
import type { GetCurrentUserResponse__Output } from "./generated/schemaforge/v1/GetCurrentUserResponse";
import type { GetSchemaResponse__Output } from "./generated/schemaforge/v1/GetSchemaResponse";
import type { GoogleLoginUrlRequest } from "./generated/schemaforge/v1/GoogleLoginUrlRequest";
import type { GoogleLoginUrlResponse__Output } from "./generated/schemaforge/v1/GoogleLoginUrlResponse";
import type { HealthServiceClient } from "./generated/schemaforge/v1/HealthService";
import type { ListSchemasRequest } from "./generated/schemaforge/v1/ListSchemasRequest";
import type { ListSchemasResponse__Output } from "./generated/schemaforge/v1/ListSchemasResponse";
import type { LoginResponse__Output } from "./generated/schemaforge/v1/LoginResponse";
import type { LoginWithGoogleRequest } from "./generated/schemaforge/v1/LoginWithGoogleRequest";
import type { RefreshTokenRequest } from "./generated/schemaforge/v1/RefreshTokenRequest";
import type { RefreshTokenResponse__Output } from "./generated/schemaforge/v1/RefreshTokenResponse";
import type { SchemaServiceClient } from "./generated/schemaforge/v1/SchemaService";
import type { UpdateSchemaRequest } from "./generated/schemaforge/v1/UpdateSchemaRequest";
import type { UpdateSchemaResponse__Output } from "./generated/schemaforge/v1/UpdateSchemaResponse";
import type { ValidateSchemaRequest } from "./generated/schemaforge/v1/ValidateSchemaRequest";
import type { ValidateSchemaResponse__Output } from "./generated/schemaforge/v1/ValidateSchemaResponse";
import { PROTO_OPTIONS } from "./proto-options";

/**
 * The gRPC client the server functions call through.
 *
 * This runs in Node, never in the browser, which is the point of the
 * arrangement: Node speaks native gRPC over HTTP/2, so there is no gRPC-Web
 * bridge, no CORS, and no protobuf runtime in the client bundle.
 *
 * The `.proto` files are read at runtime from the backend's own directory, and
 * the types under `generated/` are written from the same files, so a call that
 * compiles is one the backend declares.
 */

function address(): string {
	return env.SCHEMAFORGE_GRPC_ADDRESS;
}

/**
 * The generated types for the three proto files, joined: the loader reads all
 * of them into one package, and this is what that package looks like.
 */
type Proto = SchemaProto & HealthProto & AuthProto;

// Left to itself the channel backs off further after every failed dial, up
// to two minutes, and a backend that has just come back would be reported
// down until that ran out. The health check asks every three seconds.
const CHANNEL_OPTIONS = {
	"grpc.initial_reconnect_backoff_ms": 1000,
	"grpc.max_reconnect_backoff_ms": 3000,
};

type Clients = {
	schema: SchemaServiceClient;
	health: HealthServiceClient;
	auth: AuthServiceClient;
};

let cached: Clients | undefined;

/**
 * One client per service for the process, built from every proto file in the
 * directory. A gRPC channel multiplexes concurrent calls over a single HTTP/2
 * connection, so building a client per request would throw away the pooling
 * that makes the extra hop cheap.
 */
function clients(): Clients {
	if (cached) return cached;

	const dir = env.SCHEMAFORGE_PROTO_DIR;
	const files = readdirSync(dir)
		.filter((file) => file.endsWith(".proto"))
		.map((file) => join(dir, file));
	const proto = loadPackageDefinition(loadSync(files, PROTO_OPTIONS)) as unknown as Proto;
	const insecure = credentials.createInsecure();

	cached = {
		schema: new proto.schemaforge.v1.SchemaService(address(), insecure, CHANNEL_OPTIONS),
		health: new proto.schemaforge.v1.HealthService(address(), insecure, CHANNEL_OPTIONS),
		auth: new proto.schemaforge.v1.AuthService(address(), insecure, CHANNEL_OPTIONS),
	};

	return cached;
}

/**
 * A channel that has lost the backend sits out its backoff before it dials
 * again, and every call made meanwhile fails without trying. Throwing the
 * clients away means the next call, which may be the check that asks whether
 * the backend is back, dials straight away.
 */
function dropClients() {
	if (!cached) return;

	for (const client of Object.values(cached)) client.close();

	cached = undefined;
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
	const appCodeHeader = error.metadata.get("x-app-code").at(0);
	const violationsHeader = error.metadata.get("x-validation-violations").at(0);

	let violations: Record<string, string[]> | undefined;

	if (typeof violationsHeader === "string") {
		try {
			violations = JSON.parse(violationsHeader) as Record<string, string[]>;
		} catch {
			// A violations header we cannot parse is not worth failing the whole
			// response over; the message still says what went wrong.
			violations = undefined;
		}
	}

	return {
		appCode: Number(appCodeHeader ?? 0),
		// The code is a number on the wire; the name is what a caller can read.
		status: grpcStatus[error.code],
		message: plainMessage(error),
		violations,
	};
}

// What reaches the toast. The transport's own wording, "No connection
// established. Last error: connect ECONNREFUSED", is for the person running
// the server, not the one drawing.
function plainMessage(error: ServiceError): string {
	switch (error.code) {
		case grpcStatus.UNAVAILABLE:
			// The backend answers UNAVAILABLE too, when something behind it
			// is out of reach. Its own words say what, so they stay.
			return unreachable(error)
				? `Nothing is answering at ${address()}. Is the backend running?`
				: error.details;
		case grpcStatus.DEADLINE_EXCEEDED:
			return `The backend took longer than ${env.SCHEMAFORGE_RPC_TIMEOUT_MS / 1000}s to answer.`;
		case grpcStatus.UNAUTHENTICATED:
			return "Your sign-in has run out. Sign in again.";
		case grpcStatus.PERMISSION_DENIED:
			return error.details || "Your account is not allowed to do this.";
		default:
			return error.details || error.message;
	}
}

const unreachable = (error: ServiceError) =>
	!error.details || /No connection established|ECONNREFUSED|ENOTFOUND/.test(error.details);

/** Thrown by the server functions so a failed call rejects rather than resolving with junk. */
export class SchemaForgeRpcError extends Error {
	readonly rpc: RpcError;

	constructor(rpc: RpcError) {
		super(rpc.message);
		this.name = "SchemaForgeRpcError";
		this.rpc = rpc;
	}
}

/**
 * True when the backend understands the call but has not built it yet. M2 and
 * M3 answer this way, and it says nothing about the schema that was sent.
 */
export function isUnimplemented(error: unknown): boolean {
	return (
		error instanceof SchemaForgeRpcError &&
		error.rpc.status === grpcStatus[grpcStatus.UNIMPLEMENTED]
	);
}

function isExpired(error: unknown): boolean {
	return (
		error instanceof SchemaForgeRpcError &&
		error.rpc.status === grpcStatus[grpcStatus.UNAUTHENTICATED]
	);
}

/** One RPC with the metadata and options the wrapper fills in. */
type Call<TResponse> = (
	metadata: Metadata,
	options: CallOptions,
	callback: requestCallback<TResponse>,
) => ClientUnaryCall;

/**
 * A call made as the visitor. The token comes out of their session cookie,
 * and a visitor without one is sent to sign in: the redirect is thrown here
 * so every server function gets it without each one asking.
 */
async function authed<TResponse>(call: Call<TResponse>, requestId?: string): Promise<TResponse> {
	const current = await session();
	const { token, refreshToken } = current.data;

	if (!token) throw redirect({ to: "/login" });

	try {
		return await unary(call, requestId, `Bearer ${token}`);
	} catch (error) {
		if (!isExpired(error)) throw error;

		// An access token has a lifetime, and it runs out mid-session rather than
		// between sessions. Renewing and retrying once turns that into a slower
		// call instead of an error the user has to do something about. A refresh
		// the backend no longer honours ends the session.
		let renewed: Tokens;

		try {
			if (!refreshToken) throw error;
			renewed = await v1.AuthService.refreshToken({ refreshToken });
		} catch {
			await current.clear();
			throw redirect({ to: "/login" });
		}

		await current.update(renewed);

		return unary(call, requestId, `Bearer ${renewed.token}`);
	}
}

function unary<TResponse>(
	call: Call<TResponse>,
	requestId?: string,
	authorization?: string,
): Promise<TResponse> {
	const metadata = new Metadata();

	// Passing the id through means one line in the backend's log and one in this
	// process's can be tied to the same user action.
	if (requestId) metadata.set("x-request-id", requestId);
	if (authorization) metadata.set("authorization", authorization);

	return new Promise((settle, reject) => {
		// Without a deadline a backend that accepts the connection and then
		// hangs would hold the page request open for as long as it liked.
		const options = { deadline: Date.now() + env.SCHEMAFORGE_RPC_TIMEOUT_MS };

		call(metadata, options, (error, response) => {
			if (error) {
				if (error.code === grpcStatus.UNAVAILABLE) dropClients();
				reject(new SchemaForgeRpcError(toRpcError(error)));
				return;
			}

			if (response === undefined) {
				reject(new Error("the backend answered with nothing"));
				return;
			}

			settle(response);
		});
	});
}

/** The calls the `schemaforge.v1` package declares, wrapped for the server functions. */
export const v1 = {
	SchemaService: {
		listSchemas: (
			request: ListSchemasRequest,
			requestId?: string,
		): Promise<ListSchemasResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.ListSchemas(request, metadata, options, callback),
				requestId,
			),

		getSchema: (
			request: GetSchemaRequest,
			requestId?: string,
		): Promise<GetSchemaResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.GetSchema(request, metadata, options, callback),
				requestId,
			),

		createSchema: (
			request: CreateSchemaRequest,
			requestId?: string,
		): Promise<CreateSchemaResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.CreateSchema(request, metadata, options, callback),
				requestId,
			),

		updateSchema: (
			request: UpdateSchemaRequest,
			requestId?: string,
		): Promise<UpdateSchemaResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.UpdateSchema(request, metadata, options, callback),
				requestId,
			),

		deleteSchema: (
			request: DeleteSchemaRequest,
			requestId?: string,
		): Promise<DeleteSchemaResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.DeleteSchema(request, metadata, options, callback),
				requestId,
			),

		validateSchema: (
			request: ValidateSchemaRequest,
			requestId?: string,
		): Promise<ValidateSchemaResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.ValidateSchema(request, metadata, options, callback),
				requestId,
			),

		generateDdl: (
			request: GenerateDdlRequest,
			requestId?: string,
		): Promise<GenerateDdlResponse__Output> =>
			authed(
				(metadata, options, callback) =>
					clients().schema.GenerateDdl(request, metadata, options, callback),
				requestId,
			),
	},

	HealthService: {
		check: (): Promise<CheckResponse__Output> =>
			unary((metadata, options, callback) =>
				clients().health.Check({}, metadata, options, callback),
			),
	},

	// Signing in needs no token, so these go out bare.
	AuthService: {
		googleLoginUrl: (request: GoogleLoginUrlRequest): Promise<GoogleLoginUrlResponse__Output> =>
			unary((metadata, options, callback) =>
				clients().auth.GoogleLoginUrl(request, metadata, options, callback),
			),

		loginWithGoogle: (request: LoginWithGoogleRequest): Promise<LoginResponse__Output> =>
			unary((metadata, options, callback) =>
				clients().auth.LoginWithGoogle(request, metadata, options, callback),
			),

		refreshToken: (request: RefreshTokenRequest): Promise<RefreshTokenResponse__Output> =>
			unary((metadata, options, callback) =>
				clients().auth.RefreshToken(request, metadata, options, callback),
			),

		getCurrentUser: (): Promise<GetCurrentUserResponse__Output> =>
			authed((metadata, options, callback) =>
				clients().auth.GetCurrentUser({}, metadata, options, callback),
			),
	},
};
