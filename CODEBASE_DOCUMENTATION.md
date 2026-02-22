# Gas Town GUI - Codebase Documentation

> **Keep this file current.** If you add, delete, or move files/systems, update this doc before creating a PR. Keep it token-efficient.

## Quick Navigation

```
ENTRY:    server.js - Express bridge server (gt/bd CLI → HTTP/WS)
CLI:      bin/cli.js - npx gastown-gui entry point
FRONTEND: js/ - Browser SPA (vanilla JS, no framework)
BACKEND:  server/ - Refactored backend modules (services, gateways, routes)
STYLES:   css/ - CSS custom properties + component styles
TESTS:    test/ - Vitest unit + integration, Puppeteer E2E
CONFIG:   vitest.config.js, vitest.unit.config.js, package.json
ASSETS:   assets/ - Favicons + screenshots
DOCS:     refactoring-analysis/ - Refactor plans/reports, CLI-COMPATIBILITY.md
VUE:      frontend/ - Vue 3 + Vite SPA (new frontend, replacing vanilla JS)
```

## Backend — Entry & App

```
server.js - Monolith Express server; imports refactored modules + legacy endpoints
├─ Wires gateways → services → routes
├─ WebSocket server for real-time events (gt feed)
├─ Legacy endpoints still inline: mail, agents, nudge, polecat, service controls
└─ ~1700 lines, partially refactored

server/app/createApp.js - Express app factory with CORS config
```

## Backend — Domain Values

```
server/domain/values/AgentPath.js - Validates rig/agent path pairs
└─ Enforces SafeSegment on both segments

server/domain/values/SafeSegment.js - Input sanitization for CLI args
└─ Rejects shell metacharacters, path traversal
```

## Backend — Gateways (CLI Wrappers)

```
server/gateways/GTGateway.js - Wraps gt CLI commands via execFile
├─ status, convoy, sling, mail, nudge, feed, doctor, etc.
└─ Uses CommandRunner for safe execution

server/gateways/BDGateway.js - Wraps bd (beads) CLI commands
├─ list, search, create, show, close, defer, update
└─ Maps GUI actions to current bd CLI syntax

server/gateways/GitHubGateway.js - Wraps gh CLI for PR/issue/repo queries
server/gateways/GitGateway.js - Wraps git CLI for branch info
server/gateways/TmuxGateway.js - Tmux session management for polecats
```

## Backend — Infrastructure

```
server/infrastructure/CommandRunner.js - Safe child_process.execFile wrapper
├─ Timeout, error handling, output parsing
└─ No shell execution (injection-safe)

server/infrastructure/CacheRegistry.js - TTL cache for CLI output
server/infrastructure/EventBus.js - Internal pub/sub for cache invalidation
```

## Backend — Services

```
server/services/StatusService.js - Town status aggregation
server/services/ConvoyService.js - Convoy CRUD via GTGateway
server/services/FormulaService.js - Formula CRUD + run via GTGateway
server/services/BeadService.js - Bead CRUD via BDGateway
server/services/WorkService.js - Work lifecycle (close, defer, reassign)
server/services/GitHubService.js - PR/issue/repo queries via GitHubGateway
server/services/TargetService.js - Available sling targets
```

## Backend — Routes

```
server/routes/status.js - GET /api/status, /api/health
server/routes/convoys.js - GET/POST /api/convoys, /api/convoy/:id
server/routes/formulas.js - CRUD /api/formulas, /api/formula/:name
server/routes/beads.js - CRUD /api/beads, /api/bead/:id
server/routes/work.js - POST /api/work/:id/{done,park,release,reassign}
server/routes/github.js - GET /api/github/{prs,issues,repos}
server/routes/targets.js - GET /api/targets
```

## Frontend — Core

```
js/app.js - App init, tab routing, event wiring, status polling
js/api.js - HTTP client for /api/* + WebSocket client class
js/state.js - Global reactive state store, component subscriptions
```

## Frontend — Components

```
js/components/dashboard.js - Main dashboard layout + tab switching
js/components/sidebar.js - Agent tree, service controls, stats, hook display
js/components/agent-grid.js - Agent cards with status/actions
js/components/convoy-list.js - Convoy management panel
js/components/mail-list.js - Mail inbox/compose/reply
js/components/issue-list.js - Beads/issues list with search
js/components/pr-list.js - GitHub PR list
js/components/formula-list.js - Formula editor/executor
js/components/work-list.js - Active work items display
js/components/rig-list.js - Rig management + polecat spawn/stop
js/components/crew-list.js - Crew CRUD operations
js/components/health-check.js - System health display (doctor)
js/components/activity-feed.js - Real-time event stream
js/components/modals.js - Modal dialogs (sling, nudge, compose)
js/components/onboarding.js - First-run setup wizard
js/components/tutorial.js - Interactive tutorial overlay
js/components/autocomplete.js - Search input with suggestions
js/components/toast.js - Toast notification system
```

## Frontend — Shared & Utils

```
js/shared/agent-types.js - Agent type definitions, icons, colors
js/shared/animations.js - Shared animation helpers
js/shared/beads.js - Bead domain helpers/constants
js/shared/close-reason.js - close_reason formatting
js/shared/events.js - Custom event names/bus
js/shared/github-repos.js - Bead/rig → GitHub repo mapping
js/shared/timing.js - Shared timing constants (polling, debounce)

js/utils/formatting.js - Date/number formatters
js/utils/html.js - escapeHtml, escapeAttr, truncate, capitalize
js/utils/performance.js - Debounce/throttle utilities
js/utils/tooltip.js - Tooltip positioning helpers
```

## Styles

```
css/variables.css - CSS custom properties (colors, spacing, z-index)
css/reset.css - Browser reset
css/layout.css - Grid/flex layouts, responsive breakpoints
css/components.css - Component-specific styles
css/animations.css - Transitions & keyframes
```

## Tests

```
test/setup.js - Vitest test environment setup
test/globalSetup.js - Global setup (port allocation)
test/mock-server.js - Mock Express server mimicking gt CLI responses

test/e2e.test.js - Puppeteer browser tests (real server + browser)
test/integration.test.js - Legacy integration tests
test/integration/endpoints.test.js - API endpoint contract tests
test/integration/websocket.test.js - WebSocket lifecycle tests
test/integration/cache.test.js - Cache invalidation tests

test/unit/ - 31 unit test files covering:
├─ Domain values: safeSegment, agentPath
├─ Gateways: gtGateway, bdGateway, githubGateway, gitGateway, tmuxGateway
├─ Infrastructure: cacheRegistry, commandRunner, eventBus
├─ Services: statusService, targetService, githubService, convoyService,
│            formulaService, beadService, workService
├─ Routes: statusRoutes, targetRoutes, githubRoutes, convoyRoutes,
│          formulaRoutes, beadRoutes, workRoutes
├─ Frontend: state, htmlUtils, quoteArg, formattingTime, animationsShared,
│            beadsShared, githubRepos
└─ Security: quoteArg (shell injection prevention)

test/manual/ - Manual test scripts (debug-button, onboarding, UI flow)
```

## Config & Scripts

```
package.json - Dependencies: express, cors, ws. Dev: vitest, puppeteer
vitest.config.js - Main test config (all tests)
vitest.unit.config.js - Unit-only test config
bin/cli.js - CLI entry point (gastown-gui command)
scripts/extract_user_prompts.mjs - Sanitized prompt log builder
```

## Documentation

```
CLI-COMPATIBILITY.md - gt/bd CLI command compatibility audit
refactoring-analysis/ - Refactor plans, reports, and analysis docs
refactoring-analysis/trace/ - Sanitized prompt/trace exports
```

## Frontend (Vue 3 + Vite) — `frontend/`

```
frontend/package.json - Vue 3, vue-router, pinia, vite, @vitejs/plugin-vue
frontend/vite.config.js - Vite config: proxy /api→:7667, /ws→ws://:7667
frontend/index.html - Vite entry with Google Fonts (Inter) + Material Icons
frontend/src/main.js - createApp + Pinia + Router; imports all CSS files
frontend/src/App.vue - Root layout shell: header, sidebar, router-view, activity feed, status bar, toast, modal target
frontend/src/router/index.js - 11 lazy-loaded routes

frontend/src/assets/styles/
├─ reset.css - Browser reset (ported from css/)
├─ variables.css - CSS custom properties: colors, spacing, z-index (ported from css/)
├─ layout.css - Grid/flex layouts, responsive breakpoints (ported from css/)
├─ components.css - Component-specific styles (ported from css/)
└─ animations.css - Transitions & keyframes (ported from css/)

frontend/src/utils/
├─ formatting.js - Date/number formatters (ported from js/utils/)
├─ html.js - escapeHtml, escapeAttr, truncate, capitalize (ported from js/utils/, DOM helpers removed)
└─ performance.js - Debounce, throttle, memoize, perf (ported from js/utils/, DOM classes removed)

frontend/src/constants/
├─ agent-types.js - Agent type definitions, icons, colors (ported from js/shared/, DOM badge removed)
├─ events.js - Custom event name constants (ported from js/shared/, dispatchEvent/onEvent removed)
├─ timing.js - Shared timing constants (ported from js/shared/)
├─ beads.js - Bead domain helpers/constants (ported from js/shared/)
├─ close-reason.js - close_reason formatting (ported from js/shared/, import paths updated)
├─ github-repos.js - Bead/rig → GitHub repo mapping (ported from js/shared/)
└─ animations.js - Shared animation helpers (ported from js/shared/)

frontend/src/composables/
├─ useApi.js - HTTP client for /api/* (~50 methods, ported from js/api.js REST)
├─ useWebSocket.js - WebSocket with exponential backoff reconnect + store dispatch (ported from js/api.js WS + app.js handler)
├─ usePolling.js - Periodic async callback runner with auto-cleanup on unmount
├─ useKeyboardShortcuts.js - Global keyboard shortcuts (ported from app.js lines 742-851)
├─ useToast.js - Reactive toast notification queue (ported from toast.js)
└─ useModal.js - Open/close modals via uiStore (convenience wrapper)

frontend/src/stores/
├─ statusStore.js - Town status, connection, hook (Pinia, ported from state.js + app.js)
├─ convoyStore.js - Convoy list + filter (Pinia, ported from state.js + app.js)
├─ agentStore.js - Agents + polecats (Pinia, ported from state.js + app.js)
├─ workStore.js - Beads/work items + filter (Pinia, ported from app.js)
├─ mailStore.js - Inbox, unread count, filter (Pinia, ported from state.js + app.js)
├─ eventStore.js - Activity feed, max 500 events (Pinia, ported from state.js)
└─ uiStore.js - Theme, sidebar, modal state (Pinia, ported from app.js)

frontend/src/components/layout/
├─ AppHeader.vue - Town name, mayor command bar, nav tabs, theme toggle, refresh, connection status
├─ NavTabs.vue - 11 router-link tabs with active class + mail badge
├─ MayorCommandBar.vue - Input + send + view output button
├─ MayorOutputPanel.vue - Draggable panel, auto-refresh via usePolling at 2s
├─ AppSidebar.vue - Agent tree by rig/role, service controls, hook status, stats
├─ ActivityFeed.vue - Event stream container with clear
├─ ActivityEvent.vue - Single event with agent badges + type icons
└─ StatusBar.vue - Hook status, status message, unread mail, keyboard hint

frontend/src/components/shared/
├─ AgentBadge.vue - Inline agent icon + name with role color
├─ StatusBadge.vue - Status icon + label (running/idle/error etc.)
├─ LoadingState.vue - Centered spinner + message
├─ EmptyState.vue - Icon + message + slot for actions
├─ ErrorState.vue - Error icon + message + retry button
├─ FilterGroup.vue - Toggle button group (v-model:modelValue)
├─ ToastContainer.vue - Teleported toast notifications (uses useToast)
├─ BaseModal.vue - Reusable modal wrapper (Teleport to #modal-target, v-model, Escape/overlay close)
└─ Autocomplete.vue - Generic search input with dropdown (search/renderItem/onSelect props)

frontend/src/components/modals/
├─ SlingModal.vue - Bead sling dialog (Autocomplete for bead search + target dropdown with optgroups)
├─ NewRigModal.vue - Add rig dialog (GitHub/GitLab repo picker with search/filter, local path support)
├─ PeekModal.vue - Agent output viewer (auto-refresh via usePolling at 2s, transcript tab)
├─ NewFormulaModal.vue - Formula create/edit form (name, description, template)
└─ NewCrewModal.vue - Crew create form (name, rig selection)

frontend/src/components/modals/
├─ BaseModal.vue - Teleport-based modal shell: overlay, close-on-Esc/overlay, focus trap, header/body/footer slots
├─ NewConvoyModal.vue - Create convoy form (name + issues), ported from modals.js
├─ NewBeadModal.vue - Create bead form (title, description, priority, labels), ported from modals.js
├─ MailComposeModal.vue - Compose mail form (recipient dropdown from agents, subject, message, priority), ported from modals.js
├─ HelpModal.vue - Help/glossary with tab navigation (concepts, roles, workflow, shortcuts), ported from modals.js + index.html
└─ EscalationModal.vue - Escalation form (convoy ID, reason, priority), ported from modals.js

frontend/src/components/views/
├─ DashboardView.vue - Town status overview (/)
├─ AgentsView.vue - Agent grid and status (/agents)
├─ ConvoysView.vue - Convoy management (/convoys)
├─ MailView.vue - Inbox, compose, reply (/mail)
├─ IssuesView.vue - Beads issue tracker (/issues)
├─ PrsView.vue - GitHub PR list (/prs)
├─ FormulasView.vue - Formula editor/executor (/formulas)
├─ WorkView.vue - Active work items (/work)
├─ RigsView.vue - Rig management + polecat control (/rigs)
├─ CrewsView.vue - Crew management (/crews)
└─ HealthView.vue - System health check (/health)
```

## Key Patterns

- **Gateway pattern:** CLI tools (gt, bd, gh, git, tmux) wrapped in gateway classes; services compose gateways; routes call services
- **Safe execution:** All CLI calls use `execFile` (no shell) + `SafeSegment` validation — prevents injection
- **Cache + invalidation:** `CacheRegistry` with TTL; `EventBus` triggers cache clears on mutations
- **Frontend:** Vanilla JS SPA, no build step. Components render via innerHTML, subscribe to global state
- **Service controls:** Witness/refinery require a `rig` parameter for start/stop/restart; mayor/deacon do not
