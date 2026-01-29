# Refactoring Rankings: Complexity, Benefit, Impressiveness

## Ranking Criteria

- **Complexity**: How hard is it to implement? (1=trivial, 5=major effort)
- **Benefit**: How much does it improve the codebase? (1=minor, 5=transformative)
- **Impressiveness**: Would this demonstrate architectural sophistication? (1=basic, 5=expert)
- **LOC Impact**: Estimated line count change (positive=reduction)

---

## Ranked Refactorings

### Tier S: Must-Do, Impressive, High ROI

| # | Refactoring | Complexity | Benefit | Impressive | LOC | Priority |
|---|-------------|------------|---------|------------|-----|----------|
| 1 | **Gateway Pattern for CLI** | 3 | 5 | 5 | -400 | ⭐⭐⭐ |
| 2 | **Service Layer** | 4 | 5 | 4 | -300 | ⭐⭐⭐ |

**Why Tier S:**
- Gateway is the **textbook solution** for this CLI bridge application
- Service Layer creates a **clear application boundary**
- Both show deep understanding of the domain
- Both are from Martin Fowler's PoEAA (credibility)

---

### Tier A: High Value, Moderate Effort

| # | Refactoring | Complexity | Benefit | Impressive | LOC | Priority |
|---|-------------|------------|---------|------------|-----|----------|
| 3 | **Split modals.js (1839 lines)** | 3 | 4 | 3 | 0* | ⭐⭐ |
| 4 | **Value Objects (AgentPath, BeadId)** | 2 | 4 | 4 | -80 | ⭐⭐ |
| 5 | **Form submission utility** | 2 | 4 | 3 | -200 | ⭐⭐ |

*modals.js split doesn't reduce lines but makes code manageable

**Why Tier A:**
- God class decomposition is fundamental refactoring
- Value Objects show domain modeling sophistication
- Form utility demonstrates cross-cutting concern recognition

---

### Tier B: Good Value, Easy Wins

| # | Refactoring | Complexity | Benefit | Impressive | LOC | Priority |
|---|-------------|------------|---------|------------|-----|----------|
| 6 | **Consolidate escapeHtml** | 1 | 3 | 2 | -50 | ⭐ |
| 7 | **Consolidate formatTime** | 1 | 3 | 2 | -40 | ⭐ |
| 8 | **Extract empty/loading states** | 2 | 3 | 2 | -100 | ⭐ |
| 9 | **Cache Registry** | 2 | 3 | 3 | -50 | ⭐ |
| 10 | **Remove dead code** | 1 | 2 | 1 | -30 | ⭐ |

**Why Tier B:**
- Low-hanging fruit
- Quick wins that show attention to detail
- Good to do but won't impress on their own

---

### Tier C: Nice-to-Have

| # | Refactoring | Complexity | Benefit | Impressive | LOC | Priority |
|---|-------------|------------|---------|------------|-----|----------|
| 11 | **Split app.js** | 3 | 3 | 2 | 0 | - |
| 12 | **Split api.js** | 2 | 2 | 2 | 0 | - |
| 13 | **Extract constants** | 1 | 2 | 1 | 0 | - |
| 14 | **Keyboard shortcut data-driven** | 2 | 2 | 2 | -30 | - |

**Why Tier C:**
- Organizational improvements without novel abstractions
- "Moving code around" without new patterns
- Would do after Tier A/B complete

---

## Recommended Implementation Order

### Phase 1: Foundation (demonstrate patterns)
1. **Gateway Pattern** - Create GTGateway, BDGateway
2. **Value Objects** - Create AgentPath, BeadId, RigName

### Phase 2: Architecture (apply patterns)
3. **Service Layer** - Create ConvoyService, MailService, etc.
4. **Route handlers** - Thin down to use services

### Phase 3: Cleanup (consolidate)
5. **Form submission utility** - Extract and apply
6. **Duplicate function consolidation**
7. **modals.js decomposition**

### Phase 4: Polish
8. **Cache Registry**
9. **Dead code removal**
10. **Remaining file splits**

---

## What to Show Nate

**Lead with Gateway Pattern:**
- Show the before (scattered CLI calls)
- Show the after (clean gateway interface)
- Explain why Gateway is the correct pattern for this problem

**Then show Service Layer:**
- How business logic moved from handlers to services
- How routes became thin adapters
- The testability benefit

**Then show Value Objects:**
- How AgentPath encapsulates validation + formatting
- The domain modeling insight

**Don't lead with:**
- File splits (looks like moving code)
- Duplicate removal (looks trivial)
- Dead code (looks like cleanup)

---

## Total Impact Summary

| Metric | Current | After All Refactorings |
|--------|---------|------------------------|
| Total Lines | ~15,000 | ~13,000-14,000 |
| Largest File | 2,542 (server.js) | ~400 (any service) |
| Code Duplication | ~500 lines | ~50 lines |
| Test Coverage Possible | LOW | HIGH |
| New Patterns Applied | 0 | 4 (Gateway, Service Layer, Value Object, Registry) |

---

## Quick Reference: Pattern Sources

| Pattern | Source | Page |
|---------|--------|------|
| Gateway | PoEAA (Fowler) | 466 |
| Service Layer | PoEAA (Fowler) | 133 |
| Value Object | PoEAA (Fowler) | 486 |
| Registry | PoEAA (Fowler) | 480 |
| Extract Class | Refactoring (Fowler) | 149 |
| Extract Method | Refactoring (Fowler) | 110 |
