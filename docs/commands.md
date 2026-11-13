# Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on http://localhost:3100 |
| `npm run build` | Build the app into `dist` |
| `npm start` | Serve the build with `server.mjs`, on port 3000 unless `PORT` says otherwise |
| `npm run preview` | Serve the build with Vite |
| `npm test` | Run the tests |
| `npm run test:backend` | Run the backend suite against a real backend |
| `npm run case-study:1` | Run the course registration case study |
| `npm run case-study:2` | Run the e-commerce case study |
| `npm run lint` | Run oxlint, then eslint |
| `npm run typecheck` | Run `tsc` without writing files |
| `npm run format` | Format every TypeScript and JavaScript file with prettier |
| `npm run check` | Say which files prettier would change |
| `npm run proto:types` | Write TypeScript for the proto files. See [Proto files](proto.md) |

`npm start` needs `npm run build` first.
