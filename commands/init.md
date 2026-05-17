---
name: groundwork-init
description: Bootstrap a repo with the full context engineering scaffolding. Run this on a new repo or an existing repo that has no CLAUDE.md/AGENTS.md/.cursor/rules/ yet. Triggers on phrases like "initialize this repo for AI", "set up context engineering", "bootstrap CLAUDE.md", "make this AI-first", "/gw init".
---

# `init` — Bootstrap a repo

The single most leveraged move in this skill. Run once per repo. Sets up every artifact the other commands assume exists.

## What this command produces

Depending on the harnesses the user targets, some subset of:

- `CLAUDE.md` (Claude Code)
- `AGENTS.md` (Codex and generic)
- `.cursor/rules/main.mdc` (Cursor)
- `.github/copilot-instructions.md` (Copilot)
- `docs/decisions/` directory with a README and an ADR template
- `docs/decisions/negative-space.md` starter
- `.context/conventions.md` — single source of truth that the per-harness files reference
- A pre-commit hook stub at `.context/hooks/check-context.sh`

It does **not** create skills, MCP configs, or scoped rules. Those have their own commands.

## Procedure

### Step 1. Detect

Before asking anything, read the repo:

- Look for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, etc. Identify the primary language(s) and package manager(s).
- Read scripts (`package.json#scripts`, `Makefile`, `pyproject.toml#tool.poetry.scripts`) to find test, lint, build, run commands.
- Glob for existing context files. If `CLAUDE.md` or `.cursor/rules/` already exist, switch to `document` instead and tell the user.
- Check for `README.md` and skim it for stack and conventions clues.

Build a short summary of what you found and show it to the user before asking questions. Two or three lines. This proves you read the repo and frames the questions.

### Step 2. Ask

Use AskUserQuestion (or numbered options in prose if unavailable). Four questions, in order:

1. **Which harnesses should I emit files for?** Multi-select. Options: Claude Code, Cursor, Codex / generic, GitHub Copilot. Recommend the ones the user most likely uses given their tooling; do not assume.
2. **Which verification commands should the agent run?** Show the ones you detected as preselected. Common shapes: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pytest`, `cargo test`, `go test ./...`. Let the user adjust.
3. **What naming / style conventions should I bake in?** Multi-select with sensible defaults: no placeholder comments, plan-mode for >3 file changes, defensive commits before refactors, interface-first for typed languages. Let the user untick what does not apply.
4. **Anything to flag as out-of-bounds?** Free text. Things the agent should not touch (e.g. `infra/terraform/`, `vendor/`, anything generated). One-liner. Default empty.

Do not ask more than four. Do not ask things you could have detected from the repo.

### Step 3. Write the canonical conventions

Create `.context/conventions.md`. This is the single source of truth that every per-harness file references. Use `templates/conventions.template.md` as the starting point and substitute in the user's answers.

The structure (do not deviate):

```markdown
# Project conventions

## Stack
[detected stack, one line each]

## Verification commands
[the commands the user picked, one per line, with what they verify]

## Style and naming
[the conventions the user picked, with one Preferred/Avoid pair each]

## Out-of-bounds
[the user's free-text list, or "None declared" if empty]

## Plan mode
[when plan mode is required; default is >3 files or public API change]

## References
[pointers to docs/decisions/, MCP policy if exists, etc.]
```

Keep it under 200 lines. If it is heading over, it means a section has turned into a doc; move it out and link.

### Step 4. Emit per-harness files

For each harness the user picked, emit the corresponding file by transforming `.context/conventions.md` into the right format. Use `templates/CLAUDE.md.template`, `templates/AGENTS.md.template`, `templates/cursor-rule.mdc.template`, `templates/copilot-instructions.md.template` as bases.

The per-harness file is short. Its job is to:

1. Tell the agent what kind of project this is in one sentence.
2. Point to `.context/conventions.md` as the canonical source.
3. Inline the three or four most critical rules so the agent gets them even without following the link.
4. Name the verification commands inline.

Do not duplicate everything. The whole point of `.context/conventions.md` is that it is the source; the per-harness files are thin pointers.

### Step 5. Set up ADRs

Three files, all from templates in `templates/`:

- `docs/decisions/README.md` — copy from `templates/decisions-readme.template.md`. Explains the ADR format and when to write one.
- `docs/decisions/negative-space.md` — copy from `templates/negative-space.template.md`. Starter file for rejected approaches that do not warrant a full ADR.
- `docs/decisions/0001-record-architecture-decisions.md` — copy from `templates/adr-0001-record-architecture-decisions.md`. The meta-ADR ("we use ADRs"). Substitute the date and the deciders.

Subsequent ADRs use `templates/adr.template.md` and are authored via the `adr` command.

### Step 6. Set up the pre-commit hook

Create `.context/hooks/check-context.sh` from the template. Make it executable. Wire it up only if the repo already uses `husky`, `pre-commit`, or `lefthook` — detect this. If none is present, leave the hook script in place and tell the user the one-line install command for the most common one (`pre-commit install` or `pnpm dlx husky init`).

Do not silently add a new tool to the repo. Suggest, do not install.

### Step 7. Verify

Run the verification commands the user picked. If any fail, show the failure clearly and stop. The agent should see the same failures the user does. (If the user said "I know lint is broken, just continue", proceed and add a note to `.context/conventions.md` flagging the known-failing check.)

### Step 8. Report

A short summary:
- Files created (with paths the user can click).
- Verification status.
- One-line next moves: "Try `groundwork plan` next time you have a change touching multiple files."

No long postamble.

## Quality bar

- Every emitted file is under 200 lines unless explicitly templated longer.
- No placeholder text in any emitted file. Either it has real content or it is not in the file.
- Verification commands are real and run in this repo.
- The per-harness files point to `.context/conventions.md` rather than duplicating it.
- If the repo already had partial context files, they are not overwritten; the user gets a diff and decides.

## Failure modes to watch for

- **You assume Claude Code is the only harness.** Do not. Ask.
- **You write rules that contradict what the user is already doing.** Read the recent commits and a sample of files first.
- **You include rules with no examples.** Every style rule has a Preferred/Avoid pair.
- **You forget to make the hook script executable.** `chmod +x` it.
