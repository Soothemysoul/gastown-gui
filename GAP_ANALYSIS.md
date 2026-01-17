# Gas Town GUI - Gap Analysis & Implementation Plan

**Generated:** 2026-01-17
**Official Gas Town:** https://github.com/steveyegge/gastown
**This GUI:** https://github.com/web3dev1337/gastown-gui

---

## Executive Summary

| Category | Status | Priority |
|----------|--------|----------|
| **Hardcoded Paths** | 🟢 GOOD - Only branding refs | P3 Low |
| **Security** | 🟢 GOOD - No exposed secrets | N/A |
| **Test Coverage** | 🟡 15-20% coverage | P1 High |
| **Feature Parity** | 🟡 ~60% of Gas Town | P2 Medium |

---

## 1. Hardcoded Paths (LOW Priority)

The codebase is **highly portable**. Only cosmetic/branding references found:

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `package.json` | 35,37,39,50 | `web3dev1337` in repo URLs & author | Low |
| `bin/cli.js` | 90 | GitHub URL in help text | Low |
| `README.md` | 35 | Clone URL | Low |
| `test/mock-server.js` | 263-266 | Mock repo data | Low |
| `js/components/work-list.js` | 37,41 | Repo mapping | Low |
| `js/components/modals.js` | 26 | Repo mapping | Low |

**Good practices found:**
- ✅ Uses `process.env.HOME || require('os').homedir()` for paths
- ✅ Uses `process.env.GT_ROOT || path.join(HOME, 'gt')`
- ✅ No hardcoded API keys or secrets
- ✅ Port configurable via CLI flags and env vars

**Action:** Update `web3dev1337` references if transferring to another org.

---

## 2. Test Coverage (HIGH Priority)

### Current State: ~15-20% Coverage

**What's Tested:**
- ✅ State management (482 lines, 100+ assertions)
- ✅ quoteArg security (22 test cases for shell injection)
- ✅ Basic E2E flow (400 lines - but NOT run in CI!)

**What's NOT Tested:**

| Component | Lines | Status |
|-----------|-------|--------|
| Server endpoints (40+) | 2,378 | ❌ UNTESTED |
| WebSocket connections | ~200 | ❌ UNTESTED |
| Frontend components (26) | ~3,000 | ❌ UNTESTED |
| Cache/TTL system | ~100 | ❌ UNTESTED |

### Critical Test Gaps

**TIER 1 - CRITICAL (Add First):**
1. **Server endpoint tests** - 40+ endpoints with zero tests
   - `POST /api/sling` - Command injection risk
   - `POST /api/convoy` - Input validation
   - `POST /api/rigs` - State mutations

2. **WebSocket tests** - Real-time core feature
   - Connection lifecycle
   - Reconnection logic
   - Message queuing

3. **Cache invalidation tests** - Subtle bug risk

**TIER 2 - HIGH:**
- Terminal/Polecat session tests
- Work/Bead management tests
- Mail system tests

### Quick Wins

**#1: Enable E2E in CI (30 min)**
```yaml
# .github/workflows/ci.yml - ADD THIS LINE:
- run: npm run test:e2e
```
Tests exist but aren't run!

**#2: Add 5 critical endpoint tests (2-3 hours)**

---

## 3. Feature Parity with Gas Town (MEDIUM Priority)

### Coverage by Area

| Feature | Gas Town | GUI Has | Gap |
|---------|----------|---------|-----|
| **Convoy Management** | Full lifecycle | Create/list | 40% missing |
| **Sling Work** | Full w/ overrides | Basic | 30% missing |
| **Beads/Issues** | Full CRUD | Full CRUD | ✅ Good |
| **Mail/Communication** | Full | Full | ✅ Good |
| **GitHub Integration** | Full | Full | ✅ Good |
| **Polecat Control** | spawn/kill/logs | start/stop only | ⚠️ 80% missing |
| **Crew Management** | Full | None | ❌ 100% missing |
| **Agent Config** | Full | List only | ⚠️ 90% missing |
| **Rig Management** | Full | No delete | 40% missing |
| **Formula Editor** | Full | List only | ⚠️ 70% missing |

### Critical Missing Features

**1. POLECAT LIFECYCLE (Most Critical)**
- ❌ `spawn` - Create new worker agents
- ❌ `kill` / `nuke` - Terminate workers
- ❌ Detailed logs view
- ❌ 3-layer monitoring (deacon/witness/boot)

**2. CREW MANAGEMENT (Significant)**
- ❌ Create crews
- ❌ Visibility settings
- ❌ Session attachment

**3. FORMULA OPERATIONS**
- ❌ Formula editor/creator
- ❌ Execute with variables
- ❌ Molecule workflows

**4. AGENT CONFIGURATION**
- ❌ Custom agent definitions
- ❌ Runtime overrides
- ❌ Per-rig settings

### Recommended Usage

**✅ USE GUI FOR:**
- Monitor work progress
- Create/track convoys
- View agent output
- Check system health
- Send mail/nudges
- Team visibility

**❌ USE CLI FOR:**
- Creating new polecats
- Killing workers
- Setting up crews
- Configuring agents
- Creating formulas

---

## 4. Implementation Roadmap

### Phase 1: Tests (Week 1-2)
- [ ] Enable E2E tests in CI (30 min)
- [ ] Add 5 critical endpoint tests (3 hours)
- [ ] Add WebSocket tests (2 hours)
- [ ] Add cache tests (1 hour)

**Estimated effort:** 10-15 hours

### Phase 2: Critical Features (Week 3-4)
- [ ] Polecat spawn UI
- [ ] Polecat kill/nuke UI
- [ ] Polecat logs viewer

**Estimated effort:** 20-30 hours

### Phase 3: Crew & Agent Config (Week 5-6)
- [ ] Crew management panel
- [ ] Agent configuration UI
- [ ] Runtime override support

**Estimated effort:** 25-35 hours

### Phase 4: Formula Editor (Week 7-8)
- [ ] Formula list improvements
- [ ] Formula creation wizard
- [ ] Variable support

**Estimated effort:** 30-40 hours

---

## 5. Files to Modify

### Tests to Add
- [ ] `test/integration/endpoints.test.js` - NEW
- [ ] `test/integration/websocket.test.js` - NEW
- [ ] `test/unit/cache.test.js` - NEW
- [ ] `.github/workflows/ci.yml` - Add E2E step

### Features to Add
- [ ] `js/components/polecat-controls.js` - NEW
- [ ] `js/components/crew-manager.js` - NEW
- [ ] `js/components/agent-config.js` - NEW
- [ ] `js/components/formula-editor.js` - NEW
- [ ] `server.js` - Add new endpoints

---

## 6. Success Criteria

### MVP (Deployable Now)
- ✅ No exposed secrets
- ✅ Portable paths
- ⚠️ Need: E2E tests in CI
- ⚠️ Need: Basic endpoint tests

### Full Release
- [ ] 60%+ test coverage
- [ ] Polecat spawn/kill
- [ ] Basic crew management
- [ ] Formula list improvements

---

## Current Known Limitations

From README:
> **Not Yet Implemented:**
> - Polecat management (spawn, kill, view logs)
> - Convoy management (full lifecycle)
> - Formula editor/creator
> - Agent configuration
> - Crew management
> - Rig removal/deletion
> - Work item editing

This aligns with our gap analysis findings.
