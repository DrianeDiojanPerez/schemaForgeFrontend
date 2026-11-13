# Proto files

The backend's contract is three files: `schema.proto`, `health.proto`, and `auth.proto`. This repo uses them in three places.

| Where | What it is for |
|---|---|
| `SCHEMAFORGE_PROTO_DIR` | The folder the server loads at runtime. On your machine, point it at the backend's checkout. |
| `proto/` | A copy that ships in the Docker image, where `SCHEMAFORGE_PROTO_DIR` is `/app/proto`. |
| `src/server/rpc/generated/` | TypeScript written from the proto files. Committed. |

## When the proto files change

1. Write the types again:
   ```
   npm run proto:types
   ```
2. Copy the new proto files into `proto/`, so the deployed server reads the same contract.
3. Commit `proto/` and `src/server/rpc/generated/` together.

`npm test` fails while the generated types are older than the proto files in `SCHEMAFORGE_PROTO_DIR`.

Don't edit anything in `src/server/rpc/generated/` by hand. The next `npm run proto:types` deletes the folder and writes it again.
