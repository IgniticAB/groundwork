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

Copilot path-specific frontmatter:

```markdown
---
applyTo: "src/components/**/*.tsx"
---
```

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

- They mentioned Claude Code or Cowork → `CLAUDE.md` + `AGENTS.md`.
- They mentioned Cursor → add `.cursor/rules/`.
- They mentioned Codex → ensure `AGENTS.md` exists.
- They mentioned Copilot → add `.github/copilot-instructions.md`.
- They did not mention any harness → ask. Do not assume.

Most teams in 2026 run two or three harnesses. Emit for all of them; the marginal cost is near zero once the canonical rules are written.
