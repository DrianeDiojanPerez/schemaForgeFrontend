# Where things live

| What | Where |
|---|---|
| Pages | `src/routes` |
| The canvas | `src/features/erd` |
| Schema queries, mutations, and types | `src/features/schema` |
| Shared components | `src/components`, with the shadcn/ui ones in `src/components/ui` |
| Server settings | `src/server/env.ts` |
| Browser settings | `src/env.ts` |
| Sign-in and the session cookie | `src/server/auth` |
| The gRPC client | `src/server/rpc/client.ts` |
| Schema server functions | `src/server/rpc/schema.ts` |
| Types written from the proto files | `src/server/rpc/generated` |
| The proto files that ship in the image | `proto` |
| Case studies | `case-studies` |
| The production server | `server.mjs` |
| Fly.io settings | `fly.toml` |

## Pages

| Path | What it is |
|---|---|
| `/` | The canvas |
| `/login` | Sign in |
| `/create` | Create an account |
| `/auth/google/callback` | Where Google sends the browser back |
| `/invitations/<token>` | Accept an invitation to a shared schema |
| `/privacy`, `/terms` | The legal pages |

`src/routeTree.gen.ts` is written by TanStack Router. Don't edit it.
