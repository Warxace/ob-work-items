# AGENTS.md

## Scope
- This repo is a single npm workspace rooted at `package.json` with packages in `packages/*`.
- Root TypeScript project references only `packages/core`, `packages/git`, `packages/mcp`, and `packages/api`; `packages/ui` builds separately with Vite.

## Packages
- `packages/core`: filesystem-backed work item CRUD, parsing, search, schema validation. Work items are root-level `WI-YYYYMMDD-xxxx.md` files in the target repo.
- `packages/git`: git wrapper plus sync policy (`onStartup`, `afterMutation`, `startPeriodicSync`).
- `packages/mcp`: stdio MCP server. This is the durable write path: create/update tools call `afterMutation`, which commits immediately and may push depending on config.
- `packages/api`: Hono HTTP API plus static UI hosting. `PATCH /api/items/:id` is intentionally UI-only and does not commit or push.
- `packages/ui`: React 19 + Vite dashboard talking to `/api`; Vite dev server proxies `/api` to `http://localhost:3847`.

## Commands
- Install: `npm install`
- Build everything: `npm run build`
- Run all tests: `npm test`
- Run all lint: `npm run lint`
- Run one workspace build: `npm run build -w @warxace/ob-wi-core` (swap package name as needed)
- Run UI dev server: `npm run dev -w @warxace/ob-wi-ui`
- Run API dev server: `npm run dev -w @warxace/ob-wi-api -- --path /abs/path/to/work-items`
- Run MCP dev server: `npm run dev -w @warxace/ob-wi-mcp -- --path /abs/path/to/work-items`
- Run combined built app: `node packages/api/dist/index.js --path /abs/path/to/work-items`

## Verification
- Preferred full check after shared code changes: `npm run build && npm test && npm run lint`
- Focused node tests: `npx vitest run packages/core/tests/work-item.test.ts`
- Focused UI tests: `npx vitest run packages/ui/src/__tests__/ItemList.test.tsx --project ui`
- Vitest projects are split at root config: `node` covers `packages/{core,git,mcp,api}/tests`, `ui` covers `packages/ui/src/**/__tests__/**/*.test.tsx` in `jsdom`.

## Gotchas
- If you change API behavior that affects the browser app, rebuild `@warxace/ob-wi-ui` too. The API serves static files from `packages/ui/dist`; without that build the server falls back to `UI not found. Run: npm run build -w @warxace/ob-wi-ui`.
- Do not assume UI edits persist to git history. Only MCP create/update currently trigger `commitAll` and optional push.
- MCP startup always does a pull via `onStartup`; push behavior is controlled by `--push-strategy` / `WI_PUSH_STRATEGY` with `periodic` default and `30` second interval.
- Schema validation and transition checks are advisory only. They return warnings but do not block create/update.

## Style And Tooling
- Root ESLint is type-aware for `packages/*/src/**/*.ts` and strict about unsafe TS usage; expect lint failures for `any`-like flows, floating promises, and unused vars.
- UI has its own separate `packages/ui/eslint.config.js`; run root lint for whole-repo checks, not just the UI workspace lint, if you touched shared code.
