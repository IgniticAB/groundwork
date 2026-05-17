---
description: Run a context-engineer command. Bootstrap a repo, audit AI readiness, plan a change, draft an ADR, scope rules, design MCP, verify, onboard a fresh agent.
argument-hint: <command> [args]
---

Invoke the `context-engineer` skill and run the `$ARGUMENTS` subcommand.

The skill lives at `.claude/skills/context-engineer/SKILL.md`. Read it first, then dispatch to `commands/$ARGUMENTS.md` for the specific procedure.

If `$ARGUMENTS` is empty, list the nine available commands (`init`, `audit`, `document`, `plan`, `adr`, `scope`, `mcp`, `verify`, `onboard`) and ask the user which one they want, or what they are trying to accomplish if they cannot name it.

If the first word of `$ARGUMENTS` is one of the nine command names, that is the command and the rest is task input. Pass the rest verbatim to the command's procedure.

If the first word is something else (e.g. the user typed `/ce set up this repo`), treat the whole `$ARGUMENTS` as a natural-language description of what they want done, and pick the best-matching command yourself. Tell the user which one you picked in one line, and offer to switch if they push back.
