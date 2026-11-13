# Deploying

The app runs on Fly.io as `schemaforge-app`. Every push to `master` deploys it through `.github/workflows/deploy.yml`, which runs `flyctl deploy --remote-only`. The workflow needs `FLY_API_TOKEN` in the repo's GitHub secrets.

## Secrets

Set these once. They must not go in `fly.toml`:

```
fly secrets set SCHEMAFORGE_SESSION_SECRET=<32 or more random characters>
fly secrets set SCHEMAFORGE_GRPC_ADDRESS=<backend host>:50051
```

Use the backend's Flycast name for the address, such as `schemaforge-api.flycast:50051`. The gRPC client speaks plain HTTP/2 without TLS. The `.internal` name stops resolving while the backend machine is suspended. Flycast goes through Fly's proxy and wakes it.

## The image

The `Dockerfile` builds in two stages on `node:24-slim`. The second stage keeps `dist`, `server.mjs`, the production dependencies, and the `proto/` folder. It sets `SCHEMAFORGE_PROTO_DIR=/app/proto` and listens on port 3000.

`server.mjs` is the production server. It serves the files in `dist/client` and hands every other request to the built app. Files under `/assets` have a hash in their name, so it tells browsers to cache them for a year.

To run the image yourself:

```
docker build -t schemaforge-frontend .
docker run -p 3000:3000 \
  -e SCHEMAFORGE_SESSION_SECRET=<32 or more random characters> \
  -e SCHEMAFORGE_GRPC_ADDRESS=<backend host>:50051 \
  schemaforge-frontend
```

## The machine

Fly suspends the machine when nobody is using it and starts it on the next request. It checks `/login` every 30 seconds. The machine is a `shared-cpu-1x` with 512 MB in `dfw`.
