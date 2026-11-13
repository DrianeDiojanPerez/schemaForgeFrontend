# Settings

Copy `.env.example` to `.env` and fill it in. The server checks every value when it starts and names each one that is missing or wrong.

| Name | Needed | What it is |
|---|---|---|
| `SCHEMAFORGE_GRPC_ADDRESS` | No | The backend's address as `host:port`. `127.0.0.1:50051` when unset. |
| `SCHEMAFORGE_SESSION_SECRET` | Yes | 32 or more characters. Seals the cookie that holds each visitor's backend tokens. |
| `SCHEMAFORGE_PROTO_DIR` | Yes | A folder that holds the backend's `.proto` files and nothing else. |
| `SCHEMAFORGE_RPC_TIMEOUT_MS` | No | How long one backend call may take, in milliseconds. `15000` when unset. |
| `VITE_GOOGLE_SITE_VERIFICATION` | No | Google's site verification code. Vite puts it in the browser bundle at build time, so it is public. |

Make a secret with:

```
openssl rand -base64 32
```

A line left as `NAME=` counts as unset.

## Only for tests

| Name | What it is |
|---|---|
| `SCHEMAFORGE_TEST_BACKEND` | The backend the backend suite and the case studies run against. The `npm` scripts set it to `127.0.0.1:50051` when unset. |
| `CASE_STUDY_DB` | The PostgreSQL Docker container the case studies run their scripts in. `schemaforge-db` when unset. |
