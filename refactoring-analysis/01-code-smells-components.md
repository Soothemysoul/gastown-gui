# Code Smell Analysis: UI Components (Part 1)

## Files Analyzed
- convoy-list.js (536 lines)
- agent-grid.js (297 lines)
- mail-list.js (414 lines)
- rig-list.js (348 lines)
- work-list.js (374 lines)
- sidebar.js (490 lines)

---

## Detected Issues by File

### 1. convoy-list.js (536 lines)

#### 1.1 Large Class - Severity: Medium
**Location:** Entire file (536 lines)
**Description:** File exceeds 300-line threshold for a single component
**Impact:** Harder to maintain, test, and navigate
**Recommendation:** Extract sub-components: `ConvoyCard`, `IssueTree`, `WorkerPanel`, `ProgressBreakdown`

#### 1.2 Long Method - Severity: Medium
**Location:** `renderConvoyCard()` lines 212-273 (61 lines)
**Description:** Method renders multiple sections with embedded logic
**Impact:** Hard to test individual parts, difficult to modify
**Recommendation:** Extract to smaller render functions: `renderCardHeader()`, `renderCardBody()`, `renderCardFooter()`

#### 1.3 Long Method - Severity: Medium
**Location:** `setupConvoyEventListeners()` lines 77-150 (73 lines)
**Description:** One giant function attaching 6 different types of event listeners
**Impact:** Difficult to maintain, all logic in one place
**Recommendation:** Split into separate functions per event type

#### 1.4 Magic Numbers - Severity: Low
**Location:** Lines 164, 220, 403-405, 528-532
```javascript
setTimeout(() => detail.remove(), 300);  // 300ms - animation duration?
stagger-${Math.min(index, 6)}            // 6 - max stagger?
const maxVisible = 3;                     // 3 - why 3?
if (diff < 60000) return 'Just now';     // 60000ms
if (diff < 3600000) return ...           // 3600000ms
if (diff < 86400000) return ...          // 86400000ms
```
**Recommendation:** Extract to named constants: `ANIMATION_DURATION`, `MAX_STAGGER`, `MAX_VISIBLE_ISSUES`, `MS_PER_MINUTE`, `MS_PER_HOUR`, `MS_PER_DAY`

---

### 2. agent-grid.js (297 lines)

#### 2.1 Long Method - Severity: Low
**Location:** `renderAgentGrid()` lines 14-85 (71 lines)
**Description:** Combines rendering and event listener setup
**Impact:** Mixing concerns
**Recommendation:** Separate render from event binding

#### 2.2 Duplicate Utility Functions - Severity: Medium
**Location:** Lines 275-296
```javascript
function escapeHtml(str) { ... }
function truncate(str, length) { ... }
function capitalize(str) { ... }
function formatDuration(seconds) { ... }
```
**Description:** `escapeHtml` and `truncate` are duplicated from `../utils/html.js`
**Impact:** Inconsistent behavior if implementations diverge
**Recommendation:** Import from shared utils

#### 2.3 Magic Numbers - Severity: Low
**Location:** Lines 98, 117, 124, 219, 293-295
```javascript
stagger-${Math.min(index, 6)}
truncate(agent.current_task, 40)
Math.round(agent.progress * 100)
convoy_id.slice(0, 6)
if (seconds < 60) ... if (seconds < 3600) ...
```

---

### 3. mail-list.js (414 lines)

#### 3.1 Mutable Module State - Severity: Medium
**Location:** Lines 65-69
```javascript
let currentFilters = {
  agentType: 'all',
  rig: 'all',
  search: '',
};
```
**Description:** Module-level mutable state creates hidden coupling
**Impact:** Hard to test, unpredictable behavior across multiple renders
**Recommendation:** Pass filter state through function parameters or use a state management pattern

#### 3.2 Long Method - Severity: Medium
**Location:** `renderMailList()` lines 71-161 (90 lines)
**Description:** Combines filtering, sorting, rendering, and event binding
**Impact:** Multiple responsibilities in one function
**Recommendation:** Extract: `applyFilters()`, `sortMail()`, `renderMailItems()`, `bindMailEvents()`

#### 3.3 Nested Conditionals - Severity: Low
**Location:** Lines 92-114 (3 levels of nesting)
**Recommendation:** Extract to `applyFilters(mail, filters)` function with early returns

---

### 4. rig-list.js (348 lines)

#### 4.1 Duplicate Handler Pattern - Severity: HIGH
**Location:** Lines 246-316 (3 nearly identical functions)
```javascript
async function handleAgentStart(rig, name, btn) {
  const originalIcon = btn.innerHTML;
  btn.innerHTML = '<span class="material-icons spinning">sync</span>';
  btn.disabled = true;
  try {
    const result = await api.startAgent(rig, name);
    if (result.success) { showToast(`Started...`); ... }
    else { showToast(`Failed...`); }
  } catch (err) { showToast(`Error...`); }
  finally { btn.innerHTML = originalIcon; btn.disabled = false; }
}

// handleAgentStop - Same pattern
// handleAgentRestart - Same pattern
// handleRigRemove - Similar pattern
```
**Description:** 4 functions with identical try/catch/finally loading pattern
**Impact:** ~70 lines of duplicated code, maintenance burden
**Recommendation:** Extract a generic `withLoadingState(btn, asyncFn)` wrapper

---

### 5. work-list.js (374 lines)

#### 5.1 Long Method - Severity: Medium
**Location:** `handleWorkAction()` lines 188-250 (62 lines)
**Description:** Switch statement with repeated early-return pattern
**Impact:** Each case duplicates button state restoration

#### 5.2 Inline CSS - Severity: Low
**Location:** Lines 345-357
**Description:** CSS embedded in JavaScript for toast notifications
**Recommendation:** Use CSS class or move to stylesheet

---

### 6. sidebar.js (490 lines)

#### 6.1 Large Class - Severity: Medium
**Location:** Entire file (490 lines)
**Description:** File exceeds 300-line threshold
**Impact:** Too many responsibilities: agent tree, service controls, hook display, stats, popover
**Recommendation:** Extract: `AgentTree.js`, `ServiceControls.js`, `AgentPopover.js`

#### 6.2 Duplicate Handler Pattern - Severity: Medium
**Location:** `handleServiceAction()` lines 275-307
**Description:** Same try/catch/finally loading pattern as rig-list.js
**Impact:** Code duplication across files

#### 6.3 Long Method - Severity: Medium
**Location:** `showAgentQuickActions()` lines 336-428 (92 lines)
**Description:** Creates popover element, positions it, handles all events
**Recommendation:** Extract to separate popover component

---

## Cross-File Duplicate Patterns

### Pattern 1: `formatTime()` function
**Found in:** convoy-list.js, mail-list.js, work-list.js (3 implementations!)
**Recommendation:** Consolidate into `utils/formatting.js`

### Pattern 2: Button loading state handler
**Found in:** mail-list.js, rig-list.js, sidebar.js, work-list.js
**Recommendation:** Create shared `utils/async-button.js`

### Pattern 3: Empty state rendering
**Found in:** All 6 files with similar HTML patterns
**Recommendation:** Create shared `components/empty-state.js`

### Pattern 4: Stagger animation class
**Found in:** All 6 files: `stagger-${Math.min(index, 6)}`
**Recommendation:** Create constant `MAX_STAGGER_INDEX = 6`

---

## Summary Table

| Severity | Count | Description |
|----------|-------|-------------|
| HIGH | 1 | Duplicate handler pattern (rig-list.js) |
| Medium | 8 | Large files, long methods, module state |
| Low | 12 | Magic numbers, inline CSS |

**Estimated Line Reduction:** ~200-300 lines via utility extraction
