# Implementation Plan: Backend Application Core Refactor (High-Benefit, Enterprise Patterns)

## Goal (One Big Refactor)

Deliver a single, substantial refactor that:
- **Eliminates the monolithic `server.js`** as an implementation dumping ground (keeping it as the entrypoint/composition root).
- Introduces **PoEAA Gateway + Service Layer + Value Objects** in a cohesive design.
- Makes the backend **testable without `gt/bd/gh/tmux` installed** (via dependency injection + stubs).
- Fixes known runtime correctness gaps discovered in fresh audit (formula endpoints, `executeGT()` semantics).

This is intentionally not “just move files around”: it changes the architecture so the backend has a clean boundary and can evolve safely.

---

## Why This is the Highest-Benefit Refactor

**Domain fit:** This app is a *CLI bridge*. Gateway is the textbook boundary for external-system access (PoEAA).

**Risk reduction:** Today the test suite does not exercise the real backend (`server.js`). That’s a major reliability issue. This refactor makes the backend unit/integration-testable without the real CLI tools.

**Correctness wins bundled with the refactor:**
- Fix `PUT/DELETE /api/formula/:name` (broken: `require(...)` in ESM + undefined `invalidateCache()`).
- Fix `executeGT()` non-zero exit code semantics (current “useful output” branch is unreachable).

---

## Target Architecture (Ports/Adapters Style)

Keep `server.js` as the stable entrypoint, but move real logic into:

```
server/
  app/createApp.js              # Express app factory (DI friendly)
  infrastructure/
    CommandRunner.js            # Normalized exec/spawn wrapper (exit codes, timeouts)
    CacheRegistry.js            # TTL cache + in-flight dedupe
    EventBus.js                 # WebSocket broadcast abstraction
  domain/values/
    SafeSegment.js              # Validation for URL-safe identifiers
    AgentPath.js                # {rig,name} + formatting (session name, path)
  gateways/
    GTGateway.js                # wraps gt CLI
    BDGateway.js                # wraps bd CLI
    TmuxGateway.js              # wraps tmux
    GitHubGateway.js            # wraps gh
    GitGateway.js               # wraps git (remote URL, etc.)
  services/
    StatusService.js
    TargetService.js
    ConvoyService.js
    MailService.js
    BeadService.js
    WorkService.js
    PolecatService.js
    RigService.js
    CrewService.js
    DoctorService.js
    FormulaService.js           # includes file-based update/delete
    GitHubService.js
    ActivityStreamService.js    # gt feed -> WS events
  routes/
    index.js                    # mount routes, thin adapters only
    ...                         # per-domain route modules
```

Key idea: **routes are adapters**. They validate HTTP inputs and call services. Services coordinate operations (cache, events). Gateways talk to external tools.

---

## Testing Strategy (TDD-Friendly, But Keep Every Push Green)

### What to add (so server code is actually covered)

1. **Unit tests for `domain/values/*`**
   - `SafeSegment` and `AgentPath` validation and formatting.

2. **Unit tests for `infrastructure/CommandRunner`**
   - timeout behavior
   - exit code handling (including “allowed exit codes” like `[0,1]`)
   - stdout/stderr normalization

3. **Unit tests for Gateways (no real CLI)**
   - Inject a fake runner, assert the gateway builds the correct `cmd + args`.

4. **Route/service integration tests without CLI**
   - Export `createApp({ services })` and start on an ephemeral port in tests.
   - Use stub services/gateways to verify:
     - status codes and JSON shape,
     - caching/dedup behavior where relevant,
     - error mapping (400 vs 500),
     - regression coverage for the formula update/delete bug.

### Notes on TDD + pushing

Classic TDD “RED commits” are great locally, but **pushing failing commits** is usually noisy. Plan: do Red/Green/Refactor locally, but push only green states (tests passing).

---

## Implementation Phases (Incremental, Low-Risk Migration)

Each phase should land with **`npm test` green**, and should be committed + pushed.

### Phase 0 — Hygiene + Baseline
- Run `npm test` to establish a green baseline.
- Remove Vitest v4 deprecation (`poolOptions`) so test output is clean.

### Phase 1 — Build the “Core” Plumbing
- Add `server/app/createApp.js` that builds the Express app without starting the listener.
- Add `server/infrastructure/EventBus.js` (wrap existing `broadcast()` behavior).
- Add `server/infrastructure/CacheRegistry.js` (TTL + in-flight dedupe in one place).
- Add `server/infrastructure/CommandRunner.js` (normalized exec/spawn, `allowExitCodes`).
- Add tests for these modules.

### Phase 2 — Gateways (Ports to External Tools)
- Implement `GTGateway`, `BDGateway`, `TmuxGateway`, `GitHubGateway`, `GitGateway` on top of `CommandRunner`.
- Focus on the commands already used by endpoints (don’t invent new surface area).
- Add gateway unit tests to lock in command construction and error handling.

### Phase 3 — Domain Value Objects (Remove Primitive Obsession)
- Implement `SafeSegment` and `AgentPath` (and optionally `RigName`, `BeadId`) as immutable value objects.
- Replace `validateRigAndName()` and stringly session-name construction with value objects in the new services/routes.
- Add unit tests for tricky validation edges.

### Phase 4 — Service Layer (Application Boundary)
Start with the highest leverage + easiest to validate:
- `FormulaService` (fix update/delete correctness + cache invalidation)
- `StatusService` (central status retrieval + rig config enrichment + tmux running state)
- `TargetService` (derive targets from status; stops duplicating status calls)

Then expand:
- `ConvoyService`, `MailService`, `BeadService`, `WorkService`, `PolecatService`, `RigService`, `CrewService`, `DoctorService`, `GitHubService`

### Phase 5 — Route Modules (Thin Adapters)
- Introduce `server/routes/*` modules and migrate endpoints in slices:
  1) status/targets/agents
  2) polecat + mayor
  3) beads/work
  4) convoys/sling/escalate
  5) rigs/crews/doctor/setup
  6) formulas
  7) github
- Keep the **public API contract** stable (URLs + response shapes) unless there’s a deliberate, documented change.

### Phase 6 — WebSocket Activity Stream
- Move `gt feed --follow` logic to `ActivityStreamService`.
- Make it start/stop based on connected client count (same behavior as today).
- Add a small unit test around parsing (`parseActivityLine`) and start/stop behavior via stubs.

### Phase 7 — Cleanup + Documentation
- Shrink root `server.js` into:
  - dependency wiring (composition root),
  - `server.listen(...)`,
  - graceful shutdown.
- Remove now-dead helpers (`executeGT`, `executeBD`, duplicate parsers) once all routes are migrated.
- Update `CLAUDE.md` Architecture section to reflect the new server layout.

---

## Acceptance Criteria (“Done”)

- `npm test` passes.
- `server.js` is a thin entrypoint and `server/` contains the real implementation.
- External tool calls are routed through gateways (no scattered `execFileAsync('gt'|'bd'|'tmux'|'gh'|'git')`).
- Formula update/delete endpoints work and are covered by tests.
- New backend tests exist that would fail if the old runtime bugs reappear.

