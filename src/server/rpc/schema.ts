import { createServerFn } from "@tanstack/react-start"

import type {
  Diagnostic,
  Dialect,
  Schema,
  SchemaDraft,
  SchemaSummary,
} from "@/features/schema/types/schema"
import {
  diagnosticIn,
  dialectOut,
  entityOut,
  relationshipOut,
  schemaIn,
  schemaOut,
  summaryIn,
} from "@/features/schema/lib/wire"

import { callHealth, callSchema, isUnimplemented } from "./client"
import type { GenerateDdlRequest } from "./generated/schemaforge/v1/GenerateDdlRequest"

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
export type Target = { id: string } | { draft: Schema }

function targetOut(target: Target): Pick<GenerateDdlRequest, "id" | "draft"> {
  return "id" in target ? { id: target.id } : { draft: schemaOut(target.draft) }
}

/**
 * Checking and generating are later milestones, so the running backend refuses
 * them. That is a fact about the backend rather than a fault in the schema, and
 * it reads as one here: the call answers with why it cannot run instead of
 * throwing, which keeps the canvas from blaming the user for it.
 */
type Unavailable = { unavailable?: string }

function unavailable(error: unknown): Unavailable {
  if (!isUnimplemented(error)) throw error

  return {
    unavailable: error instanceof Error ? error.message : "Not built yet",
  }
}

export const listSchemas = createServerFn({ method: "GET" })
  .validator((input: { page?: number; perPage?: number }) => input)
  .handler(
    async ({ data }): Promise<{ schemas: SchemaSummary[]; total: number }> => {
      const response = await callSchema("ListSchemas", {
        page: data.page ?? 1,
        perPage: data.perPage ?? 25,
      })

      return {
        schemas: response.schemas.map(summaryIn),
        total: response.total,
      }
    }
  )

export const getSchema = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<Schema> => {
    const response = await callSchema("GetSchema", { id: data.id })

    return schemaIn(stored(response.schema))
  })

export const createSchema = createServerFn({ method: "POST" })
  .validator((input: SchemaDraft) => input)
  .handler(async ({ data }): Promise<Schema> => {
    const response = await callSchema("CreateSchema", {
      name: data.name,
      description: data.description,
      entities: data.entities.map(entityOut),
      relationships: data.relationships.map(relationshipOut),
    })

    return schemaIn(stored(response.schema))
  })

export const updateSchema = createServerFn({ method: "POST" })
  .validator((input: SchemaDraft & { id: string }) => input)
  .handler(async ({ data }): Promise<Schema> => {
    const response = await callSchema("UpdateSchema", {
      id: data.id,
      name: data.name,
      description: data.description,
      entities: data.entities.map(entityOut),
      relationships: data.relationships.map(relationshipOut),
    })

    return schemaIn(stored(response.schema))
  })

export const deleteSchema = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await callSchema("DeleteSchema", { id: data.id })

    return { id: data.id }
  })

export const validateSchema = createServerFn({ method: "POST" })
  .validator((input: Target) => input)
  .handler(
    async ({
      data,
    }): Promise<
      { valid: boolean; diagnostics: Diagnostic[] } & Unavailable
    > => {
      try {
        const response = await callSchema("ValidateSchema", targetOut(data))

        return {
          valid: response.valid,
          diagnostics: response.diagnostics.map(diagnosticIn),
        }
      } catch (error) {
        return { valid: false, diagnostics: [], ...unavailable(error) }
      }
    }
  )

export const generateDdl = createServerFn({ method: "POST" })
  .validator(
    (
      input: Target & {
        dialect?: Dialect
        includeComments?: boolean
      }
    ) => input
  )
  .handler(
    async ({
      data,
    }): Promise<{ ddl: string; diagnostics: Diagnostic[] } & Unavailable> => {
      try {
        const response = await callSchema("GenerateDdl", {
          ...targetOut(data),
          dialect: dialectOut(data.dialect ?? "POSTGRES"),
          includeComments: data.includeComments ?? true,
        })

        return {
          ddl: response.ddl,
          diagnostics: response.diagnostics.map(diagnosticIn),
        }
      } catch (error) {
        return { ddl: "", diagnostics: [], ...unavailable(error) }
      }
    }
  )

/**
 * The health call carries no token, so on its own it reports that the process
 * is up and nothing about whether this one may talk to it. Bad credentials
 * would read as a healthy backend right up until the first save. The cheapest
 * authenticated call answers that second question.
 */
export const checkBackend = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    status: string
    version: string
    signedIn: boolean
    reason?: string
  }> => {
    const response = await callHealth("Check", {})

    try {
      await callSchema("ListSchemas", { page: 1, perPage: 1 })
    } catch (error) {
      return {
        status: response.status,
        version: response.version,
        signedIn: false,
        reason: error instanceof Error ? error.message : "Could not sign in",
      }
    }

    return {
      status: response.status,
      version: response.version,
      signedIn: true,
    }
  }
)

// A response that answers with a schema always carries one; the field is
// only nullable because every message field is in proto3.
function stored<T>(schema: T | null): T {
  if (!schema) throw new Error("The backend answered without a schema.")

  return schema
}
