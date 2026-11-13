# Troubleshooting

Start with the terminal that runs `npm run dev`. A wrong setting fails there and names the value.

- **`SCHEMAFORGE_SESSION_SECRET` is invalid:** it is empty or shorter than 32 characters. Make one with `openssl rand -base64 32`.
- **`SCHEMAFORGE_PROTO_DIR` "must be a directory of .proto files":** the folder is missing, empty, or holds another file. A README or a `.gitkeep` in it is enough to fail the check.
- **`SCHEMAFORGE_GRPC_ADDRESS` "expected host:port":** leave out `http://` and any path. `127.0.0.1:50051` is the right form.
- **The app says it can't reach the backend:** the backend isn't running at `SCHEMAFORGE_GRPC_ADDRESS`. The app waits five seconds before it says so.
- **`npm test` fails in `generated.test.ts`:** the proto files changed after the types were written. Run `npm run proto:types`. See [Proto files](proto.md).
- **A backend call works locally and fails once deployed:** the `proto/` folder is older than the backend. Copy the new proto files into it and deploy again.
- **"This sign-in did not start here. Try again.":** Google sent the browser back with a state this session didn't make. This happens when the sign-in started in another browser or the cookie was cleared on the way. Start the sign-in again.
- **A case study records the PostgreSQL step as not run:** the `schemaforge-db` container isn't running. Start it, or set `CASE_STUDY_DB` to the container you use.
- **Signed out on Fly after every deploy:** `SCHEMAFORGE_SESSION_SECRET` changed. Cookies sealed with the old secret no longer open.
