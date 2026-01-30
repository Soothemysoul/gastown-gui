# Trace Export (Sanitized)

This folder contains a **sanitized** export of *user-provided prompts only* (no model outputs), collected from local Codex/Claude Code trace logs.

- Output: `user-prompts.sanitized.jsonl`
- Summary: `user-prompts.summary.json`

## Raw trace locations (DO NOT COMMIT RAW)

- Codex: `~/.codex/sessions/**/rollout-*.jsonl`
- Claude Code: `~/.claude/projects/-home-ab-GitHub-tools-gastown-gui-work1/**/*.jsonl`

Raw traces may include sensitive data (tokens, file contents, command output). This export applies basic redaction (`<HOME>`, common token patterns, private key blocks, emails).

## Safety checks before pushing

Run a quick grep on the sanitized export (and review manually):

```bash
rg -n "sk-|ghp_|github_pat_|BEGIN [A-Z ]*PRIVATE KEY|AKIA|Bearer " refactoring-analysis/trace/user-prompts.sanitized.jsonl || true
```

If anything triggers, do **not** push; widen redaction rules and re-run the export.
