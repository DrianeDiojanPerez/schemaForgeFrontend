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

type Wire = Record<string, unknown>

/** Either a stored schema by id, or the unsaved draft the canvas is holding. */
export type Target = { id: string } | { draft: Schema }

function targetOut(target: Target): Wire {
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
      const response = await callSchema<Wire, Wire>("listSchemas", {
        page: data.page ?? 1,
        perPage: data.perPage ?? 25,
      })

      return {
        schemas: ((response.schemas as Wire[] | undefined) ?? []).map(
          summaryIn
        ),
        total: Number(response.total ?? 0),
      }
    }
  )

export const getSchema = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<Schema> => {
    const response = await callSchema<Wire, Wire>("getSchema", { id: data.id })

    return schemaIn(response.schema as Wire)
  })

export const createSchema = createServerFn({ method: "POST" })
  .validator((input: SchemaDraft) => input)
  .handler(async ({ data }): Promise<Schema> => {
    const response = await callSchema<Wire, Wire>("createSchema", {
      name: data.name,
      description: data.description,
      entities: data.entities.map(entityOut),
      relationships: data.relationships.map(relationshipOut),
    })

    return schemaIn(response.schema as Wire)
  })

export const updateSchema = createServerFn({ method: "POST" })
  .validator((input: SchemaDraft & { id: string }) => input)
  .handler(async ({ data }): Promise<Schema> => {
    const response = await callSchema<Wire, Wire>("updateSchema", {
      id: data.id,
      name: data.name,
      description: data.description,
      entities: data.entities.map(entityOut),
      relationships: data.relationships.map(relationshipOut),
    })

    return schemaIn(response.schema as Wire)
  })

export const deleteSchema = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await callSchema<Wire, Wire>("deleteSchema", { id: data.id })

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
        const response = await callSchema<Wire, Wire>(
          "validateSchema",
          targetOut(data)
        )

        return {
          valid: Boolean(response.valid),
          diagnostics: ((response.diagnostics as Wire[] | undefined) ?? []).map(
            diagnosticIn
          ),
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
        const response = await callSchema<Wire, Wire>("generateDdl", {
          ...targetOut(data),
          dialect: dialectOut(data.dialect ?? "POSTGRES"),
          includeComments: data.includeComments ?? true,
        })

        return {
          ddl: String(response.ddl ?? ""),
          diagnostics: ((response.diagnostics as Wire[] | undefined) ?? []).map(
            diagnosticIn
          ),
        }
      } catch (error) {
        return { ddl: "", diagnostics: [], ...unavailable(error) }
      }
    }
  )

export const checkBackend = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await callHealth<Wire, Wire>("check", {})

    return {
      status: String(response.status ?? ""),
      version: String(response.version ?? ""),
    }
  }
)
