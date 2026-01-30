# Refactor Summary (PoEAA-aligned backend refactor)

## Snapshot

- **Branch:** `refactor`
- **Diff range:** `a4ebe276816c373fc99457fa58756aa23966096e` → `c5753ff2362ac6045a7c59e145be55d4c0101841`
- **Base:** `a4ebe27` (2026-01-17) — `chore: bump version to 0.9.2 for npm publish`
- **Head:** `c5753ff` (2026-01-30) — `docs: document trace export script`
- **Tests:** `npm test` ✅ (Vitest) — 30 files / 281 tests passed (local run 2026-01-30)

## Why This Refactor Exists

This repo’s backend is fundamentally a **GUI → CLI bridge**: it receives HTTP requests from the browser UI and translates them into calls to external systems (`gt`, `bd`, `gh`, `tmux`, filesystem). That is exactly the domain where PoEAA-style **Gateway** and **Service Layer** abstractions pay off:

- **Gateway**: encapsulate each external system behind a stable interface, normalize exit codes and output, and make it testable.
- **Service Layer**: define an explicit set of application operations (“business transactions”) independent of HTTP.
- **Thin route modules**: keep Express routes as validation + delegation only.
- **Value Objects**: model and validate domain identifiers used in paths/session names (e.g., `rig/name`).

## Code Smells / Pain Points Addressed

- **God file:** `server.js` contained HTTP wiring, business logic, command execution, caching, parsing, and filesystem access.
- **Scattered external calls:** ad-hoc `execFile`/`spawn` usage across many handlers with inconsistent error/exit-code semantics.
- **Hard-to-test behavior:** endpoint behavior was tightly coupled to real CLI tools and runtime environment.
- **Bug-prone logic boundaries:** important correctness behavior lived inside route handlers rather than a testable application boundary.

## Architecture: Before vs After

### Before

`server.js` did almost everything:

- Express setup + all routes
- Business logic + parsing
- Direct external calls to `gt` / `bd` / `gh` / `tmux`
- Caching + filesystem access

`server.js` line count: **2542**

```mermaid
flowchart LR
  Browser[Browser UI] -->|HTTP + WebSocket| Monolith[server.js\n(monolith)]
  Monolith -->|exec/spawn| GT[gt CLI]
  Monolith -->|exec/spawn| BD[bd CLI]
  Monolith -->|exec/spawn| GH[gh CLI]
  Monolith -->|exec/spawn| TM[tmux]
  Monolith --> Cache[ad-hoc caching]
  Monolith --> FS[filesystem]
```

### After

`server.js` is trending toward a **composition root** (dependency wiring + route registration), while the “Application Core” sits under `server/`:

- **Infrastructure:** `CommandRunner`, `CacheRegistry`, `EventBus`
- **Gateways:** `GTGateway`, `BDGateway`, `GitHubGateway`, `TmuxGateway`, `GitGateway`
- **Services:** `StatusService`, `TargetService`, `ConvoyService`, `FormulaService`, `GitHubService`, `BeadService`, `WorkService`
- **Route modules:** `server/routes/*` (thin HTTP adapters)
- **Value Objects:** `SafeSegment`, `AgentPath`

`server.js` line count: **1671** (net **-871**)

```mermaid
flowchart LR
  Browser[Browser UI] -->|HTTP| Routes[server/routes/*\n(thin adapters)]
  Browser -->|WebSocket| WS[server.js\n(broadcast)]

  subgraph Core[Backend Application Core (server/)]
    Routes --> Services[server/services/*\n(Service Layer)]
    Services --> VOs[server/domain/values/*\n(Value Objects)]
    Services --> CacheReg[CacheRegistry]
    Services --> Gateways[server/gateways/*\n(Gateway)]
    Gateways --> Runner[CommandRunner]
  end

  Runner -->|exec| GT[gt CLI]
  Runner -->|exec| BD[bd CLI]
  Runner -->|exec| GH[gh CLI]
  Runner -->|exec| TM[tmux]
```

## Refactorings / Patterns Implemented

- **PoEAA Gateway:** centralizes external-system access (`gt`, `bd`, `gh`, `tmux`).
- **PoEAA Service Layer:** business operations moved out of Express handlers into service classes.
- **Value Objects:** domain-safe parsing/formatting for identifiers that become paths/session names.
- **Thin Controller / Route Modules:** route files validate inputs and delegate to services.
- **Composition Root direction:** `server.js` wires dependencies and registers routes.

## Concrete Behavioral Work Moved Out of `server.js`

Endpoints migrated into services + route modules:

- `GET /api/status`
- `GET /api/targets`
- `GET /api/convoys`
- `GET /api/convoy/:id`
- `POST /api/convoy`
- `GET /api/formulas`
- `GET /api/formulas/search`
- `GET /api/formula/:name`
- `PUT /api/formula/:name`
- `DELETE /api/formula/:name`
- `GET /api/github/prs`
- `GET /api/github/issues`
- `GET /api/github/repos`
- `GET /api/github/pr/:repo/:number`
- `GET /api/github/issue/:repo/:number`
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

Key correctness wins bundled with the refactor:

- Standardized command execution semantics via `CommandRunner` + gateways (timeouts, exit codes, normalized `{ ok, stdout, stderr }`).
- Explicit handling for “informational non-zero” exit codes where needed (e.g., `gt status`).
- Fixed formula update/delete runtime behavior inside `FormulaService` and covered it with route tests.

## Automated Testing (Evidence of Legitimacy)

This refactor is not “just moving code around” because it introduces new abstractions **and** locks down behavior:

- Unit tests validate gateways/services/value objects without requiring real CLI tools.
- Route tests spin up a real Express app with stubbed services to preserve HTTP contracts.
- Existing integration/e2e suites continue to run against the mock server.

Test inventory (current branch):

- Unit test files: 25 (`test/unit/*`)
- Integration test files: 3 (`test/integration/*`)
- E2E test files: 1 (`test/e2e.test.js`)

## Change Stats (Base → Head)

- Files changed: **71** (added 67, modified 4, deleted 0)
- Lines: **+6492 / -1010** (net **+5482**)
- Tests only: **+1523 / -2** (net **+1521**)

### Backend / Server Refactor Files

| Status | File | + | - | Net |
|---|---|---:|---:|---:|
| M | `server.js` | 120 | 991 | -871 |
| A | `server/app/createApp.js` | 26 | 0 | +26 |
| A | `server/domain/values/AgentPath.js` | 32 | 0 | +32 |
| A | `server/domain/values/SafeSegment.js` | 22 | 0 | +22 |
| A | `server/gateways/BDGateway.js` | 93 | 0 | +93 |
| A | `server/gateways/GitGateway.js` | 15 | 0 | +15 |
| A | `server/gateways/GitHubGateway.js` | 169 | 0 | +169 |
| A | `server/gateways/GTGateway.js` | 78 | 0 | +78 |
| A | `server/gateways/TmuxGateway.js` | 47 | 0 | +47 |
| A | `server/infrastructure/CacheRegistry.js` | 73 | 0 | +73 |
| A | `server/infrastructure/CommandRunner.js` | 58 | 0 | +58 |
| A | `server/infrastructure/EventBus.js` | 27 | 0 | +27 |
| A | `server/routes/beads.js` | 49 | 0 | +49 |
| A | `server/routes/convoys.js` | 42 | 0 | +42 |
| A | `server/routes/formulas.js` | 77 | 0 | +77 |
| A | `server/routes/github.js` | 60 | 0 | +60 |
| A | `server/routes/status.js` | 13 | 0 | +13 |
| A | `server/routes/targets.js` | 13 | 0 | +13 |
| A | `server/routes/work.js` | 97 | 0 | +97 |
| A | `server/services/BeadService.js` | 68 | 0 | +68 |
| A | `server/services/ConvoyService.js` | 55 | 0 | +55 |
| A | `server/services/FormulaService.js` | 145 | 0 | +145 |
| A | `server/services/GitHubService.js` | 153 | 0 | +153 |
| A | `server/services/StatusService.js` | 140 | 0 | +140 |
| A | `server/services/TargetService.js` | 78 | 0 | +78 |
| A | `server/services/WorkService.js` | 158 | 0 | +158 |

### Tests

| Status | File | + | - | Net |
|---|---|---:|---:|---:|
| M | `test/mock-server.js` | 2 | 2 | +0 |
| A | `test/unit/agentPath.test.js` | 22 | 0 | +22 |
| A | `test/unit/bdGateway.test.js` | 89 | 0 | +89 |
| A | `test/unit/beadRoutes.test.js` | 79 | 0 | +79 |
| A | `test/unit/beadService.test.js` | 72 | 0 | +72 |
| A | `test/unit/cacheRegistry.test.js` | 54 | 0 | +54 |
| A | `test/unit/commandRunner.test.js` | 48 | 0 | +48 |
| A | `test/unit/convoyRoutes.test.js` | 73 | 0 | +73 |
| A | `test/unit/convoyService.test.js` | 54 | 0 | +54 |
| A | `test/unit/eventBus.test.js` | 42 | 0 | +42 |
| A | `test/unit/formulaRoutes.test.js` | 101 | 0 | +101 |
| A | `test/unit/gitGateway.test.js` | 34 | 0 | +34 |
| A | `test/unit/githubGateway.test.js` | 58 | 0 | +58 |
| A | `test/unit/githubRoutes.test.js` | 75 | 0 | +75 |
| A | `test/unit/githubService.test.js` | 82 | 0 | +82 |
| A | `test/unit/gtGateway.test.js` | 104 | 0 | +104 |
| A | `test/unit/safeSegment.test.js` | 22 | 0 | +22 |
| A | `test/unit/statusRoutes.test.js` | 52 | 0 | +52 |
| A | `test/unit/statusService.test.js` | 119 | 0 | +119 |
| A | `test/unit/targetRoutes.test.js` | 49 | 0 | +49 |
| A | `test/unit/targetService.test.js` | 45 | 0 | +45 |
| A | `test/unit/tmuxGateway.test.js` | 62 | 0 | +62 |
| A | `test/unit/workRoutes.test.js` | 102 | 0 | +102 |
| A | `test/unit/workService.test.js` | 83 | 0 | +83 |

### Docs & Analysis Artifacts

| Status | File | + | - | Net |
|---|---|---:|---:|---:|
| A | `AGENT_HANDOFF.md` | 177 | 0 | +177 |
| M | `CLAUDE.md` | 68 | 12 | +56 |
| A | `ai-memory/refactor-a4ebe27/init.md` | 36 | 0 | +36 |
| A | `ai-memory/refactor-a4ebe27/plan.md` | 43 | 0 | +43 |
| A | `ai-memory/refactor-a4ebe27/progress.md` | 92 | 0 | +92 |
| A | `refactoring-analysis/00-SUMMARY-IMPRESSIVE-REFACTORINGS.md` | 427 | 0 | +427 |
| A | `refactoring-analysis/01-code-smells-components.md` | 197 | 0 | +197 |
| A | `refactoring-analysis/02-code-smells-modals-dashboard.md` | 206 | 0 | +206 |
| A | `refactoring-analysis/03-poeaa-server-analysis.md` | 249 | 0 | +249 |
| A | `refactoring-analysis/04-utilities-analysis.md` | 103 | 0 | +103 |
| A | `refactoring-analysis/05-RANKINGS.md` | 145 | 0 | +145 |
| A | `refactoring-analysis/06-remaining-components.md` | 64 | 0 | +64 |
| A | `refactoring-analysis/07-PROCESS-AND-KNOWLEDGE.md` | 175 | 0 | +175 |
| A | `refactoring-analysis/08-IMPLEMENTATION-PLAN.md` | 186 | 0 | +186 |
| A | `refactoring-analysis/09-IMPLEMENTATION-REPORT.md` | 82 | 0 | +82 |
| A | `refactoring-analysis/trace/README.md` | 23 | 0 | +23 |
| A | `refactoring-analysis/trace/REPORT.md` | 31 | 0 | +31 |
| A | `refactoring-analysis/trace/user-prompts.sanitized.jsonl` | 450 | 0 | +450 |
| A | `refactoring-analysis/trace/user-prompts.summary.json` | 18 | 0 | +18 |

### Scripts

| Status | File | + | - | Net |
|---|---|---:|---:|---:|
| A | `scripts/extract_user_prompts.mjs` | 288 | 0 | +288 |

### Other

| Status | File | + | - | Net |
|---|---|---:|---:|---:|
| M | `vitest.config.js` | 1 | 5 | -4 |

## “Proof” Artifacts (What’s Safe to Share)

- **Implementation narrative:** `refactoring-analysis/09-IMPLEMENTATION-REPORT.md`
- **Analysis + rankings:** `refactoring-analysis/00-SUMMARY-IMPRESSIVE-REFACTORINGS.md`, `refactoring-analysis/05-RANKINGS.md`
- **Sanitized prompt export (user prompts only, redacted):** `refactoring-analysis/trace/user-prompts.sanitized.jsonl`

Avoid pushing raw traces (`~/.codex/sessions/**` or `~/.claude/projects/**`) without an explicit secrets review.
