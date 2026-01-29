# Refactoring Analysis Plan

## Phase 1: Codebase Mapping
- [x] Initial file discovery and structure mapping
- [ ] Read all source files and categorize by layer
- [ ] Identify domain concepts and responsibilities
- [ ] Map dependencies between modules

## Phase 2: Code Smell Detection
Using `/code-smells` checklist:
- [ ] Long Methods (>20 lines)
- [ ] Large Classes (>300 lines)
- [ ] Magic Numbers
- [ ] Duplicate Code
- [ ] Long Parameter Lists (>3 params)
- [ ] Unclear Names
- [ ] Complex Conditionals (>2 levels nesting)

## Phase 3: PoEAA Pattern Analysis
Using `/poeaa` decision tree:
- [ ] Analyze Domain Logic patterns
- [ ] Analyze Data Source patterns
- [ ] Analyze Web Presentation patterns
- [ ] Analyze Distribution patterns
- [ ] Identify applicable patterns

## Phase 4: Refactoring Recommendations
- [ ] Map smells to refactoring patterns
- [ ] Prioritize by impact/effort ratio
- [ ] Consider domain fit and abstraction quality
- [ ] Rate by "impressiveness" factor

## Phase 5: Documentation
- [ ] Create comprehensive smell report
- [ ] Create pattern recommendations
- [ ] Create implementation guide
- [ ] Commit all findings

## Analysis Strategy
- Use sub-agents for parallel file analysis
- Go layer by layer (server → components → utilities)
- Document everything incrementally
- Commit after each phase completion
