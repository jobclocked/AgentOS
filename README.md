# AgentOS

Standalone source snapshot of the existing Agent Platform dashboard and API.
Includes agent definitions, deployments, runs, tools and analytics.

## Important limitations

- Agent run execution is **simulated**: the existing run endpoint generates
  randomized outcomes, duration and token usage. It does not call an LLM or
  execute the listed tools. Deployments store configuration; this snapshot does
  not introduce a scheduler, webhook ingress or real deployment service.
- AgentOS currently has **no application authentication or authorization**.
  API routes can read/write records. Keep it local or behind an access-control
  boundary. Do not publish it as an unrestricted production service until auth,
  authorization, rate limits and input/security hardening are implemented.
- This is source only. No database rows, credentials, storage objects, account
  identities, signing files, Git history or existing service bindings were moved.
- Provision a separate PostgreSQL database. Never connect this app to an existing
  unrelated application's database or use its credentials as a shortcut.
- No new hosting or cloud services are provisioned by importing this repository.

## Requirements

- Node.js 24
- pnpm 10.26.1
- A dedicated PostgreSQL database, set through `DATABASE_URL` in the environment
  or the host's secure Secrets interface. No API key is needed for simulated runs.
  No automatic `.env` loader is installed; set the variables in your shell/host.

## Install and validate

```sh
pnpm install --frozen-lockfile
pnpm run codegen       # Regenerate the AgentOS-only client and validation schemas
pnpm run typecheck
pnpm test
pnpm run build
```

The generated client/validation source and lockfile are checked in.

### Create the schema — only for a new, dedicated database

After verifying `DATABASE_URL` points to the intended new database and approving
the schema changes:

```sh
pnpm --filter @workspace/db run push
```

This creates only the agents, deployments, runs and tools schema. No data is
seeded; empty tool and dashboard lists are expected until configured. Schema
creation is not automatic at startup. Never run this against unrelated data.

### Development

Run in separate terminals:

```sh
pnpm run dev:api
pnpm run dev:web
```

The API defaults to port 8080 and Vite to 5173. Vite forwards `/api` to the API.
Override using each service's `PORT`; if changing the API port, set
`API_PROXY_TARGET` on the web service. Vite's optional `BASE_PATH` defaults to `/`.

### Built server

```sh
pnpm run build
NODE_ENV=production PORT=8080 pnpm start
```

The Node server serves the built frontend, SPA routes and `/api` on one port.
`GET /api/healthz` is a process check, not proof of database readiness.
Keep this service protected until application authentication is added.

## Layout

- `artifacts/agent-platform` — existing React/Vite UI and assets
- `artifacts/api-server` — AgentOS-only Express routes and production server
- `lib/db` — AgentOS-only Drizzle schema
- `lib/api-spec` — AgentOS-only OpenAPI contract and code generation
- `lib/api-client-react`, `lib/api-zod` — generated client and validators

The existing visual design and business behavior are retained. The standalone
server/build configuration removes the former application's identity, recording,
storage, AI-pipeline and mobile dependencies. Deployment is a separate,
owner-approved step; this repository does not deploy itself.
