---
name: groundwork-init
description: Bootstrap a repo with the full context engineering scaffolding. Run this on a new repo or an existing repo that has no AGENTS.md/CLAUDE.md/.cursor/rules/ yet. Triggers on phrases like "initialize this repo for AI", "set up context engineering", "bootstrap AGENTS.md", "make this AI-first", "/gw init".
---

# `init` — Bootstrap a repo

The single most leveraged move in this skill. Run once per repo. Sets up every artifact the other commands assume exists.

## What this command produces

Depending on the harnesses the user targets, some subset of:

- `AGENTS.md` — the canonical, hand-edited source of agent rules. Self-sufficient; aim under ~80 lines.
- `CLAUDE.md` — symlink to `AGENTS.md` (default). Two-file fallback for Windows or `core.symlinks=false` repos.
- `.cursor/rules/main.mdc` (Cursor) — 5-line pointer to AGENTS.md.
- `.github/copilot-instructions.md` (Copilot) — 5-line pointer to AGENTS.md.
- `.windsurf/rules/main.md` (Windsurf) — 5-line pointer to AGENTS.md.
- `docs/decisions/` directory with a README, ADR-0001, and the negative-space starter.
- `.context/hooks/check-context.sh` — a slim pre-commit hook (ADR coverage + ADR status + package-manager drift).
- `.claude/rules/README.md` — **only** when the user opts in to Claude Code's auto-loading layer (off by default).

`docs/agents/` (the harness-agnostic overflow directory) is **not** created. `AGENTS.md` references it in "See also" so future readers know where overflow goes; the directory and its README are created on the first split.

It does **not** create skills, MCP configs, or scoped rules. Those have their own commands.

## Procedure

### Step 1. Check whether this repo is already set up (BEFORE anything else)

`init` is for repos with no context engineering yet. If any of these exist, the user almost certainly meant to run `document` instead:

- `AGENTS.md`
- `CLAUDE.md` (regular file or symlink)
- `.cursor/rules/` directory
- `.github/copilot-instructions.md`
- `.windsurf/rules/` directory
- `.claude/rules/` directory
- `docs/agents/` directory
- `docs/decisions/` directory
- `.context/hooks/check-context.sh`

Glob for all of the above. **Run this check before any other detection.** If any match, stop and ask the user explicitly:

```
This repo already has context engineering set up:
- <list each found path with a one-line note: line count, last-modified date, or file count>

`init` is for fresh repos. For existing setups, `document` is the right
command — it refreshes the per-harness files with delta updates that
preserve history (deprecated sections kept with a date and reason rather
than overwritten).

Did you mean to run `document` instead?
```

Use `AskUserQuestion`:
- **"Yes, switch to `document`"** (recommended; the default).
- **"No, continue with `init` anyway"** — only if the user is rebuilding intentionally (e.g. the existing files are garbage and they want a clean slate). On this path, `init` will refuse to overwrite the existing files: it skips any that already exist and tells the user which were skipped at the end.

If the user picked `document`, open `commands/document.md` and proceed there. Stop running this command.

### Step 2. Detect stack

Only after Step 1 confirmed this is a fresh init, read the repo for context that frames the upcoming questions:

- Look for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, etc. Identify the primary language(s) and package manager(s).
- Read scripts (`package.json#scripts`, `Makefile`, `pyproject.toml#tool.poetry.scripts`) to find test, lint, build, run commands.
- Check for `README.md` and skim it for stack and conventions clues.

Build a short summary of what you found and show it to the user before asking questions. Two or three lines. This proves you read the repo and frames the questions.

### Step 3. Ask

Use AskUserQuestion (or numbered options in prose if unavailable). Five questions, in order:

1. **Which harnesses should I emit files for?** Multi-select. Options: Claude Code, Cursor, Codex / generic, GitHub Copilot, Windsurf. Recommend the ones the user most likely uses given their tooling; do not assume.
2. **Which verification commands should the agent run?** Show the ones you detected as preselected. Common shapes: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pytest`, `cargo test`, `go test ./...`. Let the user adjust. Separate **fast** (after each change) from **full** (before declaring done).
3. **What naming / style conventions should I bake in?** Multi-select with sensible defaults: no placeholder comments, plan-mode for >3 file changes, defensive commits before refactors, interface-first for typed languages. Let the user untick what does not apply.
4. **Three-tier boundaries.** Free text, three slots, default empty: **Always** (things the agent does without asking), **Ask first** (things the agent proposes before doing), **Never** (paths the agent must not touch, e.g. `infra/terraform/`, `vendor/`, anything generated).
5. **Symlink CLAUDE.md to AGENTS.md, or keep two files?** Default symlink (single canonical source; lower drift). Offer the two-file fallback for Windows users or any repo with `git config core.symlinks=false` set. If the user does not know which they want, default to symlink and mention they can switch later.

Do not ask more than five. Do not ask things you could have detected from the repo.

### Step 4. Emit `AGENTS.md`

Write `AGENTS.md` from `templates/AGENTS.md.template`, filling in the user's answers directly. There is no intermediate canonical file — `AGENTS.md` *is* the canonical file.

Sections to populate (do not deviate from this order):

- **What this project is** — one paragraph, from the detected stack and README hints.
- **Stack** — language(s), package manager, runtime/framework, one line each.
- **Verification** — fast (after every change) and full (before declaring done) commands the user picked.
- **Non-negotiables** — universal procedural rules, stated **abstractly**, no triggers or path scopes. Default set: "Use plan mode when any Ask-first condition triggers", "No placeholder comments", "Use `<pkg-mgr>` only", "Run the fast verification after every meaningful change". Adjust based on the user's Q3 picks. **Do not list plan-mode triggers here** — those belong in Boundaries → Ask first.
- **Style** — three to six most critical rules, each with a Preferred / Avoid pair. Pull from Q3 picks; do not invent rules the user did not pick.
- **Boundaries** — the three-tier slots from Q4, with strict scope per tier:
  - **Always**: path- or area-scoped automatic actions only. **Not** universal rules — those are Non-negotiables.
  - **Ask first**: owns the trigger list. Default first bullet: ">3 files, public APIs, refactors, migrations". Append project-specific triggers from Q4.
  - **Never**: forbidden paths or destructive actions. Default empty if Q4's Never slot was empty.
- **Preserved regions** — one paragraph explaining the `preserve:start` / `preserve:end` markers.
- **See also** — pointers to `docs/agents/` (the overflow location; mention it even if the directory does not yet exist, so future readers know where to add per-area conventions), `docs/decisions/`, `docs/mcp-policy.md` (only if it exists).

**The non-duplication contract.** Each rule belongs in exactly one section. Before emitting, scan the draft: if the same rule (or near-paraphrase) appears in two sections, delete the one in the lower-priority section. Common offenders:

| Smells like... | Belongs in | Not in |
| --- | --- | --- |
| ">3 files / public API / migration triggers" | Boundaries → Ask first | Non-negotiables |
| "Run fast verification" (universal) | Non-negotiables | Boundaries → Always |
| "Path-scoped auto-actions" (e.g. preserve BOM) | Boundaries → Always | Non-negotiables |
| "Forbidden paths" | Boundaries → Never | Non-negotiables |

The CLI rule `agents-md-duplication` will flag the common patterns post-hoc. The init contract is what prevents them at write time.

Keep `AGENTS.md` under ~80 lines / ~400 tokens. If a section is heading over, push it into `docs/agents/<area>.md` and reference the new file from `AGENTS.md`'s "See also" instead of inlining. `docs/agents/` is harness-agnostic — any agent can be told to read those files.

### Step 5. Wire up CLAUDE.md and the per-harness pointers

**CLAUDE.md.** Per the user's answer to Q5:

- **Symlink** (default): from the repo root, run `ln -sf AGENTS.md CLAUDE.md`. Verify with `readlink CLAUDE.md`.
- **Two files**: write `CLAUDE.md` from `templates/CLAUDE.md.template`, mirroring the content of `AGENTS.md`. Tell the user explicitly: there is no generator and no parity hook; if `AGENTS.md` changes, `CLAUDE.md` must be hand-mirrored (or regenerated via `groundwork document`). The `agents-claude-sync` CLI rule will flag drift.

**Per-harness pointer files.** For every non-Codex harness the user picked, emit the corresponding pointer file. Pointer shape is identical across harnesses (five lines + a header), only the path and Cursor's `.mdc` frontmatter differ:

```
# <Project> agent rules

Read /AGENTS.md and follow it for all project conventions.

Non-negotiables (always apply):
- Verification: <fast verification command>
- Plan mode required for changes touching more than 3 files, public APIs, or migrations.
- No placeholder comments.
```

Paths:

- **Cursor** → `.cursor/rules/main.mdc`. Use `templates/cursor-rule.mdc.template` — the `.mdc` frontmatter (`alwaysApply: true`, `globs: []`) is the only format-specific bit, preserve it.
- **Copilot** → `.github/copilot-instructions.md`. Use `templates/copilot-instructions.md.template`. Plain markdown, no frontmatter.
- **Windsurf** → `.windsurf/rules/main.md`. Use `templates/windsurf-rule.template.md`. Plain markdown.

Tell the user these pointer files are hand-maintained. They are short and stable enough that hand maintenance is fine; if the three non-negotiables drift it's worth a human noticing.

**Overflow location.** Do not create a `docs/agents/` directory by default; `AGENTS.md` already names it in "See also" so future readers know where overflow goes. When the user (or a future `document` run) actually splits a section out, copy `templates/docs-agents-readme.template.md` to `docs/agents/README.md` at that point.

**Optional: Claude Code auto-loading layer.** If the user picked Claude Code as a harness, ask only if they specifically want it: *"Scaffold `.claude/rules/` so Claude Code auto-loads rule files from there? (default: no)"*

If yes, emit `.claude/rules/README.md` from `templates/claude-rules-readme.md`. Do not emit any starter rule files. Tell the user: this is Claude Code-specific; other harnesses do not auto-load from `.claude/`. For harness-agnostic overflow, use `docs/agents/`.

If the user declines or did not pick Claude Code, skip. The auto-loading layer is opt-in; for most projects, `AGENTS.md` + `docs/agents/` covers everything.

### Step 6. Set up ADRs

Three files, all from templates in `templates/`:

- `docs/decisions/README.md` — copy from `templates/decisions-readme.template.md`. Explains the ADR format and when to write one.
- `docs/decisions/negative-space.md` — copy from `templates/negative-space.template.md`. Starter file for rejected approaches that do not warrant a full ADR.
- `docs/decisions/0001-record-architecture-decisions.md` — copy from `templates/adr-0001-record-architecture-decisions.md`. The meta-ADR ("we use ADRs"). Substitute the date and the deciders.

Subsequent ADRs use `templates/adr.template.md` and are authored via the `adr` command.

### Step 7. Set up the pre-commit hook

Create `.context/hooks/check-context.sh` from `templates/hook.sh.template`. Make it executable. The hook does three things: warn on `package.json#packageManager` drift vs `AGENTS.md`, require an ADR (or a reference to one) on multi-file commits, and require a valid Status on staged ADRs. It does **not** enforce parity between any context files.

Wire it up only if the repo already uses `husky`, `pre-commit`, or `lefthook` — detect this. If none is present, leave the hook script in place and tell the user the one-line install command for the most common one (`pre-commit install` or `pnpm dlx husky init`). Do not silently add a new tool to the repo. Suggest, do not install.

### Step 8. Verify

Run the fast verification command the user picked. If it fails, show the failure clearly and stop. The agent should see the same failures the user does. (If the user said "I know lint is broken, just continue", proceed and add a note to `AGENTS.md`'s Non-negotiables section flagging the known-failing check.)

### Step 9. Report

A short summary:
- Files created (with paths the user can click).
- Verification status.
- One-line next moves: "Try `groundwork plan` next time you have a change touching multiple files."

No long postamble.

## Quality bar

- `AGENTS.md` is under ~80 lines and self-sufficient. It does not delegate to a separate canonical-conventions file; the only legitimate "see also" targets are `docs/agents/` (overflow), `docs/decisions/`, and `docs/mcp-policy.md`.
- No rule appears in two sections. Plan-mode triggers live only in Boundaries → Ask first; universal procedural rules live only in Non-negotiables; path-scoped actions live only in Boundaries → Always.
- Pointer files are exactly the five-line shape, no extra prose, no duplicated rules.
- `CLAUDE.md` is either a symlink (default) or a hand-mirrored copy with the user warned about drift.
- No placeholder text in any emitted file. Either it has real content or it is not in the file.
- Verification commands are real and run in this repo.
- If the repo already had partial context files, they are not overwritten; the user gets a diff and decides.

## Failure modes to watch for

- **You assume Claude Code is the only harness.** Do not. Ask.
- **You write rules that contradict what the user is already doing.** Read the recent commits and a sample of files first.
- **You include rules with no examples.** Every style rule has a Preferred/Avoid pair.
- **You forget to make the hook script executable.** `chmod +x` it.
- **You bloat `AGENTS.md` past the ~80-line target.** Push overflow into `docs/agents/<area>.md` files instead of inlining everything.
