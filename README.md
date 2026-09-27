# SchemaForge frontend

The canvas for SchemaForge: draw a database schema as a diagram, have the
backend check it, and turn it into SQL. Built with TanStack Start, React Flow
and shadcn/ui.

## What it needs

- Node 22 or later.
- The SchemaForge backend running, by default on `127.0.0.1:50051`.
- The backend's proto files on this machine. `SCHEMAFORGE_PROTO_DIR` points at
  the directory that holds them (`schema.proto`, `health.proto` and
  `auth.proto`, and nothing else), and the server refuses to start until it
  does.

## Running it

```bash
cp .env.example .env   # then fill in the backend address and sign-in
npm install
npm run dev            # http://localhost:3100
```

Every setting the server reads is listed and explained in `.env.example`, and
checked when the server starts, so a missing or wrong value fails with a
message naming it.

## When the proto files change

```bash
npm run proto:types
```

This writes TypeScript for every proto file in `SCHEMAFORGE_PROTO_DIR` into
`src/server/rpc/generated`, which is committed. `npm test` fails while that
output is older than the proto files.

## Checks

```bash
npm test
npm run lint
npm run typecheck
```
