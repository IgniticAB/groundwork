# context-engineer

A skill (and 8 commands) for setting up and maintaining state of the art context engineering on a project or repo.

Built from the practices in *The 2026 Context Engineering Blueprint*, structured after the model in [impeccable.style](https://impeccable.style): one umbrella skill, with shared foundation files that always load, plus focused commands for the highest-leverage moves.

## What it does

When the user wants to bootstrap a repo for AI-first development, audit how AI-ready their repo is, write or refresh a `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/`, plan a non-trivial change before coding, capture a decision as an ADR, scope rules to file patterns, design an MCP server with least-privilege, or bake verification loops into the agent's context — they invoke this skill and pick a command.

## The eight commands

| Command | Purpose |
| --- | --- |
| `init` | Bootstrap a repo with full context engineering scaffolding |
| `audit` | Score the repo's context engineering maturity, find gaps |
| `document` | Refresh / first-pass-document an existing repo (delta merge, not rewrite) |
| `plan` | Plan Mode contract before any non-trivial change |
| `adr` | Architecture Decision Record with negative-space section |
| `scope` | File-pattern-scoped rules per area |
| `mcp` | MCP configuration with least-privilege, HITL, audit policy |
| `verify` | Bake test/lint/typecheck commands into context; install drift hook |

## Repo layout

```
context-engineer/
  SKILL.md                       — the orchestrator
  README.md                      — this file
  foundation/                    — always-loaded reference (read once at start of session)
    five-layer-stack.md
    contextops-lifecycle.md
    cognitive-debt.md
    anti-patterns.md
    good-practices.md
    harness-reference.md
    mcp-principles.md
  commands/                      — one file per command, loaded on dispatch
    init.md
    audit.md
    document.md
    plan.md
    adr.md
    scope.md
    mcp.md
    verify.md
  templates/                     — files the commands emit
    conventions.template.md
    CLAUDE.md.template
    AGENTS.md.template
    cursor-rule.mdc.template
    copilot-instructions.md.template
    adr.template.md
    adr-0001-record-architecture-decisions.md
    decisions-readme.template.md
    negative-space.template.md
    plan.template.md
    mcp-config.template.json
    mcp-policy.template.md
    hook.sh.template
```

## How to install (loose, no plugin)

Drop the `context-engineer/` directory into a place your AI harness picks up skills from:

- **Claude Code / Cowork**: copy into `.claude/skills/context-engineer/` at the project root, or into `~/.claude/skills/context-engineer/` to use across all projects.
- **Cursor**: copy into `.cursor/skills/context-engineer/` (requires Skills enabled in Cursor Nightly).
- **Codex**: copy into `.agents/skills/context-engineer/` (repo) or `~/.agents/skills/context-engineer/` (user).

The same directory works in all three; the harness reads the `SKILL.md`.

### Optional: `/ce` slash command

For Claude Code users who want a real slash shortcut, copy `slash-commands/ce.md` into `.claude/commands/ce.md` (at the project root or in your home `~/.claude/commands/`). Then `/ce init`, `/ce audit`, `/ce plan` etc. autocomplete in the slash menu and dispatch to the skill.

Without this step, `/ce` still works as a trigger phrase (the skill descriptions match on it), but it is not a true Claude Code slash command and may not autocomplete. Other harnesses (Cursor, Codex) use their own slash mechanisms; the skill itself triggers via natural language regardless.

## How to use

Once installed, type the skill name or one of its commands in your harness:

- `context-engineer init` — bootstrap this repo.
- `context-engineer audit` — score the current setup.
- `context-engineer plan` — draft a plan before coding the next change.

With the optional slash shim installed, the same commands work as `/ce init`, `/ce audit`, `/ce plan`.

You can also describe what you want and let the skill pick: *"set up this repo for AI-first development"* will trigger `init`; *"how good is our AI setup?"* will trigger `audit`.

## Worked example: bootstrapping a new repo

```
You: context-engineer init

Skill: Read your repo. Saw: Node 22, pnpm, Next.js 15, Vitest, Biome.

Ask 4 questions:
  1. Harnesses? → Claude Code, Cursor
  2. Verification? → pnpm test, pnpm lint, pnpm typecheck
  3. Conventions? → no-placeholder, plan-mode-for->3-files, interface-first
  4. Out-of-bounds? → infra/terraform/, .next/, node_modules/

Emit:
  - .context/conventions.md
  - CLAUDE.md
  - .cursor/rules/main.mdc
  - docs/decisions/README.md
  - docs/decisions/0001-record-architecture-decisions.md
  - docs/decisions/negative-space.md
  - .context/hooks/check-context.sh

Run pnpm test, pnpm lint, pnpm typecheck. All pass.

Next: try `context-engineer plan` next time you have a change touching multiple files.
```

## Design principles

This skill follows five rules in its own design — the same rules it teaches.

1. **One skill, N commands.** Modeled on impeccable.style. A single entry in the skill menu; commands are discovered by typing the skill name.
2. **Foundation files load on every invocation.** `foundation/` is read once at session start. Commands assume it is in context.
3. **Templates over generation.** Files the commands emit are templates with substitutions, not regenerated from scratch each time. Templates are reviewable.
4. **Layer discipline.** Every file lives in the layer where it belongs (System / Project / Codebase / Session / Tooling).
5. **No placeholders in emitted output.** Either the file has real content or it does not exist.

## Source material

- *The 2026 Context Engineering Blueprint* — the source document this skill is built from. Lives in this same workspace folder.
- [impeccable.style](https://impeccable.style) — the structural reference for "one skill, N commands" with always-loaded foundation files.

## The detector CLI

A companion CLI lives in `cli/` and is published separately as `context-engineer` on npm. It runs deterministic, LLM-free anti-pattern checks: stale CLAUDE.md, MCP credential leaks, oversized context files, placeholder comments, common secrets, license headers, and ADR drift.

```bash
npx context-engineer detect           # one-shot scan
npx context-engineer detect --json    # CI-ready output
npx context-engineer watch            # re-detect on file changes
npx context-engineer list-rules       # show all rules
```

Wire it into pre-commit and CI via the templates in `templates/husky-pre-commit.template` and `templates/context-check.yml.template`. The `verify` command does this for you.

The skill is for authoring context. The CLI is for guarding it. The two complement each other.

## Status and scope

Version 1.1. Nine commands. Detector CLI with ten rules. Harness-agnostic output (Claude Code, Cursor, Codex, Copilot). Verification commands and detector are run for real, not declared.

If you want to extend it: add a new command file in `commands/` and a row in the table in `SKILL.md`. Add new detector rules in `cli/src/rules/` and register them in `cli/src/rules/index.ts`. Commands are independent; rules are independent; they share the foundation files but do not depend on each other.
