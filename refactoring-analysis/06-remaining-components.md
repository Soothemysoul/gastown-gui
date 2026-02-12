# Remaining Components Analysis

## Files Analyzed
- tutorial.js (427 lines)
- onboarding.js (715 lines)
- autocomplete.js (214 lines)
- toast.js (194 lines)
- activity-feed.js (245 lines)
- crew-list.js (301 lines)

**Total:** 2,096 lines

---

## Key Findings

### 1. MORE escapeHtml Duplicates (3 additional!)
**Locations:**
- `toast.js:188-193`
- `autocomplete.js:208-213`
- `activity-feed.js:234-239`

**Total escapeHtml duplicates in codebase:** 6+ files!
All should import from `js/utils/html.js`

### 2. Magic Numbers
- `onboarding.js`: Multiple `delay(200)` calls
- `autocomplete.js`: `debounceDelay = 200`, blur delay 200
- `activity-feed.js`: Item limit hardcoded to 100
- `toast.js`: Auto-dismiss durations scattered

### 3. Long Methods
- `onboarding.js:511-597` - `runSetupChecks()` (87 lines)
- `activity-feed.js:153-191` - `formatMessage()` (39 lines)

### 4. Switch on Type (activity-feed.js)
`formatMessage()` has 5+ cases for different event types.
**Recommendation:** Use registry pattern like Gateway pattern.

### 5. Global State Pollution
`onboarding.js:163` uses `window._onboardingBeadId`
**Recommendation:** Use module-level state object instead.

### 6. Dead Code
`autocomplete.js:162` references undefined `debounceTimer`

---

## Priority Fixes

1. **Remove escapeHtml duplicates** - 30 min, eliminates 6 duplicate functions
2. **Extract magic numbers to constants** - 45 min
3. **Refactor runSetupChecks with registry pattern** - 1 hour

---

## No Major Architectural Issues

These components are reasonably well-structured. The main issues are:
- Duplication (escapeHtml everywhere)
- Magic numbers
- Some long methods

No new impressive patterns needed here - just cleanup.
