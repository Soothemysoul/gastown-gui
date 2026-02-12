# Gastown GUI ↔ CLI Compatibility Report

Audit date: 2026-02-12
Upstream CLI: [steveyegge/gastown](https://github.com/steveyegge/gastown) + [steveyegge/beads](https://github.com/steveyegge/beads)

## Summary

The GUI was built against an older version of `gt`/`bd`. The CLI has since renamed and restructured several commands. **28 of 41 commands work, 7 are broken, 3 have wrong flags, 3 are partially matched.**

## Broken Commands (don't exist in current CLI)

| GUI calls | Real CLI equivalent | Affected file |
|---|---|---|
| `gt polecat spawn <rig/name>` | No standalone spawn — handled internally by `gt sling` | `server.js` |
| `gt <service> down` | `gt mayor stop`, `gt witness stop <rig>`, `gt refinery stop [rig]`, `gt deacon stop` | `server.js` |
| `gt formula use <name> --target X --args X` | `gt formula run [name] --rig X --pr X --dry-run` | `server/services/FormulaService.js` |
| `bd done <id> -m <summary>` | `bd close <id> -r <reason>` | `server/gateways/BDGateway.js` |
| `bd park <id> -m <reason>` | `bd defer <id>` | `server/gateways/BDGateway.js` |
| `bd release <id>` | `bd update <id> --status open` | `server/gateways/BDGateway.js` |
| `bd reassign <id> <target>` | `bd update <id> --assignee <target>` | `server/gateways/BDGateway.js` |

## Wrong Flags / Missing Arguments

| GUI calls | Issue | Affected file |
|---|---|---|
| `gt escalate ... -m <msg>` | Flag should be `-r`/`--reason`, not `-m` | `server/gateways/GTGateway.js` |
| `gt witness start` (no rig) | Requires `<rig>` argument | `server.js` |
| `gt refinery start` (no rig) | Requires `[rig]` argument | `server.js` |

## Partial Matches

| GUI calls | Issue |
|---|---|
| `gt formula create --description --template` | Real CLI may use `--type` instead |
| `bd create --role-type` | Flag not confirmed in current CLI |
| `bd --no-daemon` | Flag not confirmed; may be silently ignored |

## Working Commands (28)

`gt status`, `gt convoy list/status/create`, `gt sling`, `gt mail inbox/send/read/mark-read/mark-unread`, `gt nudge`, `gt mayor start`, `gt rig list/add/remove`, `gt crew list/status/add/remove`, `gt doctor`, `gt doctor --fix`, `gt hook status`, `gt feed`, `gt version`, `gt formula list/show`, `bd list`, `bd search`, `bd new`, `bd show`, `bd version`, `bd formula list`.

## Graceful Fallbacks

| Command | Behavior |
|---|---|
| `gt doctor --json` | `--json` flag doesn't exist; GUI falls back to plain text parsing |
| `gt rig list` | No `--json` flag; GUI parses text output |
