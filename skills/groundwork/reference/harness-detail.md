# Harness Detail

Per-harness file locations, frontmatter schemas and tooling. Loaded on demand by
`init`, `document`, `scope` and `verify` — the commands that actually emit files.
`foundation/harness-reference.md` holds the decision; this holds the detail.

**Last verified: 2026-11-21** against each vendor's own docs. Where a number or
field name is *not* documented, this file says so rather than inventing one.

## Claude Code

| Purpose | Location | Notes |
| --- | --- | --- |
| Project rules | `CLAUDE.md` at repo root or `.claude/CLAUDE.md` | All discovered files are concatenated, root-down; nearest wins on conflict |
| Cross-tool rules | `AGENTS.md` at repo root | Read when no `CLAUDE.md` exists above the working dir. Requires v2.1.277+ |
| Personal rules | `~/.claude/CLAUDE.md` | Not committed |
| Scoped rules | `.claude/rules/*.md` | Loaded at launch unless the file has `paths:` frontmatter, which scopes it to matching files |
| Skills | `.claude/skills/<name>/SKILL.md` | Also `~/.claude/skills/` (personal) and `<subdir>/.claude/skills/` (nested) |
| Subagents | `.claude/agents/<name>.md` | Frontmatter: `name`, `description`, `tools` |
| Hooks | `hooks` key in `.claude/settings.json` | **Not** a standalone `.claude/hooks.json` |
| MCP servers | `.mcp.json` at repo root | Committed; see `mcp-principles.md` |
| Slash commands | `.claude/commands/<name>.md` | Still works; prefer a skill for new work — a skill wins a name clash |
| Plugins | `.claude-plugin/plugin.json` | Bundles skills, agents, hooks and MCP servers as one installable unit |
| Auto memory | `~/.claude/projects/<project>/memory/MEMORY.md` | Per-user, outside the repo. Not a repo file |

`CLAUDE.md` is the single most important file. Anthropic's documented target is
**under 200 lines**; files above it "consume more context and may reduce
adherence". Imports (`@path/to/file`, max four hops) do not reduce that cost.

### AGENTS.md vs CLAUDE.md

Claude Code reads `AGENTS.md` only when there is no `CLAUDE.md` or
`CLAUDE.local.md` in the working directory or above it. The `/config` setting
**Project instructions** changes this: `claude-md-or-agents-md` (default),
`claude-md-and-agents-md`, `claude-md`, `managed-only`.

To keep one source with both names working, put `@AGENTS.md` in `CLAUDE.md`.
That is Anthropic's own recommendation and it works where symlinks do not.
`AGENTS.local.md`, `AGENTS.override.md` and `.agents/` are **not** read.

### Skill frontmatter and portability

Only six fields are portable: `name`, `description`, `license`,
`compatibility`, `metadata`, `allowed-tools`. Claude Code accepts around twenty
more — `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`,
`user-invocable`, `disallowed-tools`, `model`, `effort`, `context`, `agent`,
`background`, `hooks`, `paths`, `shell`.

A skill carrying any of those extras is a **hard error** on claude.ai and the
Skills API: `Unexpected key(s) in SKILL.md frontmatter`. If a skill must run in
both places, restrict it to the six. Other limits: `description` and
`when_to_use` are truncated together at 1,536 characters; `compatibility` caps
at 500; keep the body under 500 lines.

Reference bundled files with `${CLAUDE_SKILL_DIR}` so paths survive a change of
working directory.

### Validation

- `claude plugin validate <path>` — checks a plugin, marketplace or skills
  directory (v2.1.233+). `claude plugin validate .claude/skills`.
- `claude plugin eval` — runs prompts with and without the plugin and scores the
  difference. This is how you find out whether context changed behaviour.
- `/doctor prompt-audit` — checks instruction files for conflicts.
- `claude --debug` — surfaces YAML parse errors; malformed frontmatter otherwise
  loads the body with empty metadata and fails silently.

### Plugins and marketplaces

A plugin is a directory Claude Code installs as one unit: `skills/<name>/SKILL.md`,
`agents/<name>.md`, `hooks/hooks.json`, `.mcp.json`, declared by
`.claude-plugin/plugin.json`. A marketplace is a repo with
`.claude-plugin/marketplace.json` listing `name`, `owner` and `plugins[]`; each
entry needs `name` and `source`, and the entry name must match the plugin
manifest's name or install fails.

```bash
claude plugin marketplace add <owner>/<repo>
claude plugin install <plugin>@<marketplace>
```

Use a plugin to version and install several components together; a single skill
committed to `.claude/skills/` is enough to share one procedure in one repo.

## Cursor

| Purpose | Location | Notes |
| --- | --- | --- |
| Project rules | `.cursor/rules/<name>.mdc` | `.mdc` extension is required; a plain `.md` file here is ignored. Subfolders allowed |
| Cross-tool rules | `AGENTS.md` at root and in subdirectories | Plain Markdown, no metadata. Nested files combine with parents; more specific wins |
| Legacy rules | `.cursorrules` | Not mentioned in current docs. Treat as legacy; migrate to `.cursor/rules/` |

Precedence: **Team Rules → Project Rules → User Rules.**

`.mdc` frontmatter — only three fields are documented:

```markdown
---
description: When this rule should be applied
globs: src/components/**/*.tsx
alwaysApply: false
---
```

The four rule types, by the names Cursor's own UI uses, and the field
combination that produces each:

| Type | Fields | Fires when |
| --- | --- | --- |
| Always Apply | `alwaysApply: true` | Every request |
| Apply to Specific Files | `alwaysApply: false` + `globs` | A matching file is in play |
| Apply Intelligently | `alwaysApply: false` + `description`, no globs | The agent judges it relevant |
| Apply Manually | none of the above | Only when `@`-mentioned |

**Cursor documents no per-rule word, character or token budget.** The only size
guidance is "keep rules under 500 lines" and "split large rules into multiple,
composable rules". Any tighter number you see quoted is someone's house style,
not a Cursor limit. Say so when you pass it on.

## Codex / generic agents

| Purpose | Location | Notes |
| --- | --- | --- |
| Project rules | `AGENTS.md` at repo root | The cross-tool standard; stewarded by the Linux Foundation's Agentic AI Foundation, 60k+ repos |
| Skills | `.agents/skills/` (repo) or `~/.agents/skills/` (user) | The `npx skills` installer's convention, not a documented Codex feature |

No required schema — plain Markdown, any headings. Nest one per package; agents
read the nearest file in the tree. Codex truncates at 32 KiB without warning.

## GitHub Copilot

| Purpose | Location | Notes |
| --- | --- | --- |
| Repo-wide instructions | `.github/copilot-instructions.md` | The widest surface support: Chat, code review, cloud agent, CLI, and the IDE integrations |
| Path-specific instructions | `.github/instructions/**/*.instructions.md` | Frontmatter `applyTo` (glob; comma-separate several in one string) and `excludeAgent` (`code-review` or `cloud-agent`) |
| Cross-tool rules | `AGENTS.md` | Cloud agent, code review, CLI, VS Code Chat. **Not** GitHub.com Chat |
| Custom agents | `.github/agents/<name>.agent.md` | Frontmatter: `description` (required), `name`, `target`, `tools`, `model`, `disable-model-invocation`, `user-invocable` |
| Prompt files | `.github/prompts/*.prompt.md` | Reusable templates invoked by hand. Not supported on GitHub.com or in the CLI |

Path-specific frontmatter:

```markdown
---
applyTo: "src/components/**/*.tsx,src/components/**/*.jsx"
---
```

Custom-agent `tools:` takes case-insensitive aliases — `execute`, `read`,
`edit`, `search`, `agent`, `web`, `todo` — plus `server/tool` for MCP.
Omitting the field means all tools; `[]` means none. Agents are chosen from a
picker (`/agent` with no argument), by naming one in the prompt, or with
`copilot --agent <name>`. There is no documented `/agent <name>` syntax.

GitHub.com Chat orders them personal → path-specific → repo-wide → agent →
organization, supplying all of them. VS Code and the CLI combine applicable
files with **no** documented precedence, so contradictions are a real hazard.

## Windsurf

Windsurf's docs now redirect to `docs.devin.ai`, and the surviving pages describe
Devin Local and the Devin CLI rather than the Windsurf IDE. Treat this section as
the least reliable here and verify before emitting anything.

| Purpose | Location | Notes |
| --- | --- | --- |
| Workspace rules | `.windsurf/rules/<name>.md` | Frontmatter `trigger:` — `always_on`, `glob`, `model_decision`, `manual`; plus `description` and `globs` |
| Legacy rules | `.windsurfrules` | Still imported by default. Called legacy, not deprecated |
| Cross-tool rules | `AGENTS.md` | Read as always-on rules at the workspace root and in directories between root and cwd |

The 6,000-character and 12,000-character budgets this file used to quote are
**not in the accessible documentation**. Do not state them as limits.

There is **no documented `.windsurfmemories` repo file.** Cascade memories are
agent-managed storage outside the repo; nothing in the repo governs them.
