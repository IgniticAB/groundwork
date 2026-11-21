---
description: Run a groundwork command. Bootstrap a repo, audit AI readiness, plan a change, draft an ADR, scope rules, design MCP, verify, onboard a fresh agent.
argument-hint: <command> [args]
---

Invoke the `groundwork` skill and run the `$ARGUMENTS` subcommand.

The skill is installed as `groundwork`. Depending on how it was installed its `SKILL.md` sits under `.claude/skills/`, `.cursor/skills/`, `.agents/skills/`, or a global skills directory — resolve it rather than assuming a path. Read `SKILL.md` first, then dispatch to `commands/$ARGUMENTS.md` for the specific procedure.

If `$ARGUMENTS` is empty, list the ten available commands (`init`, `audit`, `document`, `plan`, `adr`, `scope`, `mcp`, `verify`, `onboard`, `apply`) and ask the user which one they want, or what they are trying to accomplish if they cannot name it.

If the first word of `$ARGUMENTS` is one of the ten command names, that is the command and the rest is task input. Pass the rest verbatim to the command's procedure.

If the first word is something else (e.g. the user typed `/gw set up this repo`), treat the whole `$ARGUMENTS` as a natural-language description of what they want done, and pick the best-matching command yourself. Tell the user which one you picked in one line, and offer to switch if they push back.
