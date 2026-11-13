# How it works

SchemaForge is a canvas for database schemas. You draw tables and the lines between them, the backend checks the drawing, and you get PostgreSQL to run. This repo is the frontend. It stores nothing itself.

```
Browser → TanStack Start server functions → gRPC → SchemaForge backend
```

The browser never talks to the backend. Every call goes through a server function in `src/server`, which dials the backend over plain HTTP/2 at `SCHEMAFORGE_GRPC_ADDRESS`. The server loads the proto files from `SCHEMAFORGE_PROTO_DIR` when it starts, so it reads the contract at runtime.

## Signing in

People sign in with Google or with an email and password. The backend holds the Google client and issues the tokens. This server seals those tokens into a cookie named `schemaforge` with `SCHEMAFORGE_SESSION_SECRET`. The cookie is `httpOnly` and lasts thirty days, so page scripts can't read the tokens.

## What the canvas does

- Draws tables, columns, and relationships with React Flow.
- Saves on its own as you edit.
- Shows the backend's problems on the table or column they belong to.
- Shows the generated SQL in a side panel.
- Exports SQL, JSON, SVG, or one HTML file, and imports SQL or JSON.
- Compares two schemas and writes a migration.
- Shares a schema with other people by invitation.

`Ctrl+S` saves and `Ctrl+K` finds a table. On a Mac use `Cmd`.
