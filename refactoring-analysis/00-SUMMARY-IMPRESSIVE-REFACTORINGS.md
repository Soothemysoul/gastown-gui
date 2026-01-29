# Impressive Refactoring Opportunities

## Codebase: Gas Town GUI
**Purpose:** Web interface bridging browser UI to `gt` (Gas Town) and `bd` (Beads) CLI tools

---

## Why These Refactorings Make Sense

This application is fundamentally a **CLI bridge** - it wraps command-line tools with a web interface. The current 2542-line server.js has CLI execution logic scattered across 60+ locations. The patterns below aren't just impressive - they're **exactly what this codebase needs**.

---

## 1. Gateway Pattern - PERFECT FIT

**Martin Fowler PoEAA p.466:** "Encapsulate access to an external system behind a simple object interface."

### Why It's Perfect Here
This application's **entire purpose** is accessing external CLI tools. Currently:
- `executeGT()` is called ~45 times with different command combinations
- `executeBD()` is called ~15 times
- `execFileAsync('tmux', ...)` ~10 times
- `execFileAsync('gh', ...)` ~8 times

Each call site rebuilds command arguments, parses output differently, handles errors inconsistently.

### The Abstraction

```javascript
// gateways/GTGateway.js
export class GTGateway {
  // Instead of: executeGT(['convoy', 'list', '--json', '--all'])
  async listConvoys({ all = false, status } = {}) {
    const args = ['convoy', 'list', '--json'];
    if (all) args.push('--all');
    if (status) args.push(`--status=${status}`);

    const result = await this.execute(args);
    return result.success ? this.parseJSON(result.data) : [];
  }

  // Instead of: executeGT(['polecat', 'spawn', `${rig}/${name}`])
  async spawnPolecat(agentPath) {
    return this.execute(['polecat', 'spawn', agentPath.toString()]);
  }

  // All gt commands go through here
  async execute(args, options = {}) {
    const result = await execFileAsync('gt', args, {
      cwd: this.gtRoot,
      timeout: options.timeout || 30000,
    });
    return this.normalizeResult(result);
  }
}
```

### Impact
- **~400 lines** of scattered CLI logic → 4 focused gateway classes
- **Testable:** Can stub gateway in tests without running actual CLI
- **Type-safe:** Gateway methods have explicit parameters instead of string arrays
- **Consistent:** Error handling and output parsing in one place

### Benefits
1. **Testability:** Can stub gateway in unit tests - no actual CLI execution needed
2. **Consistency:** Error handling, timeouts, and output parsing in ONE place
3. **Discoverability:** "What CLI commands does this app use?" → Look at gateway methods
4. **Maintainability:** CLI syntax changes? Update one place, not 45
5. **Type Safety:** `gateway.listConvoys({all: true})` vs `executeGT(['convoy', 'list', '--json', '--all'])`

### Impressiveness Rating: ⭐⭐⭐⭐⭐
This is the textbook use case for Gateway pattern. It's not just impressive - it's the **correct** solution.

---

## 2. Service Layer - DOMAIN OPERATIONS

**Martin Fowler PoEAA p.133:** "Define an application's boundary with a layer of services that establishes available operations."

### Why It Makes Sense Here
The application has clear domain operations:
- **Convoy Operations:** create, list, get status
- **Mail Operations:** inbox, send, mark read/unread
- **Bead Operations:** create, search, list, show, done, park
- **Agent Operations:** list, start, stop, restart, get output

Currently these are **Transaction Scripts** embedded in Express handlers - mixing HTTP concerns with business logic.

### The Abstraction

```javascript
// services/ConvoyService.js
export class ConvoyService {
  constructor(gtGateway, eventBus, cache) {
    this.gateway = gtGateway;
    this.events = eventBus;
    this.cache = cache;
  }

  async create(name, issues = [], notify = null) {
    const result = await this.gateway.createConvoy(name, issues, notify);

    if (result.success) {
      this.cache.invalidate('convoys');
      this.events.emit('convoy_created', {
        convoyId: result.convoyId,
        name
      });
    }

    return result;
  }

  async list(options = {}) {
    const cacheKey = `convoys:${options.all || false}:${options.status || 'all'}`;

    return this.cache.getOrExecute(
      cacheKey,
      () => this.gateway.listConvoys(options),
      10000 // 10 second TTL
    );
  }
}

// Route handler becomes thin
app.post('/api/convoy', async (req, res) => {
  const { name, issues, notify } = req.body;
  const result = await convoyService.create(name, issues, notify);

  result.success
    ? res.json(result)
    : res.status(500).json({ error: result.error });
});
```

### Impact
- **Business logic testable** without HTTP layer
- **Clear API boundary** - what can the application do?
- **Consistent caching** and event emission
- **~300 lines** moved from handlers to services

### Benefits
1. **Testability:** Test business logic without Express - just call service methods
2. **Reusability:** CLI tool, web UI, or future API can all use same services
3. **Single Responsibility:** Routes handle HTTP, services handle business logic
4. **Transaction Boundaries:** Service methods = transaction boundaries (cache invalidation, events)
5. **Documentation:** Service interface IS the API documentation

### Impressiveness Rating: ⭐⭐⭐⭐
Solid enterprise pattern, but less dramatic than Gateway since the domain is relatively thin.

---

## 3. Value Objects - DOMAIN IDENTIFIERS

**Martin Fowler PoEAA p.486:** "A small simple object whose equality is based on value rather than identity."

### Why It Makes Sense Here
The codebase has several **domain concepts masquerading as primitives**:

```javascript
// Currently scattered everywhere:
const sessionName = `gt-${rig}-${name}`;  // 10 places
const agentPath = `${rig}/${name}`;       // 8 places
const SAFE_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;  // validation repeated
```

These aren't just strings - they're **domain concepts** with:
- Validation rules
- Formatting behavior
- Equality semantics

### The Abstraction

```javascript
// domain/values/AgentPath.js
export class AgentPath {
  static SAFE_PATTERN = /^[A-Za-z0-9._-]+$/;

  constructor(rig, name) {
    if (!AgentPath.isValid(rig) || !AgentPath.isValid(name)) {
      throw new InvalidAgentPathError(rig, name);
    }
    this.rig = rig;
    this.name = name;
    Object.freeze(this);
  }

  static isValid(segment) {
    return typeof segment === 'string'
      && segment.length > 0
      && segment.length <= 128
      && segment !== '.'
      && segment !== '..'
      && AgentPath.SAFE_PATTERN.test(segment);
  }

  static fromString(path) {
    const [rig, name] = path.split('/');
    return new AgentPath(rig, name);
  }

  toSessionName() { return `gt-${this.rig}-${this.name}`; }
  toString() { return `${this.rig}/${this.name}`; }

  equals(other) {
    return other instanceof AgentPath
      && this.rig === other.rig
      && this.name === other.name;
  }
}
```

### Usage

```javascript
// Before: validation scattered, construction repeated
if (!isSafeSegment(rig) || !isSafeSegment(name)) {
  return res.status(400).json({ error: 'Invalid rig or agent name' });
}
const sessionName = `gt-${rig}-${name}`;
const agentPath = `${rig}/${name}`;

// After: validation at construction, consistent formatting
try {
  const agent = new AgentPath(req.params.rig, req.params.name);
  const sessionName = agent.toSessionName();
} catch (e) {
  return res.status(400).json({ error: e.message });
}
```

### Impact
- **Validation centralized** - can't create invalid identifiers
- **Immutable** - can't accidentally mutate
- **Type-safe** - IDE knows it's an AgentPath, not a string
- **~80 lines** of validation/construction consolidated

### Benefits
1. **Impossible Invalid State:** Can't create an AgentPath with invalid rig name
2. **Immutability:** Once created, can't accidentally modify
3. **Self-Documenting:** `function startAgent(agent: AgentPath)` vs `startAgent(rig: string, name: string)`
4. **Encapsulated Formatting:** `agent.toSessionName()` always correct, no typos
5. **Equality Done Right:** `agent1.equals(agent2)` vs `agent1.rig === agent2.rig && agent1.name === agent2.name`

### Impressiveness Rating: ⭐⭐⭐⭐
Shows domain modeling sophistication. Treating identifiers as first-class concepts rather than strings.

---

## 4. Front-End: Extract Form Submission Pattern

**Not PoEAA, but significant cross-cutting concern**

### The Problem
The same loading-state pattern appears ~15 times across frontend components:

```javascript
// This exact pattern in 15 places:
const submitBtn = form.querySelector('button[type="submit"]');
const originalText = submitBtn?.innerHTML;
if (submitBtn) {
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="material-icons spinning">sync</span> Saving...';
}
try {
  const result = await api.someAction();
  if (result.success) {
    showToast('Success!', 'success');
    closeModal();
  } else {
    showToast('Failed: ' + result.error, 'error');
  }
} catch (err) {
  showToast('Error: ' + err.message, 'error');
} finally {
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
```

### The Abstraction

```javascript
// utils/form-handler.js
export async function handleFormSubmission(form, {
  action,        // async function to call
  onSuccess,     // callback on success
  onError,       // optional error handler
  loadingText = 'Saving...',
  successMessage,
  closeModalOnSuccess = true,
}) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalContent = submitBtn?.innerHTML;

  const setLoading = (loading) => {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading
      ? `<span class="material-icons spinning">sync</span> ${loadingText}`
      : originalContent;
  };

  setLoading(true);

  try {
    const result = await action();

    if (result.success) {
      if (successMessage) showToast(successMessage, 'success');
      if (closeModalOnSuccess) closeModal();
      onSuccess?.(result);
    } else {
      showToast(`Failed: ${result.error}`, 'error');
      onError?.(result);
    }

    return result;
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    onError?.(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

// Usage becomes:
form.addEventListener('submit', (e) => {
  e.preventDefault();
  handleFormSubmission(form, {
    action: () => api.createConvoy(nameInput.value, issues),
    successMessage: 'Convoy created!',
  });
});
```

### Impact
- **~200 lines** of duplicate code eliminated
- **Consistent UX** - all forms behave the same
- **Easier testing** - mock the handler, not each form

### Benefits
1. **Consistent UX:** Every form has same loading behavior
2. **Less Bugs:** Fix loading logic once, fixed everywhere
3. **Easier Onboarding:** New devs use the pattern, don't reinvent
4. **Accessibility:** Can add ARIA attributes in one place

### Impressiveness Rating: ⭐⭐⭐
Good utility extraction but not a named enterprise pattern.

---

## 5. modals.js Decomposition (1839 lines → ~7 files)

### The Problem
Single file handles 15+ different modal types. It's a **God Class**.

### The Solution
Extract each modal into its own component:

```
js/components/modals/
├── index.js              # Re-exports, initModals()
├── convoy-modal.js       # Convoy create/detail
├── sling-modal.js        # Work assignment
├── bead-modal.js         # Bead create/detail (largest: 182-line method)
├── mail-modal.js         # Mail compose
├── rig-modal.js          # Rig add
├── peek-modal.js         # Agent output viewer
└── escalation-modal.js   # Escalation form
```

### Impact
- Each modal: **100-250 lines** instead of 1839 combined
- **Findable** - know exactly where to look
- **Testable** - can test each modal independently

### Benefits
1. **Findable:** Bug in bead modal? Open `bead-modal.js`
2. **Parallel Development:** Two devs can work on different modals
3. **Lazy Loading Possible:** Load modal code only when needed
4. **Testable:** Unit test each modal in isolation
5. **Code Review:** PRs touch one file, not 1839-line behemoth

### Impressiveness Rating: ⭐⭐⭐
Good decomposition but straightforward - not a novel abstraction.

---

## Summary: What Would Impress Nate

| Refactoring | Pattern | Why It's Impressive | Line Impact |
|-------------|---------|---------------------|-------------|
| **CLI Gateway** | Gateway (PoEAA) | Perfect domain fit - this IS a CLI bridge | -400 |
| **Service Layer** | Service Layer (PoEAA) | Clear application boundary | -300 |
| **Value Objects** | Value Object (PoEAA) | Domain modeling for identifiers | -80 |
| Form Handler | Template Method | Cross-cutting concern extraction | -200 |
| Modal Split | Extract Class | God class decomposition | reorganize |

### Nate's Criteria Met:

✅ **1. Removes significant linecount** - ~800-1000 lines reduced through consolidation

✅ **2. Identifies known patterns** - Gateway, Service Layer, Value Object (all from PoEAA)

✅ **3. Shows domain understanding** - The patterns chosen **fit the domain**:
  - Gateway for CLI access (this is literally a CLI bridge)
  - Service Layer for business operations (convoys, mail, beads)
  - Value Objects for domain identifiers (AgentPath, BeadId)

---

## What NOT To Do

These would be "moving code around" without real benefit:

❌ Splitting server.js into route files without service layer (just relocating)
❌ Creating interfaces for single implementations (YAGNI)
❌ Adding Repository pattern (no database)
❌ Adding Factory pattern (construction is simple)
❌ Adding Observer beyond what events.js already does

The patterns above were chosen because they **solve real problems** in this codebase, not just because they're impressive-sounding.
