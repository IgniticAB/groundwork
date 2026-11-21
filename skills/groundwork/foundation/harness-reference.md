# Harness Reference

Where each AI coding harness expects to find its context files. This is the
source of truth; the `init`, `document`, `scope` and `audit` commands all read
from here when deciding what to emit.

**Last verified: 2026-11-21** against each vendor's own docs. Where a number or
field name is *not* documented, this file says so rather than inventing one.
Re-verify before each release and move the date: a stale source of truth is
confidently wrong, which is the failure this skill exists to stop.

## The short version

`AGENTS.md` at the repo root is read by every harness in this file. It is a
plain-Markdown, LF-stewarded convention with no schema. Emit it first; emit
anything else only when a harness needs something `AGENTS.md` cannot express.

## Where the canonical file goes

| Harness | Reads `AGENTS.md`? | Its own file |
| --- | --- | --- |
| Claude Code | Yes, v2.1.277+, when no `CLAUDE.md` is above the working dir | `CLAUDE.md` |
| Cursor | Yes, root and subdirectories | `.cursor/rules/*.mdc` |
| Codex / generic | Yes — this is its native file | — |
| GitHub Copilot | Cloud agent, code review, CLI, VS Code Chat. **Not** GitHub.com Chat | `.github/copilot-instructions.md` |
| Windsurf | Yes, root and intermediate directories | `.windsurf/rules/*.md` |

Full locations, frontmatter schemas, skill-portability limits, plugins and
validation commands: `reference/harness-detail.md`. Load it when you are about
to emit files, not before.

## File naming conventions

Pick one. Most teams use kebab-case everywhere except `CLAUDE.md`, `AGENTS.md`
and `README.md`, which are the established proper-noun exceptions.

## Decision: which harness(es) to target

Ask the user. Then emit `AGENTS.md` and stop, unless one of these applies:

- **Rules must be scoped to file patterns.** `AGENTS.md` has no globs. Add
  `.cursor/rules/*.mdc` for Cursor, `.github/instructions/*.instructions.md`
  for Copilot, `.claude/rules/*.md` with `paths:` for Claude Code. See `scope`.
- **A `CLAUDE.md` already exists.** Claude Code will read it and skip
  `AGENTS.md`. Reduce it to a single `@AGENTS.md` import rather than
  maintaining two files.
- **GitHub.com Chat matters to the team.** It reads
  `.github/copilot-instructions.md` but not `AGENTS.md`. A short pointer file is
  the only way to reach it.
- **The repo is multi-package.** Nest an `AGENTS.md` per package; every harness
  in this file reads the nearest one.

Do not emit a pointer file per harness by reflex. That pattern predates native
`AGENTS.md` support and now costs maintenance for nothing.

## `docs/agents/` — the harness-agnostic overflow location

When `AGENTS.md` grows past its ~80-line budget, per-area conventions split out
into `docs/agents/<area>.md`. No harness auto-loads this directory, but any
agent can be told to read it. Reference the files from `AGENTS.md`'s "See also"
section so the overflow is discoverable from the canonical file.

Plain Markdown, no frontmatter, one file per area. See
`templates/docs-agents-readme.template.md`.

## `.claude/rules/` — the Claude Code auto-load layer

Claude Code reads every file in `.claude/rules/` at launch, **unless** the file
carries `paths:` frontmatter, which scopes it to matching files. No other
harness reads `.claude/`.

`paths:` is the mechanism to reach for; it does the same job as Cursor's `globs`
and Copilot's `applyTo`. Numeric filename prefixes (`10-style.md`) still set
load order for the unscoped files, but ordering matters far less than scoping —
use prefixes only when two unscoped rules genuinely interact. See
`templates/claude-rules-readme.md`.
