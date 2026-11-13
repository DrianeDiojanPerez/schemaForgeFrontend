<p align="center"><img src="assets/banner.png" alt="SchemaForge: draw a database schema, check it, and get the SQL" width="100%"></p>

- [Requirements](#requirements)
- [Run](#run)
- [Test](#test)
- [Docs](#docs)

## Requirements

- Node 22 or later.
- The SchemaForge backend, on `127.0.0.1:50051` unless you set another address.
- The backend's proto files on this machine.

## Run

```
cp .env.example .env
npm install
npm run dev
```

Fill in `.env` before the last step. It needs a session secret and the folder that holds the proto files. See [Settings](docs/settings.md).

The app opens at http://localhost:3100.

## Test

```
npm test
npm run lint
npm run typecheck
```

`npm run test:backend` runs the same calls against a real backend. See [Testing](docs/testing.md).

## Docs

- [How it works](docs/how-it-works.md)
- [Settings](docs/settings.md): every value in `.env`
- [Commands](docs/commands.md): the `npm` scripts
- [Proto files](docs/proto.md): what to do when the backend's contract changes
- [Testing](docs/testing.md): checks, the backend suite, and the case studies
- [Deploying](docs/deploy.md): Fly.io and the Docker image
- [Where things live](docs/layout.md)
- [Troubleshooting](docs/troubleshooting.md)
