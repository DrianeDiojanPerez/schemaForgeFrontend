import { createServerFn } from "@tanstack/react-start";

import type {
	Diagnostic,
	Dialect,
	Member,
	People,
	Result,
	Schema,
	SchemaDraft,
	SchemaSummary,
	ShareOutcome,
	ShareRole,
	SharedSchema,
} from "@/features/schema/types/schema";
import {
	diagnosticIn,
	dialectOut,
	entityOut,
	invitationIn,
	memberIn,
	relationshipOut,
	schemaIn,
	schemaOut,
	shareRoleOut,
	sharedSchemaIn,
	summaryIn,
} from "@/features/schema/lib/wire";

import { session } from "../auth/session";
import { SchemaForgeRpcError, isUnimplemented, v1 } from "./client";
import type { GenerateDdlRequest } from "./generated/schemaforge/v1/GenerateDdlRequest";

/**
 * The RPC boundary.
 *
 * Every function here marshals a request, calls the backend, and marshals the
 * response. No validation rule, no type decision and no DDL shaping lives in
 * this file.
 *
 * That restraint is load-bearing. The backend owns all schema meaning and the
 * frontend only renders it; the moment a rule leaks in here, that stops being
 * true. If something starts looking like a decision about what a schema means,
 * it belongs in the Rust core.
 */

/** Either a stored schema by id, or the unsaved draft the canvas is holding. */
export type Target = { id: string } | { draft: Schema };

function targetOut(target: Target): Pick<GenerateDdlRequest, "id" | "draft"> {
	return "id" in target ? { id: target.id } : { draft: schemaOut(target.draft) };
}

/**
 * A dialect the backend has no generator for yet, MySQL for now, comes back
 * as Unimplemented. That is a fact about the backend rather than a fault in
 * the schema, and it reads as one here: the call answers with why it cannot
 * run instead of throwing, which keeps the canvas from blaming the user for it.
 */
type Unavailable = { unavailable?: string };

function unavailable(error: unknown): Unavailable {
	if (!isUnimplemented(error)) throw error;

	return {
		unavailable: error instanceof Error ? error.message : "Not built yet",
	};
}

export const listSchemas = createServerFn({ method: "GET" })
	.validator((input: { page?: number; perPage?: number }) => input)
	.handler(async ({ data }): Promise<{ schemas: SchemaSummary[]; total: number }> => {
		const response = await v1.SchemaService.listSchemas({
			page: data.page ?? 1,
			perPage: data.perPage ?? 25,
		});

		return {
			schemas: response.schemas.map(summaryIn),
			total: response.total,
		};
	});

export const getSchema = createServerFn({ method: "GET" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<Schema> => {
		const response = await v1.SchemaService.getSchema({ id: data.id });

		return schemaIn(stored(response.schema));
	});

export const createSchema = createServerFn({ method: "POST" })
	.validator((input: SchemaDraft) => input)
	.handler(async ({ data }): Promise<Schema> => {
		const response = await v1.SchemaService.createSchema({
			name: data.name,
			description: data.description,
			entities: data.entities.map(entityOut),
			relationships: data.relationships.map(relationshipOut),
		});

		return schemaIn(stored(response.schema));
	});

export const updateSchema = createServerFn({ method: "POST" })
	.validator((input: SchemaDraft & { id: string }) => input)
	.handler(async ({ data }): Promise<Schema> => {
		const response = await v1.SchemaService.updateSchema({
			id: data.id,
			name: data.name,
			description: data.description,
			entities: data.entities.map(entityOut),
			relationships: data.relationships.map(relationshipOut),
		});

		return schemaIn(stored(response.schema));
	});

export const deleteSchema = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }) => {
		await v1.SchemaService.deleteSchema({ id: data.id });

		return { id: data.id };
	});

export const validateSchema = createServerFn({ method: "POST" })
	.validator((input: Target) => input)
	.handler(
		async ({ data }): Promise<{ valid: boolean; diagnostics: Diagnostic[] } & Unavailable> => {
			try {
				const response = await v1.SchemaService.validateSchema(targetOut(data));

				return {
					valid: response.valid,
					diagnostics: response.diagnostics.map(diagnosticIn),
				};
			} catch (error) {
				return { valid: false, diagnostics: [], ...unavailable(error) };
			}
		},
	);

export const generateDdl = createServerFn({ method: "POST" })
	.validator(
		(
			input: Target & {
				dialect?: Dialect;
				includeComments?: boolean;
				includePositions?: boolean;
			},
		) => input,
	)
	.handler(async ({ data }): Promise<{ ddl: string; diagnostics: Diagnostic[] } & Unavailable> => {
		try {
			const response = await v1.SchemaService.generateDdl({
				...targetOut(data),
				dialect: dialectOut(data.dialect ?? "POSTGRES"),
				includeComments: data.includeComments ?? true,
				includePositions: data.includePositions ?? true,
			});

			return {
				ddl: response.ddl,
				diagnostics: response.diagnostics.map(diagnosticIn),
			};
		} catch (error) {
			return { ddl: "", diagnostics: [], ...unavailable(error) };
		}
	});

export type ExportedFile = { fileName: string; contentType: string; content: string };

export const exportSchema = createServerFn({ method: "POST" })
	.validator((input: Target & { includePositions?: boolean }) => input)
	.handler(async ({ data }): Promise<ExportedFile> => {
		const response = await v1.SchemaService.exportSchema({
			...targetOut(data),
			format: "EXPORT_FORMAT_JSON",
			includePositions: data.includePositions ?? true,
		});

		return {
			fileName: response.fileName,
			contentType: response.contentType,
			content: response.content,
		};
	});

export type ImportFormat = "JSON" | "SQL";

export const importSchema = createServerFn({ method: "POST" })
	.validator(
		(input: { content: string; format: ImportFormat; includePositions?: boolean }) => input,
	)
	.handler(async ({ data }): Promise<{ draft: Schema; diagnostics: Diagnostic[] }> => {
		const response = await v1.SchemaService.importSchema({
			content: data.content,
			format: `IMPORT_FORMAT_${data.format}`,
			includePositions: data.includePositions ?? true,
		});

		return {
			draft: schemaIn(stored(response.draft)),
			diagnostics: response.diagnostics.map(diagnosticIn),
		};
	});

/**
 * Sharing. A refused share says why in its status, an address that already
 * has access or an invitation that has run out, and the page has to read
 * that. The status would be lost on the way to the browser if these threw,
 * so they answer with a result instead and the browser side throws from it.
 */
async function attempt<T>(call: () => Promise<T>): Promise<Result<T>> {
	try {
		return { ok: true, value: await call() };
	} catch (error) {
		if (error instanceof SchemaForgeRpcError) return { ok: false, ...error.rpc };

		throw error;
	}
}

export const listSharedSchemas = createServerFn({ method: "GET" })
	.validator((input: { page?: number; perPage?: number }) => input)
	.handler(async ({ data }): Promise<{ schemas: SharedSchema[]; total: number }> => {
		const response = await v1.SchemaService.listSharedSchemas({
			page: data.page ?? 1,
			perPage: data.perPage ?? 25,
		});

		return {
			schemas: response.schemas.map(sharedSchemaIn),
			total: response.total,
		};
	});

export const listPeople = createServerFn({ method: "GET" })
	.validator((input: { schemaId: string }) => input)
	.handler(async ({ data }): Promise<People> => {
		const response = await v1.SchemaService.listPeople({ schemaId: data.schemaId });

		return {
			members: response.members.map(memberIn),
			invitations: response.invitations.map(invitationIn),
		};
	});

export const shareSchema = createServerFn({ method: "POST" })
	.validator(
		(input: { schemaId: string; email: string; role: ShareRole; callbackUri: string }) => input,
	)
	.handler(({ data }): Promise<Result<ShareOutcome>> =>
		attempt(async () => {
			const response = await v1.SchemaService.shareSchema({
				schemaId: data.schemaId,
				email: data.email,
				role: shareRoleOut(data.role),
				callbackUri: data.callbackUri,
			});

			if (response.member) return { member: memberIn(response.member) };
			if (response.invitation) return { invitation: invitationIn(response.invitation) };

			throw new Error("The backend answered without saying who was given access.");
		}),
	);

export const changeShareRole = createServerFn({ method: "POST" })
	.validator((input: { schemaId: string; userId: string; role: ShareRole }) => input)
	.handler(({ data }): Promise<Result<Member>> =>
		attempt(async () => {
			const response = await v1.SchemaService.changeShareRole({
				schemaId: data.schemaId,
				userId: data.userId,
				role: shareRoleOut(data.role),
			});

			return memberIn(stored(response.member));
		}),
	);

export const revokeShare = createServerFn({ method: "POST" })
	.validator((input: { schemaId: string; userId: string }) => input)
	.handler(({ data }): Promise<Result<{ userId: string }>> =>
		attempt(async () => {
			await v1.SchemaService.revokeShare({ schemaId: data.schemaId, userId: data.userId });

			return { userId: data.userId };
		}),
	);

export const cancelInvitation = createServerFn({ method: "POST" })
	.validator((input: { schemaId: string; invitationId: string }) => input)
	.handler(({ data }): Promise<Result<{ invitationId: string }>> =>
		attempt(async () => {
			await v1.SchemaService.cancelInvitation({
				schemaId: data.schemaId,
				invitationId: data.invitationId,
			});

			return { invitationId: data.invitationId };
		}),
	);

export const acceptInvitation = createServerFn({ method: "POST" })
	.validator((input: { token: string }) => input)
	.handler(({ data }): Promise<Result<SharedSchema>> =>
		attempt(async () => {
			const response = await v1.SchemaService.acceptInvitation({ token: data.token });

			return sharedSchemaIn(stored(response.schema));
		}),
	);

/**
 * The health call carries no token, so on its own it reports that the process
 * is up and nothing about this visitor. Whether they are signed in is read
 * off their session alongside it.
 */
export const checkBackend = createServerFn({ method: "GET" }).handler(
	async (): Promise<{
		status: string;
		version: string;
		signedIn: boolean;
		reason?: string;
	}> => {
		const response = await v1.HealthService.check();
		const signedIn = Boolean((await session()).data.token);

		return {
			status: response.status,
			version: response.version,
			signedIn,
			reason: signedIn ? undefined : "Not signed in",
		};
	},
);

// A response that answers with a schema always carries one; the field is
// only nullable because every message field is in proto3.
function stored<T>(schema: T | null): T {
	if (!schema) throw new Error("The backend answered without a schema.");

	return schema;
}
