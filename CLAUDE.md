# CLAUDE.md - Gas Town GUI

Web GUI for [steveyegge/gastown](https://github.com/steveyegge/gastown) multi-agent orchestrator.

## Commands

```bash
npm start          # Start server (port 4000)
npm run dev        # Dev mode with auto-reload
npm test           # Run all tests (206 tests)
npm run test:unit  # Unit tests only
npm run test:e2e   # E2E tests only
```

## Architecture

```
gastown-gui/
├── server.js           # Express server + all API endpoints (~1400 lines)
├── js/
│   ├── api.js          # Frontend API client
│   ├── app.js          # Main app initialization
│   ├── state.js        # Global state management
│   ├── components/     # UI components (18 files)
│   │   ├── agent-grid.js
│   │   ├── rig-list.js
│   │   ├── crew-list.js
│   │   ├── mail-list.js
│   │   └── ...
│   ├── shared/         # Shared utilities
│   └── utils/          # Helper functions
├── test/
│   ├── unit/           # Unit tests (53)
│   ├── integration/    # Integration tests (129)
│   └── e2e.test.js     # E2E tests (24)
└── public/             # Static assets (CSS, icons)
```

## Key Patterns

**API Pattern:** GUI wraps `gt` CLI commands as HTTP endpoints
- `GET /api/status` → `gt status --json --fast`
- `POST /api/sling` → `gt sling`
- `POST /api/polecat/:rig/:name/start` → `gt polecat spawn`
- `POST /api/polecat/:rig/:name/stop` → tmux kill

**State:** Global state in `js/state.js`, components subscribe to updates

## Feature Status

| Feature | Status |
|---------|--------|
| Convoy Management | ✅ Create/list |
| Sling Work | ✅ Basic |
| Beads/Issues | ✅ Full CRUD |
| Mail | ✅ Full |
| GitHub Integration | ✅ Full |
| Polecat Control | ✅ spawn/stop/restart |
| Crew Management | ✅ Create/List/View |
| Rig Management | ✅ Create/List/Delete |
| Formula Editor | ✅ Create/List/Use |
| Agent Config | ❌ List only (90% missing) |

## When to Use GUI vs CLI

**Use GUI for:**
- Monitor work progress
- Create/track convoys
- View agent output
- Check system health
- Send mail/nudges

**Use CLI for:**
- Agent configuration
- Advanced polecat management
- Creating formulas

## Testing

- **206 tests** total (unit: 53, integration: 129, e2e: 24)
- **61 API endpoints** - all tested (100% coverage)
- CI runs on Node 18, 20, 22
