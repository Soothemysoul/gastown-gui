# Code Smell Analysis: Utilities & Shared Files

## Files Analyzed
- js/utils/formatting.js
- js/utils/html.js
- js/utils/performance.js
- js/utils/tooltip.js
- js/shared/events.js
- js/shared/agent-types.js
- js/state.js
- js/api.js
- js/app.js

---

## Critical Duplications

### 1. `truncate()` - Duplicated in 2 files
- `formatting.js:60-64`
- `html.js:43-46`

### 2. `formatNumber()` - Duplicated in 2 files
- `formatting.js:52-55`
- `html.js:63-66`

### 3. `escapeHtml()` - Duplicated in 2 files
- `html.js:16-20`
- `agent-types.js:116-121`

---

## Large Files Needing Splitting

### app.js (1133 lines)
Too many responsibilities:
- Initialization
- Navigation
- Data loading
- Modal management
- Theme toggle
- Keyboard shortcuts
- Mayor output panel
- Drag handling

**Recommendation:** Split into:
- `navigation.js`
- `mayor-panel.js`
- `keyboard-shortcuts.js`

### api.js (416 lines, 50+ methods)
Monolithic API client with no domain separation.

**Recommendation:** Split into:
- `api/convoys.js`
- `api/mail.js`
- `api/agents.js`
- `api/github.js`

---

## Long Methods

| Method | File | Lines |
|--------|------|-------|
| `init()` | app.js | 127 |
| `setupKeyboardShortcuts()` | app.js | 109 |
| `handleWebSocketMessage()` | app.js | 69 |
| `showKeyboardHelp()` | app.js | 53 |

---

## Dead Code

1. `hideLoadingState()` in app.js - no-op function
2. `currentTooltip` in tooltip.js - set but never read
3. `querySelector('::after')` in tooltip.js - never works

---

## Speculative Generality (Possibly Unused)

In `performance.js`:
- `VirtualScroller` class (57 lines)
- `AnimationLoop` class (33 lines)
- `perf` measurement utilities (33 lines)

---

## Well-Structured Files (No Changes Needed)

- `state.js` - Clean, single responsibility
- `events.js` - Simple event constants

---

## Summary

| Priority | Issue | Files |
|----------|-------|-------|
| Critical | Duplicate functions | formatting.js, html.js, agent-types.js |
| High | Large class | app.js, api.js |
| Medium | Long methods | app.js |
| Low | Dead code | app.js, tooltip.js |
