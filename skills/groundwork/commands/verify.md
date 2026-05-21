---
name: groundwork-verify
description: Set up verification loops so the agent can self-correct. Detects test/lint/typecheck/build commands, bakes them into the context files, and wires up a pre-commit hook that keeps context current. The single highest-leverage move in this skill. Triggers on "add verification", "wire up tests for the agent", "self-correcting loop", "/gw verify".
---

# `verify` — Bake verification into context

If the agent does not have verification commands, you become the verification step. That is slow, unreliable, and the root cause of "AI is wasting my time" complaints.

This command makes verification first-class. After running it, every context file names the verification commands, and a pre-commit hook ensures the context stays in sync.

## What this command produces

- Updates to `AGENTS.md` (and to `CLAUDE.md` if it is a hand-mirrored copy rather than a symlink) to include or refresh the "Verification" section.
- Updates to the per-harness pointer files (`.cursor/rules/main.mdc`, `.github/copilot-instructions.md`, `.windsurf/rules/main.md`) so the fast verification command in the non-negotiables block stays current. These are short and hand-maintained — no generator.
- A pre-commit hook script at `.context/hooks/check-context.sh` (if not already present). The hook catches package-manager drift against `AGENTS.md`, missing ADRs on multi-file commits, and ADRs with no Status.
- A registration with the repo's hook runner (husky, pre-commit, lefthook), if one is detected.
- The `groundwork` detector wired in: as a pre-commit step and as a CI job.
- A short test of each verification command (and the detector) to confirm they work.

## Procedure

### Step 1. Detect verification commands

Read package manifests and build configs:

- **Node**: `package.json#scripts` for `test`, `lint`, `typecheck`, `build`. Detect the package manager from `packageManager` field or lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm, `bun.lockb` → bun).
- **Python**: `pyproject.toml#tool.poetry.scripts` or `[tool.pytest]`, plus standard tools (`ruff`, `mypy`, `pytest`).
- **Rust**: `cargo test`, `cargo clippy`, `cargo check`.
- **Go**: `go test ./...`, `go vet ./...`, `staticcheck` if present.
- **Java/Kotlin**: Gradle or Maven tasks.

For each detected command, note what it verifies (tests, lint, types, build, format).

### Step 2. Ask: which commands are part of the verification loop?

Use AskUserQuestion. Show detected commands preselected. Common categories:

- Tests
- Lint
- Typecheck
- Format check (separate from lint — some teams run `prettier --check`)
- Build (for compiled languages)

Let the user untick what does not apply or add commands you missed.

Also ask: **what is the "fast" verification subset?** (The one the agent runs after every change.) Versus the **"full" verification** (run before declaring a task done). For most projects: fast = typecheck + lint, full = all four. But ask.

### Step 3. Test each command

Run each verification command once and capture the result. Three reasons:

1. Confirms the command actually works in this repo on this machine.
2. Captures the current state (passing or failing). If something is currently failing, the agent should know.
3. Gives the user a chance to fix anything broken before it gets baked into context.

If a command fails, ask the user: skip this command, fix it now, or include it with a "known failing" note.

### Step 4. Update AGENTS.md and the per-harness pointers

In `AGENTS.md`, add or update the Verification section:

```markdown
## Verification

After any change:

```bash
<fast commands, one per line>
```

Before declaring a task done:

```bash
<full commands>
```

Known-failing checks (do not fix unless asked):
- <list, if any>
```

Place this section near the top of `AGENTS.md`. The agent should not have to scroll to find it.

`AGENTS.md` is canonical — `CLAUDE.md` either inherits via symlink (no edit needed) or is a hand-mirrored copy (edit it too, the `agents-claude-sync` rule will flag drift).

For each per-harness pointer file (`.cursor/rules/main.mdc`, `.github/copilot-instructions.md`, `.windsurf/rules/main.md`), update the `Verification:` line in the non-negotiables block to the fast command only. The pointer files do not list the full verification — they point at `AGENTS.md` for that.

### Step 5. Wire in the detector

The `groundwork` CLI is a deterministic detector that complements the verification commands. It catches stale CLAUDE.md, MCP credential leaks, missing verification sections, secrets, and more. Wire it in two places:

**Pre-commit**: install via the hook runner (husky/pre-commit/lefthook) using `templates/husky-pre-commit.template` as the model. The hook calls `npx @ignitic/groundwork detect --fail-on P0`, so a bad commit fails fast.

**CI**: copy `templates/context-check.yml.template` to `.github/workflows/context-check.yml` (if the repo uses GitHub Actions). Adjust `--fail-on P0` if the team wants to gate on P1 too.

Run `npx @ignitic/groundwork detect .` once now to confirm it runs and to show the user the baseline findings. If there are P0 findings, surface them; let the user decide whether to fix-then-wire-in or wire-in-with-known-issues.

### Step 6. Local drift hook

The repo-specific drift hook catches three classes of cross-file invariants that the detector does not check by itself: package-manager drift between `package.json` and `AGENTS.md`, multi-file commits shipping without an ADR, and staged ADRs that forgot to declare a Status. The basic shape:

```bash
#!/usr/bin/env bash
# .context/hooks/check-context.sh

set -e

# Did package.json change? Check that AGENTS.md still names the right package manager.
if git diff --cached --name-only | grep -q "^package.json$"; then
  pkg_mgr=$(node -e "console.log(require('./package.json').packageManager || 'npm')" | cut -d@ -f1)
  if [ -f AGENTS.md ] && ! grep -q "$pkg_mgr" AGENTS.md; then
    echo "WARNING: package.json changed but AGENTS.md does not mention $pkg_mgr"
    echo "Update AGENTS.md (or run: groundwork document)"
    exit 1
  fi
fi

# ADR coverage and ADR-status checks live in templates/hook.sh.template — copy them in.

exit 0
```

Use `templates/hook.sh.template` as the starter; tailor it to the user's stack. The template does not include any parity check between context files — `AGENTS.md` is the canonical source, so there is no other file to be in parity with.

### Step 7. Register the hook

Detect which hook runner is in use:

- `.husky/` directory → husky. Add a `.husky/pre-commit` that calls our script.
- `.pre-commit-config.yaml` → pre-commit. Add a local hook entry.
- `lefthook.yml` → lefthook. Add an entry to `pre-commit:`.
- None → tell the user the one-line install for husky (most common for Node projects) or pre-commit (most common for Python).

Do not install a new hook runner silently. Suggest, do not install. (Exception: if the user explicitly said "yes install whatever you need" earlier in this session.)

### Step 8. Report

A short summary:
- Verification commands wired in (with pass/fail status from step 3).
- Context files updated (paths).
- Detector wired in (pre-commit + CI). Baseline finding count.
- Pre-commit hook installed or "ready, install instruction: <one-liner>".

## Quality bar

- Every verification command was run once and the result is known.
- The Verification section appears near the top of every per-harness file.
- The hook is executable and does not generate false positives on a clean repo.
- "Fast" vs "full" verification is distinguished — running everything on every change is too slow and the agent will start skipping.

## Failure modes

- **Listing commands that do not work in this repo.** Run them. If a command does not work, do not write it into context.
- **Hook that always passes.** Pointless; remove or make it actually check something.
- **Hook that fails on legitimate changes.** Worse than no hook. Test it on a sample change before declaring done.
- **No fast/full split.** Agents will run the full suite once and then never again. Give them a fast loop.
