# CLAUDE.md - Gas Town GUI

Web GUI for [steveyegge/gastown](https://github.com/steveyegge/gastown) multi-agent orchestrator.

## READ THESE ENTIRE DOCUMENTS BEFORE DOING ANYTHING

1. **Read `CODEBASE_DOCUMENTATION.md` NOW** — Complete file inventory. Do NOT grep blindly for files. Read this first so you know where everything lives.
2. **Read `CLI-COMPATIBILITY.md`** — Which gt/bd commands work, which are broken/remapped. Critical if touching any CLI calls.

> **Update before PR:** If you added/deleted/moved files, update CODEBASE_DOCUMENTATION.md.

## Overview

Browser SPA backed by an Express server that wraps `gt`/`bd` CLI commands as HTTP endpoints. WebSocket streams real-time events from `gt feed`. Published to npm as `gastown-gui`.

## Architecture

### Backend (Express + WebSocket)

- **Entry:** `server.js` — monolith Express server, partially refactored into `server/` modules
- **Refactored path:** Gateway → Service → Route (see `server/gateways/`, `server/services/`, `server/routes/`)
- **Legacy endpoints:** Mail, agents, nudge, polecat control, service controls still inline in `server.js`
- **CLI safety:** All commands use `execFile` (no shell) + `SafeSegment` input validation
- **Real-time:** WebSocket server pipes `gt feed --json` output to clients
- **CLI entry:** `bin/cli.js` — supports `start`, `doctor`, `version`, `help`

### Frontend (Vue 3 + Vite)

- **Location:** `frontend/` — Vue 3 SPA with Vite build tooling
- **State:** Pinia stores (`frontend/src/stores/`) — status, convoy, agent, work, mail, event, ui
- **Routing:** Vue Router with 11 lazy-loaded routes (`frontend/src/router/`)
- **API layer:** Composables (`frontend/src/composables/`) — useApi, useWebSocket, usePolling, etc.
- **Components:** Organized by concern — `layout/`, `views/`, `shared/`, `modals/`
- **Build output:** `dist/` — served by Express in production
- **Dev server:** Vite dev server at `:5173` proxies `/api` and `/ws` to Express at `:7667`

### Legacy Frontend (Archived)

- **Location:** `legacy/` — original vanilla JS frontend (archived, no longer actively maintained)
- **Fallback:** Server falls back to `legacy/` if no `dist/` build exists

## Commands

```bash
npm start              # Start server (port 7667)
npm run dev            # Dev mode with auto-reload
npm run dev:frontend   # Vue dev server with hot reload
npm run build:frontend # Build Vue app → dist/
npm test               # All backend tests (unit + integration + e2e)
npm run test:unit      # Backend unit tests only
npm run test:e2e       # E2E tests only (needs Puppeteer)
npm run test:watch     # Watch mode
npm run test:ui        # Vitest UI
npm run test:frontend  # Vue frontend tests
```

## Testing

- **Vitest** for unit + integration, **Puppeteer** for E2E
- Unit tests use dependency injection (mock gateways/services)
- Route tests use real Express app with mocked services
- Integration tests hit `test/mock-server.js` (mimics gt CLI responses)
- E2E tests start real server + Chromium browser
- Frontend tests in `frontend/` use Vitest + happy-dom + Vue Test Utils
- `npm test` runs everything via `prepublishOnly` before npm publish

## Gotchas

1. **Witness/refinery need rig:** Service start/stop/restart for `witness` and `refinery` require a `rig` parameter in the request body. Mayor/deacon do not. Server returns 400 if missing.
2. **CLI renames:** Several gt/bd commands were renamed upstream. See `CLI-COMPATIBILITY.md` for the full mapping. Key ones: `formula use` → `formula run --rig`, `bd done` → `bd close`, `bd park` → `bd defer`.
3. **Port 7667:** Default port via `GASTOWN_PORT` env var. The CLI (`bin/cli.js`) also accepts `--port`.
4. **Vue frontend needs build:** Run `npm run build:frontend` to generate `dist/`. Without it, Express falls back to legacy vanilla JS in `legacy/`.
5. **server.js is partially refactored:** Some endpoints moved to `server/routes/`, others still inline (~1700 lines). Don't duplicate — check both before adding endpoints.
6. **SafeSegment rejects metacharacters:** Any rig/agent name with shell-special chars will be rejected. This is intentional security.
7. **Mock server must match real server:** When adding/changing endpoints, update both `server.js` (or routes) AND `test/mock-server.js`.
8. **Legacy files in legacy/:** The original vanilla JS frontend (js/, css/, index.html) has been moved to `legacy/`. New frontend work goes in `frontend/`.
