/**
 * Every key the app caches under, in one place. Invalidating `schemas.all`
 * drops every schema query, `schemas.lists()` only the listings, and so on
 * down: a key is a prefix of every key built from it.
 */
export const schemaKeys = {
  all: ["schemas"] as const,
  lists: () => [...schemaKeys.all, "list"] as const,
  list: (page: number, perPage: number) =>
    [...schemaKeys.lists(), { page, perPage }] as const,
  details: () => [...schemaKeys.all, "detail"] as const,
  detail: (id: string) => [...schemaKeys.details(), id] as const,
  latest: () => [...schemaKeys.all, "latest"] as const,
}

export const backendKeys = {
  status: ["backend", "status"] as const,
}
