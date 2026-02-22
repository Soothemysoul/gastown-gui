# Gastown GUI ↔ CLI Compatibility Report

Audit date: 2026-02-22 (updated after refactoring)
Upstream CLI: [steveyegge/gastown](https://github.com/steveyegge/gastown) + [steveyegge/beads](https://github.com/steveyegge/beads)

## Summary

All previously broken commands have been fixed. GUI now uses correct CLI commands and session naming for the current gastown version.

## Fixed Issues (2026-02-22 refactoring)

| Issue | Fix applied |
|---|---|
| Session names used `gt-mayor` prefix | Now uses `findAgentSession()` that reads actual session from `gt status --json` |
| `bd --no-daemon` flag not recognized | Removed from `BDGateway.js` |
| `gt rig list` text parsing broken by emoji | Now uses `gt rig list --json` |
| `gt crew list` failed without rig context | Now uses `--all` flag |
| `gt hook status` failed outside agent context | Returns graceful `{ hooked: null, reason: 'not_in_agent_context' }` |
| Doctor output parser wrong format | Fixed to match actual `○/✓/⚠/✖` spinner format with `\r` |
| Running polecat detection used `gt-` prefix | Now uses `gt polecat list --all --json` |
| `StatusService` used tmux `gt-` prefix parsing | Now uses `gt status --json` `running` field + polecat list |

## Working Commands (current)

`gt status --json`, `gt convoy list/status/create --json`, `gt sling`, `gt mail inbox/send/read/mark-read/mark-unread --json`, `gt nudge`, `gt mayor start/stop/restart`, `gt deacon start/stop/restart`, `gt witness start <rig>/stop <rig>/restart <rig>`, `gt refinery start [rig]/stop [rig]/restart [rig]`, `gt rig list --json/add/remove`, `gt crew list --all --json/add/remove`, `gt doctor`, `gt doctor --fix`, `gt feed --plain --follow`, `gt formula list/show/run/create`, `gt polecat list --all --json`, `bd list/search/new/show/close/defer/update --json`.

## Remaining Partial Matches

| GUI calls | Issue |
|---|---|
| `gt formula create --description --template` | Real CLI may use different flags — create works but template syntax unverified |
| `gt hook status` | Only works inside agent session; server always returns graceful fallback |

## Notes

- `gt feed --json` does not exist; GUI uses `gt feed --plain --follow` for WebSocket stream
- `gt doctor` exits with code 1 when issues found (normal); server reads stdout directly via `execFileAsync`
- Session naming format: `hq-mayor`, `hq-deacon`, `tw-witness`, `tw-refinery`, `vo-witness`, `vo-refinery`, `tw-<polecat>` — derived from workspace prefix, not `gt-` prefix
