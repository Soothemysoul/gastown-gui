# Gas Town GUI — Vue Frontend

Vue 3 + Vite SPA for the Gas Town GUI. This is the primary frontend, replacing the legacy vanilla JS interface.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (hot reload, proxies API to Express backend)
npm run dev

# Build for production (outputs to ../dist/)
npm run build
```

The dev server runs at `http://localhost:5173` and proxies `/api` and `/ws` requests to the Express backend at `http://localhost:7667`.

## Development Workflow

1. Start the Express backend from the project root:
   ```bash
   npm run dev          # from project root
   ```

2. Start the Vue dev server:
   ```bash
   npm run dev          # from frontend/
   # — or from project root —
   npm run dev:frontend
   ```

3. Open `http://localhost:5173` for hot-reload development.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API) |
| Build tool | Vite 6 |
| State management | Pinia |
| Routing | Vue Router 4 (lazy-loaded routes) |
| Testing | Vitest + happy-dom + Vue Test Utils |

## Project Structure

```
frontend/
├── index.html              # Vite entry (Google Fonts, Material Icons)
├── vite.config.js          # Build config: proxy /api→:7667, output → ../dist/
├── vitest.config.js        # Test config (happy-dom, Vue plugin)
├── src/
│   ├── main.js             # createApp + Pinia + Router
│   ├── App.vue             # Root layout: header, sidebar, router-view, feeds
│   ├── router/index.js     # 11 lazy-loaded routes
│   ├── stores/             # Pinia stores
│   │   ├── statusStore.js  # Town status, connection, hook
│   │   ├── convoyStore.js  # Convoy list + filter
│   │   ├── agentStore.js   # Agents + polecats
│   │   ├── workStore.js    # Beads/work items + filter
│   │   ├── mailStore.js    # Inbox, unread count, filter
│   │   ├── eventStore.js   # Activity feed (max 500 events)
│   │   └── uiStore.js      # Theme, sidebar, modal state
│   ├── composables/        # Reusable composition functions
│   │   ├── useApi.js       # HTTP client (~50 methods)
│   │   ├── useWebSocket.js # WS with exponential backoff
│   │   ├── usePolling.js   # Auto-cleanup periodic runner
│   │   ├── useKeyboardShortcuts.js
│   │   ├── useToast.js     # Toast notification queue
│   │   └── useModal.js     # Modal open/close via uiStore
│   ├── components/
│   │   ├── layout/         # AppHeader, NavTabs, Sidebar, StatusBar, etc.
│   │   ├── views/          # Page components (Dashboard, Agents, Work, etc.)
│   │   ├── shared/         # Reusable UI (badges, modals, loading states)
│   │   └── modals/         # Dialog components (16 modals)
│   ├── constants/          # Shared constants (agent-types, events, timing)
│   ├── utils/              # Formatting, HTML, performance helpers
│   └── assets/styles/      # CSS (variables, reset, layout, components, animations)
```

## Routes

| Path | View | Description |
|------|------|-------------|
| `/` | DashboardView | Town status overview, metrics, quick actions |
| `/agents` | AgentsView | Agent grid with role filter |
| `/convoys` | ConvoysView | Convoy list with active/all filter |
| `/work` | WorkView | Work items with status filter |
| `/mail` | MailView | Inbox with compose |
| `/issues` | IssuesView | GitHub issues |
| `/prs` | PrsView | GitHub PRs |
| `/formulas` | FormulasView | Formula editor/executor |
| `/rigs` | RigsView | Rig management + agent controls |
| `/crews` | CrewsView | Crew management |
| `/health` | HealthView | Doctor diagnostics |

## Testing

```bash
# Run all frontend tests
npx vitest run

# Watch mode
npx vitest watch

# From project root
npm run test:frontend
```

Tests use happy-dom for DOM simulation and Vue Test Utils for component testing. Store tests cover all 7 Pinia stores; composable tests cover useApi, useToast, usePolling, and useModal.

## Build

```bash
npm run build
```

Outputs to `../dist/` (project root `dist/` directory). The Express server automatically serves `dist/` in production when it exists.
