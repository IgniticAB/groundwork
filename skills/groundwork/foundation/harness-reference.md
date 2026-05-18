# Harness Reference

Where each AI coding harness expects to find its context files. This is the source of truth; the `init`, `document`, and `scope` commands all read from here when deciding what to emit.

## Claude Code

| Purpose | Location | Notes |
| --- | --- | --- |
| Project rules | `CLAUDE.md` at repo root | Always loaded when Claude Code opens the repo |
| Skills | `.claude/skills/<name>/SKILL.md` | Each skill is a directory; YAML frontmatter with `name` and `description` |
| Slash commands | `.claude/commands/<name>.md` | Invoked as `/<name>` |
| Sub-agent / persona | `.claude/agents/<name>.md` | YAML frontmatter with `name`, `description`, `tools` |
| Hooks | `.claude/hooks.json` | Pre/post tool hooks |
| Memory | `.claude/memory/` | Per-user, not committed |

`CLAUDE.md` is the single most important file. Keep it under 200 lines.

## Cursor

| Purpose | Location | Notes |
| --- | --- | --- |
| Project rules | `.cursor/rules/<name>.mdc` | Modern format. YAML frontmatter for file-scoping. |
| Legacy rules | `.cursorrules` | Deprecated. Migrate to `.cursor/rules/` |
| Indexing config | Cursor settings UI | Not in repo |
| Composer instructions | `.cursor/rules/composer.mdc` | Optional, scope to `**/*` |

Cursor `.mdc` frontmatter format:

```markdown
---
description: When this rule should be applied
globs:
  - src/components/**/*.tsx
  - src/components/**/*.jsx
alwaysApply: false
---

# Rule body in Markdown
```

`alwaysApply: true` means the rule loads every time. Use sparingly.

## Codex / generic agents

| Purpose | Location | Notes |
| --- | --- | --- |
| Project rules | `AGENTS.md` at repo root | The emerging cross-tool standard |
| Skills | `~/.agents/skills/` (user) or `.agents/skills/` (repo) | Codex-compatible |

`AGENTS.md` should be a near-duplicate of `CLAUDE.md`. Same content, both files emitted by the `init` and `document` commands.

## GitHub Copilot

| Purpose | Location | Notes |
| --- | --- | --- |
| Repo-wide instructions | `.github/copilot-instructions.md` | Loaded automatically by Copilot Chat |
| Path-specific instructions | `.github/instructions/<name>.instructions.md` | YAML frontmatter with `applyTo` glob |
| Domain-specific agent profiles | `.github/agents/<name>.agent.md` | YAML frontmatter; invoked via `/agent <name>` |

Copilot path-specific frontmatter:

```markdown
---
applyTo: "src/components/**/*.tsx"
---
```

Copilot agent-profile frontmatter:

```markdown
---
name: data-validator
description: Parses JSON configs and audits schema structures.
tools: [read, grep]
---

# Data validator
...
```

Agent profiles let you carve out narrow, domain-specific contexts that only load when the user invokes `/agent data-validator` (or similar). Examples: an `error-handler.agent.md` that only audits catch blocks; a `migration.agent.md` that knows your DB migration conventions. Keeps the main completion context lean.

## Windsurf

| Purpose | Location | Notes |
| --- | --- | --- |
| Workspace rules (single file) | `.windsurfrules` | Max 6,000 characters; legacy single-file style |
| Workspace rules (directory) | `.windsurf/rules/<name>.md` | Multiple scoped files; total budget 12,000 characters across all rule files |
| Persistent agent memories | `.windsurfmemories` | Cascade auto-writes cross-session facts here (stack shifts, architectural discoveries). Treat as agent-managed; humans rarely edit. |

Windsurf rules support global workspace scope, file-pattern glob matching, or model-driven activation, depending on how each rule file is structured. The character budgets are hard limits; exceeding them silently truncates content.

## Cowork (this environment)

| Purpose | Location | Notes |
| --- | --- | --- |
| Skills | Workspace folder, `<skill-name>/SKILL.md` | Loose files work; can be packaged as `.plugin` |
| Plugins | `.plugin` files | Use `create-cowork-plugin` skill to build |

## What goes in which file

When emitting the *same* rules across multiple harnesses, the body is identical. Only the wrapping changes:

- `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`: plain Markdown, no frontmatter required (Copilot accepts plain Markdown but supports frontmatter for path-scoping).
- `.cursor/rules/*.mdc`: YAML frontmatter with `description`, `globs`, `alwaysApply`.
- `.github/instructions/*.instructions.md`: YAML frontmatter with `applyTo`.

The `init` command's job is to take a single canonical set of rules and emit them in each of these formats. Never write rules five times by hand.

## File naming conventions

Pick one. Most teams use kebab-case for filenames everywhere except `CLAUDE.md`, `AGENTS.md`, and `README.md` which are the established proper-noun exceptions.

## Decision: which harness(es) to target

Ask the user. Default reasoning:

- They mentioned Claude Code or Cowork → `AGENTS.md` with `CLAUDE.md` as a symlink to it (default; see `good-practices.md` for the rationale).
- They mentioned Cursor → add `.cursor/rules/`.
- They mentioned Codex → `AGENTS.md` already covers it.
- They mentioned Copilot → add `.github/copilot-instructions.md`; add `.github/agents/` if they want domain profiles.
- They mentioned Windsurf → add `.windsurf/rules/` (preferred) or `.windsurfrules`.
- They did not mention any harness → ask. Do not assume.

Most teams in 2026 run two or three harnesses. Emit for all of them; the marginal cost is near zero once the canonical rules are written.

## Numeric-prefix naming for `.claude/rules/`

When emitting `.claude/rules/<name>.md` files, prefix with two digits to set the load order via filename sort. Suggested ranges:

- `00-09` — orientation
- `10-29` — global style and naming
- `30-49` — verification and build
- `50-69` — per-area conventions (frontend, db, infra)
- `70-89` — security, MCP, credentials
- `90-99` — exceptions and overrides

Leave gaps between numbers so future rules slot in without renumbering. See `templates/claude-rules-readme.md` for the full pattern.
