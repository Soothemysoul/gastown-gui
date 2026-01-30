# Prompt Log (Sanitized)

- Target CWD: `/home/ab/GitHub/tools/gastown-gui-work1`
- Generated: `2026-01-30T12:11:47.259Z`
- Entries: `500` (Codex: `487`, Claude: `13`)

## Redactions Applied

```json
{
  "EMAIL": 2,
  "HOME_DIR": 50
}
```

## Files Used

- Codex sessions:
  - `rollout-2026-01-30T11-03-39-019c0c36-6df3-72c3-83a4-cb6646b9ea75.jsonl`
  - `rollout-2026-01-30T12-45-20-019c0c93-8728-76d3-96f6-8a9509b99c17.jsonl`
- Claude project dir: `/home/ab/.claude/projects/-home-ab-GitHub-tools-gastown-gui-work1`

## How to Read

The log file `user-prompts.sanitized.jsonl` is a JSONL stream; each line contains:

- `source`: `codex` | `claude`
- `timestamp`: ISO timestamp (if available)
- `sessionId`: tool session identifier (if available)
- `file`: source trace file basename
- `text`: the user prompt (sanitized)
