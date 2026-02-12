# PoEAA Analysis: server.js (2542 lines)

## Executive Summary

The server.js is a **monolithic Express server** bridging browser UI to CLI tools (`gt` and `bd`). It has **no separation of concerns** - domain logic, data access, and presentation are intermingled.

## Current Architecture Problems

1. **Single 2542-line file** with 61 API endpoints
2. **CLI commands scattered** - `executeGT()` called ~45 times, `executeBD()` ~15 times
3. **No domain model** - raw JSON objects passed everywhere
4. **Duplicated patterns** - same cache-check-execute-respond pattern ~20 times

---

## Correctness & Test Gaps (Fresh Audit Findings)

These issues are **high severity** because they can break production behavior while CI stays green.

1. **The current test suite does not execute `server.js`.**
   - `vitest` spins up `test/mock-server.js` via `test/globalSetup.js` and all HTTP/E2E tests talk to that mock server.
   - Result: `server.js` can regress (or be partially broken) without any test failures.

2. **`executeGT()` has an unreachable “non-zero but useful output” success path.**
   - The code intends to treat commands like `gt doctor` as “successful” when they return non-zero exit codes but still produce meaningful output.
   - Today `looksLikeError` includes `|| error.code !== 0`, which makes it **always true in the catch block**, so the “treat as success” branch can never run.

3. **Formula update/delete endpoints are currently broken at runtime.**
   - `PUT /api/formula/:name` and `DELETE /api/formula/:name` use `require(...)` inside an ESM file and call an undefined `invalidateCache()`.
   - These endpoints will 500 when hit, but tests won’t catch it because they don’t run the real server.

4. **Direct external tool calls still bypass the existing helpers.**
   - Some areas call `execFileAsync('gh' | 'git' | 'tmux', ...)` directly instead of going through a single normalization layer, making behavior inconsistent and hard to stub.

These findings increase the ROI of the proposed **Gateway + Service Layer** refactor because we can:
- centralize process execution and exit-code semantics in one place,
- remove known runtime breakages (formulas) while building the new architecture,
- and add meaningful backend tests that don’t require `gt/bd/gh/tmux` to be installed.

---

## HIGH IMPACT PoEAA Patterns Applicable

### 1. Gateway Pattern (Martin Fowler p.466)

**Problem:** External CLI access scattered throughout 60+ locations.

**Pattern:** Encapsulate access to external systems behind a simple object interface.

**Current scattered code:**
```javascript
// Found in ~45 places
const result = await executeGT(['convoy', 'list', '--json']);
const data = parseJSON(result.data) || [];
```

**Proposed Gateway:**
```javascript
// gateways/GTGateway.js
class GTGateway {
  async listConvoys(options = {}) {
    const args = ['convoy', 'list', '--json'];
    if (options.all) args.push('--all');
    return this.execute(args).then(this.parseJSON);
  }

  async createConvoy(name, issues, notify) { /* ... */ }
  async getStatus(fast = true) { /* ... */ }
  async startService(name) { /* ... */ }
}
```

**Impact:** ~800 lines consolidated into 4 gateway classes
**Why Impressive:** Creates a clean abstraction boundary - the app doesn't need to know CLI syntax

---

### 2. Service Layer Pattern (Martin Fowler p.133)

**Problem:** Business logic embedded directly in Express route handlers.

**Pattern:** Define application boundary with available operations that coordinate responses.

**Current Transaction Script in handler:**
```javascript
app.post('/api/convoy', async (req, res) => {
  const { name, issues, notify } = req.body;
  const args = ['convoy', 'create', name, ...(issues || [])];
  if (notify) args.push('--notify', notify);
  const result = await executeGT(args);
  if (result.success) {
    const match = result.data.match(/Created convoy: (\S+)/i);
    broadcast({ type: 'convoy_created', data: { convoy_id: match[1] } });
    res.json({ success: true, convoy_id: match[1] });
  } else {
    res.status(500).json({ error: result.error });
  }
});
```

**Proposed Service Layer:**
```javascript
// services/ConvoyService.js
class ConvoyService {
  constructor(gtGateway, eventBus) {
    this.gateway = gtGateway;
    this.events = eventBus;
  }

  async create(name, issues = [], notify = null) {
    const result = await this.gateway.createConvoy(name, issues, notify);
    if (result.success) {
      this.events.emit('convoy_created', { convoyId: result.convoyId, name });
    }
    return result;
  }

  async list(options = {}) { /* ... */ }
  async get(id) { /* ... */ }
}

// Route becomes thin adapter
app.post('/api/convoy', async (req, res) => {
  const result = await convoyService.create(req.body.name, req.body.issues, req.body.notify);
  result.success ? res.json(result) : res.status(500).json({ error: result.error });
});
```

**Impact:** Business logic testable without HTTP, clear application boundary
**Why Impressive:** Separates "what the app does" from "how it's accessed"

---

### 3. Value Object Pattern (Martin Fowler p.486)

**Problem:** Primitive strings used for domain identifiers with validation scattered.

**Current validation scattered:**
```javascript
// Lines 198-213 - validation logic
const SAFE_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
function isSafeSegment(value) { /* ... */ }
function validateRigAndName(req, res) { /* ... */ }

// Session name constructed ~10 places
const sessionName = `gt-${rig}-${name}`;

// Agent path constructed ~8 places
const agentPath = `${rig}/${name}`;
```

**Proposed Value Objects:**
```javascript
// domain/values/AgentPath.js
class AgentPath {
  constructor(rig, name) {
    this.rig = new RigName(rig);   // Validates on construction
    this.name = new AgentName(name);
  }

  toSessionName() { return `gt-${this.rig}-${this.name}`; }
  toString() { return `${this.rig}/${this.name}`; }
  equals(other) { return this.toString() === other.toString(); }
}

// Usage becomes:
const agent = new AgentPath(req.params.rig, req.params.name);
const sessionName = agent.toSessionName();
```

**Impact:** Validation centralized, type safety, immutable identifiers
**Why Impressive:** Demonstrates domain modeling - treating identifiers as first-class concepts

---

### 4. Registry Pattern (Martin Fowler p.480)

**Problem:** Cache is a module-level Map with access scattered throughout.

**Proposed Registry:**
```javascript
// infrastructure/CacheRegistry.js
class CacheRegistry {
  static instance = new CacheRegistry();

  getOrExecute(key, executor, ttl) {
    const cached = this.get(key);
    if (cached) return Promise.resolve(cached);

    // Deduplicate concurrent requests
    if (this.pending.has(key)) return this.pending.get(key);

    const promise = executor().then(data => {
      this.set(key, data, ttl);
      return data;
    }).finally(() => this.pending.delete(key));

    this.pending.set(key, promise);
    return promise;
  }
}
```

**Why Impressive:** Single well-known object for cache lookup with request deduplication built-in

---

## Estimated Impact

| Refactoring | Lines Reduced | Testability | Impressiveness |
|-------------|---------------|-------------|----------------|
| Gateway Pattern | ~400 | HIGH | HIGH |
| Service Layer | ~400 | HIGH | HIGH |
| Value Objects | ~80 | MEDIUM | MEDIUM |
| Cache Registry | ~50 | MEDIUM | MEDIUM |
| **Total** | **~930** | | |

**Current:** 2542 lines in 1 file
**After:** ~1600 lines across ~20 well-organized files

---

## Proposed Final Architecture

```
server/
├── server.js                 # Slim entry (~200 lines)
├── gateways/
│   ├── GTGateway.js          # Gas Town CLI
│   ├── BDGateway.js          # Beads CLI
│   ├── TmuxGateway.js        # Session management
│   └── GitHubGateway.js      # gh CLI
├── services/
│   ├── ConvoyService.js
│   ├── MailService.js
│   ├── BeadService.js
│   ├── AgentService.js
│   └── FormulaService.js
├── domain/
│   └── values/
│       ├── AgentPath.js
│       ├── BeadId.js
│       └── RigName.js
└── infrastructure/
    ├── CacheRegistry.js
    └── EventBus.js
```

This represents a **genuine architectural transformation**, not just file reorganization.
