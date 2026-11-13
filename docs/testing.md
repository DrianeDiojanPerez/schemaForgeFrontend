# Testing

## Checks

```
npm test
npm run lint
npm run typecheck
```

`npm test` needs no backend. It skips the backend suite and the case studies while `SCHEMAFORGE_TEST_BACKEND` is unset.

## Against a running backend

```
npm run test:backend
```

This runs `src/server/rpc/backend.test.ts` through the real gRPC calls. It registers a throwaway account on the backend, then saves, validates, generates, exports, and imports a schema.

It uses `127.0.0.1:50051` unless you set another backend:

```
SCHEMAFORGE_TEST_BACKEND=10.0.0.5:50051 npm run test:backend
```

## Case studies

```
npm run case-study:1
npm run case-study:2
```

A case study takes a drawn diagram through the whole path. It saves the diagram, validates it, generates the SQL, runs that SQL on PostgreSQL, and compares the result with a hand-written `reference.sql`. Then it breaks the schema on purpose and checks that the backend reports the right problem code.

| Study | Folder |
|---|---|
| 1, course registration | `case-studies/course-registration` |
| 2, e-commerce | `case-studies/e-commerce` |

Each run writes `generated.sql`, `results.json`, and `results.md` next to the study's files.

The PostgreSQL step runs `psql` through `docker exec` in a container named `schemaforge-db`. Set `CASE_STUDY_DB` to use another container.
