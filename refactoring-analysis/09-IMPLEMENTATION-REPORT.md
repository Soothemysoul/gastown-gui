# Implementation Report (refactor branch)

## Snapshot

- **Branch:** `refactor`
- **Status:** green (`npm test`)
- **Goal:** demonstrate a substantial PoEAA-style refactor (Gateway + Service Layer + Value Objects) for a CLI-bridge backend, while keeping API behavior stable and adding real automated tests.

## What We Built

### Backend “Application Core” (server/)

- **Infrastructure:** `CommandRunner`, `CacheRegistry`, `EventBus`
- **Gateways:** `GTGateway`, `BDGateway`, `TmuxGateway`, `GitHubGateway`, `GitGateway`
- **Value Objects:** `SafeSegment`, `AgentPath`
- **Service Layer:** `StatusService`, `TargetService`, `ConvoyService`, `FormulaService`, `GitHubService`, `BeadService`, `WorkService`
- **Route Modules (thin HTTP adapters):** per-domain routers under `server/routes/*`

Result: `server.js` is trending toward a composition root (dependency wiring + route registration), instead of being the implementation for every workflow.

## Endpoints Migrated out of server.js

- Status + targets:
  - `GET /api/status`
  - `GET /api/targets`
- Convoys:
  - `GET /api/convoys`
  - `GET /api/convoy/:id`
  - `POST /api/convoy`
- Formulas:
  - `GET /api/formulas`
  - `GET /api/formulas/search`
  - `GET /api/formula/:name`
  - `PUT /api/formula/:name`
  - `DELETE /api/formula/:name`
- GitHub:
  - `GET /api/github/prs`
  - `GET /api/github/issues`
  - `GET /api/github/repos`
  - `GET /api/github/pr/:repo/:number`
  - `GET /api/github/issue/:repo/:number`
- Core workflow (beads + dispatch):
  - `POST /api/sling`
  - `POST /api/escalate`
  - `GET /api/beads`
  - `GET /api/beads/search`
  - `POST /api/beads`
  - `GET /api/bead/:beadId`
  - `POST /api/work/:beadId/done`
  - `POST /api/work/:beadId/park`
  - `POST /api/work/:beadId/release`
  - `POST /api/work/:beadId/reassign`

## Key Correctness Wins Bundled With the Refactor

- Fixed runtime-broken formula update/delete behavior by implementing it inside `FormulaService` (ESM-safe, cache invalidation included).
- Standardized external command execution semantics via `CommandRunner` + Gateway layer (timeouts, exit codes, normalized `{ ok, stdout, stderr }`).
- Made “informational non-zero exit codes” explicit where needed (e.g., `gt status` via `allowExitCodes`).

## Automated Testing Added/Expanded

- **Unit tests** for gateways/services/value objects (no real CLI tools required).
- **Route tests** spin up a real Express app with stub services on an ephemeral port to lock down HTTP behavior.
- **Existing integration/e2e suites** continue to run against the mock server.

## Evidence (Commits)

See `git log --oneline` on `refactor` for the full, incremental trail. Recent key commits:

- `34f9e31` test: bind mock server to localhost
- `99a0bf2` feat(server): add BDGateway.create
- `2cc97b8` feat(server): add GTGateway.escalate
- `75b2b99` feat(server): add BeadService/WorkService and route modules
- `87748ab` refactor(server): migrate beads/work/sling/escalate routes to services
- `694e5f4` docs: record bead/work migration progress

## What’s Next (Highest Leverage)

1. **Extract remaining endpoints** into Service/Route modules (mail, polecat control, rigs/crews, doctor/setup, and bead links `GET /api/bead/:beadId/links`).
2. **Activity stream refactor:** move WebSocket feed/start/stop into `ActivityStreamService` so it’s unit-testable and uses `CommandRunner.spawn`.
3. **Retire legacy helpers:** once coverage is in place, remove `executeGT`, `executeBD`, and remaining direct `execFileAsync(...)` callsites.

