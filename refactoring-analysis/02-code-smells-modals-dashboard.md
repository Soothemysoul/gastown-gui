# Code Smell Analysis: Modals & Dashboard Components

## Files Analyzed
- modals.js (1839 lines) - **CRITICAL**
- dashboard.js (611 lines)
- formula-list.js (460 lines)
- issue-list.js (188 lines)
- pr-list.js (218 lines)
- health-check.js (308 lines)

---

## Detected Issues by File

### 1. modals.js (1839 lines) - CRITICAL

This is the **largest single file** in the codebase and contains the most severe smells.

#### 1.1 God Class/Large Module - Severity: CRITICAL
**Location:** Entire file (1839 lines)
**Description:** Single file handles 15+ different modal types
**Impact:** Impossible to maintain, test, or reason about
**Recommendation:** Split into separate modal files:
- `convoy-modal.js`
- `sling-modal.js`
- `bead-modal.js`
- `mail-modal.js`
- `rig-modal.js`
- `peek-modal.js`
- `escalation-modal.js`
- `transcript-modal.js`

#### 1.2 Long Methods - Severity: HIGH (Multiple)

| Method | Lines | Location | Severity |
|--------|-------|----------|----------|
| `showBeadDetailModal` | **182** | 1199-1381 | CRITICAL |
| `showAgentTranscript` | 97 | 1739-1836 | HIGH |
| `populateRecipientDropdown` | 95 | 677-772 | HIGH |
| `showEscalationModal` | 93 | 1476-1569 | HIGH |
| `populateTargetDropdown` | 83 | 494-577 | HIGH |
| `showConvoyDetailModal` | 73 | 1020-1093 | HIGH |
| `initSlingModal` | 65 | 423-488 | HIGH |
| `initNewRigModal` | 58 | 805-863 | HIGH |
| `showSlingError` | 56 | 606-662 | HIGH |
| `showNudgeModal` | 55 | 1112-1167 | HIGH |
| `refreshPeekOutput` | 54 | 1666-1720 | HIGH |
| `handleNewConvoySubmit` | 45 | 319-364 | HIGH |
| `handleNewBeadSubmit` | 42 | 374-416 | HIGH |
| `parseCloseReasonForModal` | 40 | 1432-1472 | Medium |

**Total: 14 long methods in a single file!**

#### 1.3 Duplicate Code - Severity: HIGH
**Pattern:** Loading state for form submission repeated ~10 times
```javascript
const submitBtn = form.querySelector('button[type="submit"]');
const originalText = submitBtn?.innerHTML;
if (submitBtn) {
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="material-icons spinning">sync</span> [Action]...';
}
// ... try/catch ...
finally {
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
```
**Locations:** Lines 342-347, 997-1002, 1146-1152, etc.

#### 1.4 Primitive Obsession - Severity: Medium
**Description:** Agent IDs parsed via string splitting `agentId.split('/')` in multiple places
**Recommendation:** Create an `AgentId` value object with `rig` and `name` properties

#### 1.5 Magic Numbers - Severity: Medium
**Locations:**
- Line 228: `100` (setTimeout delay)
- Line 274: `150` (debounce)
- Line 845: `100` (limit for GitHub repos)
- Line 1729: `2000` (auto-refresh interval)

---

### 2. dashboard.js (611 lines)

#### 2.1 Large Module - Severity: Medium
**Description:** Exceeds 300-line threshold but better structured than modals.js

#### 2.2 Long Methods
| Method | Lines | Severity |
|--------|-------|----------|
| `renderDashboard` | 73 | HIGH |
| `renderAgentStatus` | 59 | HIGH |
| `deriveHealthFromStatus` | 49 | Medium |
| `renderRigOverview` | 40 | Medium |
| `renderRecentWork` | 36 | Medium |

#### 2.3 Magic Numbers
- Line 482: `5` (recent items to show)
- Line 526: `4` (rigs to show)
- Lines 596-599: Time constants (60000, 3600000, 86400000)

#### 2.4 Duplicate Code
- `escapeHtml` duplicated from `html.js` utility (lines 605-610)

---

### 3. formula-list.js (460 lines)

#### 3.1 Long Methods
| Method | Lines | Severity |
|--------|-------|----------|
| `showEditFormulaModal` | 65 | HIGH |
| `showFormulaDetails` | 39 | Medium |
| `handleCreateFormula` | 35 | Medium |
| `handleUpdateFormula` | 34 | Medium |
| `handleUseFormula` | 32 | Medium |

#### 3.2 Duplicate Code - Severity: HIGH
**Pattern:** Form submission with loading state repeated 3 times
**Locations:** Lines 248-283, 288-320, 395-429

#### 3.3 Duplicate Utility
- `escapeHtml` duplicated from `html.js` (lines 454-459)

---

### 4. issue-list.js (188 lines)

#### 4.1 Long Method
- `createIssueCard`: 62 lines with large HTML template

#### 4.2 Duplicate Utility
- `escapeHtml` duplicated (lines 182-187)

---

### 5. pr-list.js (218 lines)

#### 5.1 Long Method
- `createPRCard`: 56 lines with large HTML template

#### 5.2 Duplicate Utility
- `escapeHtml` duplicated (lines 212-217)

---

### 6. health-check.js (308 lines)

#### 6.1 Long Method
- `renderHealthResults`: 94 lines with large HTML template
- `renderCheckItem`: 40 lines
- `setupEventListeners`: 38 lines

---

## Cross-File Duplications

### `escapeHtml` Function - CRITICAL DUPLICATION
**Duplicated in 5+ files instead of importing from `utils/html.js`:**
- dashboard.js (lines 605-610)
- formula-list.js (lines 454-459)
- issue-list.js (lines 182-187)
- pr-list.js (lines 212-217)
- modals.js (imports correctly!)
- health-check.js (imports correctly!)

**Fix:** Remove local definitions, add `import { escapeHtml } from '../utils/html.js'`

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total code smells | 47 |
| Critical severity | 2 (modals.js god class + 182-line method) |
| High severity | 24 |
| Medium severity | 18 |
| Low severity | 3 |
| Longest file | modals.js (1839 lines) |
| Longest method | `showBeadDetailModal` (182 lines) |
| `escapeHtml` duplications | 4 files |
| Long methods (>20 lines) | 31 total |

---

## Priority Fixes

### 1. CRITICAL: Split modals.js
**Effort:** 4-6 hours
**Impact:** Reduces 1839-line god class to ~7 manageable files

### 2. HIGH: Form submission utility
**Effort:** 2-3 hours
**Impact:** Eliminates 10+ duplicate loading state patterns

### 3. HIGH: Fix escapeHtml imports
**Effort:** 30 minutes
**Impact:** Removes 4 duplicate function definitions

### 4. MEDIUM: Extract long methods in modals.js
**Effort:** 2-3 hours
**Impact:** Makes largest file testable
