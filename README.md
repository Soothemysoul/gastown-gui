# Gas Town GUI

A standalone web GUI for [Gas Town](https://github.com/steveyegge/gastown) - the multi-agent orchestration system for Claude Code.

![Gas Town GUI Screenshot](assets/screenshot.png)

![Gas Town Loading Screen](assets/loading-background.jpeg)

> **Note:** This is an independent companion project, not part of the official Gas Town repository. Originally submitted as [PR #212](https://github.com/steveyegge/gastown/pull/212), now maintained as a standalone package per Steve's recommendation.

> *"Thank you for the impressive work on this GUI! The effort and thought that went into it is clear - the architecture is clean, the documentation is thorough, and it demonstrates a solid understanding of Gas Town's workflow. [...] If you're interested in continuing this work, I'd encourage publishing it as a standalone companion project."*
>
> — **Steve Yegge**, creator of Gas Town ([PR #212 comment](https://github.com/steveyegge/gastown/pull/212))

**Status:** Active development - Vue 3 frontend with Express backend.

---

## Quick Start

### 1. Install Prerequisites

```bash
# Gas Town CLI (required)
npm install -g @gastown/gt
# Or: go install github.com/steveyegge/gastown/cmd/gt@latest

# GitHub CLI (optional, for PR tracking)
gh auth login
```

### 2. Install Gas Town GUI

```bash
# Via npm (recommended)
npm install -g gastown-gui

# Or from source
git clone https://github.com/web3dev1337/gastown-gui.git
cd gastown-gui
npm install
npm link
```

### 3. Start the GUI

```bash
gastown-gui start --open
```

Opens `http://localhost:7667` in your browser.

### 4. Verify Setup

```bash
gastown-gui doctor
```

---

## Architecture

```
gastown-gui/
├── frontend/           # Vue 3 + Vite SPA (primary frontend)
│   ├── src/
│   │   ├── components/ # Vue components (layout, views, shared, modals)
│   │   ├── stores/     # Pinia state management
│   │   ├── composables/# Reusable composition functions
│   │   ├── constants/  # Shared constants & helpers
│   │   ├── utils/      # Formatting, HTML, performance utils
│   │   └── router/     # Vue Router with lazy-loaded routes
│   └── vite.config.js  # Vite build config (outputs to ../dist/)
├── server.js           # Express + WebSocket server (gt/bd CLI bridge)
├── server/             # Refactored backend modules
│   ├── gateways/       # CLI wrappers (gt, bd, gh, git, tmux)
│   ├── services/       # Business logic layer
│   ├── routes/         # Express route handlers
│   ├── infrastructure/ # CommandRunner, CacheRegistry, EventBus
│   ├── domain/values/  # SafeSegment, AgentPath validation
│   └── app/            # Express app factory
├── legacy/             # Archived vanilla JS frontend
│   ├── js/             # Original vanilla JS components
│   ├── css/            # Original stylesheets
│   └── index.html      # Original HTML entry point
├── test/               # Vitest + Puppeteer tests
└── bin/cli.js          # CLI entry point
```

### Tech Stack

- **Backend:** Node.js + Express + WebSocket
- **Frontend:** Vue 3 + Vite + Pinia + Vue Router
- **Communication:** WebSocket for real-time updates, REST for CRUD
- **Testing:** Vitest (unit/integration) + Puppeteer (E2E)

### Design Principles

1. **Server-Authoritative** - All operations execute via `gt` and `bd` CLI commands
2. **Non-Blocking UI** - Modals close immediately, operations run in background
3. **Real-Time Updates** - WebSocket broadcasts status changes to all clients
4. **Graceful Degradation** - UI handles missing data and command failures
5. **Cache & Refresh** - Background data preloading with stale-while-revalidate

---

## Development

### Backend (Express Server)

```bash
npm start              # Start server (port 7667)
npm run dev            # Dev mode with auto-reload
```

### Frontend (Vue 3 + Vite)

```bash
# Start Vue dev server with hot reload (proxies API to Express)
npm run dev:frontend

# Build Vue app for production (outputs to dist/)
npm run build:frontend

# Run frontend tests
npm run test:frontend
```

See [`frontend/README.md`](frontend/README.md) for detailed Vue development guide.

### Full Development Workflow

1. Start the Express backend: `npm run dev`
2. In another terminal, start the Vue dev server: `npm run dev:frontend`
3. Open `http://localhost:5173` (Vite dev server with hot reload)

For production, build the frontend and serve via Express:
```bash
npm run build:frontend   # Build Vue app → dist/
npm start                # Express serves dist/ automatically
```

---

## Testing

```bash
npm test               # All backend tests (unit + integration + E2E)
npm run test:unit      # Backend unit tests only
npm run test:e2e       # E2E tests (needs Puppeteer)
npm run test:watch     # Watch mode
npm run test:frontend  # Vue frontend tests
```

---

## Features

- **Rig Management** - Add, view, and organize project repositories
- **Work Tracking** - Create and manage work items (beads)
- **Task Assignment** - Sling work to rigs and agents
- **Real-Time Updates** - Live WebSocket updates for all operations
- **PR Tracking** - View GitHub pull requests across projects
- **Mail Inbox** - Read messages from agents and polecats
- **Health Monitoring** - Run doctor checks and view system status

---

## CLI Usage

```bash
# Start server (default port 7667)
gastown-gui

# Custom port
gastown-gui start --port 4000

# Open browser automatically
gastown-gui start --open

# Development mode
gastown-gui start --dev

# Check prerequisites
gastown-gui doctor

# Show version
gastown-gui version

# Show help
gastown-gui help
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port, -p` | Server port | 7667 |
| `--host, -h` | Server host | 127.0.0.1 |
| `--open, -o` | Open browser | false |
| `--dev` | Development mode | false |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GASTOWN_PORT` | Server port | 7667 |
| `HOST` | Server host | 127.0.0.1 |
| `GT_ROOT` | Gas Town root directory | ~/gt |

---

## API Endpoints

| Method | Endpoint | Description | CLI Command |
|--------|----------|-------------|-------------|
| GET | `/api/status` | System status | `gt status --json` |
| GET | `/api/rigs` | List rigs | `gt rig list` |
| POST | `/api/rigs` | Add rig | `gt rig add` |
| GET | `/api/work` | List work items | `bd list` |
| POST | `/api/work` | Create work | `bd new` |
| POST | `/api/sling` | Sling work | `gt sling` |
| GET | `/api/prs` | GitHub PRs | `gh pr list` |
| GET | `/api/mail` | Mail inbox | `gt mail inbox` |
| GET | `/api/doctor` | Health check | `gt doctor` |

---

## Compatibility

- **Gas Town:** v0.2.x and later
- **Node.js:** 18, 20, 22
- **Browsers:** Chrome, Firefox, Safari (latest)

The GUI calls CLI commands via subprocess, so it should work with any Gas Town version that has compatible CLI output.

---

## Contributing

Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Update `CLAUDE.md`** if you add, rename, or delete files
5. Test locally (start server with `npm start`, verify in browser)
6. Run automated tests: `npm test`
7. Submit a pull request

### Looking for Maintainers

We're looking for maintainers to help review and merge PRs. If you're interested in helping maintain this project, please open an issue or reach out!

---

## License

MIT

---

## Credits

- **Gas Town:** [steveyegge/gastown](https://github.com/steveyegge/gastown) by Steve Yegge
- **GUI Implementation:** Built with Claude Code
- **Original PR:** [#212](https://github.com/steveyegge/gastown/pull/212)

### Contributors

Thanks to these community members who contributed to the original PR through testing, comments, and recommended fixes:

- [@gsxdsm](https://github.com/gsxdsm)
- [@michaellady](https://github.com/michaellady)
- [@olivierlefloch](https://github.com/olivierlefloch)
- [@zalo](https://github.com/zalo)
- [@irelandpaul](https://github.com/irelandpaul)

---

**Disclaimer:** This is an independent community project, not officially affiliated with Gas Town. Use at your own risk.
