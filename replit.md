# AgentOS

This repository is the standalone Agent Platform dashboard/API.
Read README.md before setup. Use pnpm and Node.js 24.

- Preserve the existing React UI unless a design change is requested.
- Change API contracts in lib/api-spec/openapi.yaml first; regenerate with
  pnpm run codegen.
- Keep the database dedicated to AgentOS. No inherited credentials, rows,
  migrations or storage bindings from another application.
- Do not add secrets to code or Git. Use the workspace's secure Secrets interface.
- Existing runs are simulated, and the application has no built-in auth.
  Do not claim real AI execution or expose the API publicly without an approved
  access-control design.
- Verify with pnpm run typecheck, pnpm test and pnpm run build.
- No cloud provisioning, deployment, paid usage or production schema changes
  without explicit owner approval.
