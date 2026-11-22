---
name: groundwork-verify
description: Set up verification loops so the agent can self-correct. Detects test/lint/typecheck/build commands, bakes them into the context files, and wires up a pre-commit hook that keeps context current. The single highest-leverage move in this skill. Triggers on "add verification", "wire up tests for the agent", "self-correcting loop", "/gw verify".
---

# `verify` — Bake verification into context

If the agent does not have verification commands, you become the verification step. That is slow, unreliable, and the root cause of "AI is wasting my time" complaints.

This command makes verification first-class. After running it, every context file names the verification commands, and a pre-commit hook ensures the context stays in sync.

## What this command produces

- Updates to `AGENTS.md` to include or refresh the "Verification" section. This is the canonical file; in most repos it is the only one that needs editing.
- Updates to any per-harness file the repo actually carries (`CLAUDE.md` as a full copy, `.cursor/rules/main.mdc`, `.github/copilot-instructions.md`, `.windsurf/rules/main.md`) so the fast verification command stays current. These are hand-maintained — no generator.
- Agent-runtime hooks in `.claude/settings.json` (Claude Code repos, offered not assumed) so the verification runs before the agent can declare a task done, rather than only being described in prose.
- Two git hook scripts (if not already present): `.context/hooks/check-context.sh` for **pre-commit**, catching package-manager drift against `AGENTS.md` and ADRs with no Status; and `.context/hooks/check-commit-msg.sh` for **commit-msg**, catching multi-file commits that ship without an ADR.
- A registration with the repo's hook runner (husky, pre-commit, lefthook), if one is detected — each script at its own stage.
- The `groundwork` detector wired in: as a pre-commit step and as a CI job.
- A short test of each verification command (and the detector) to confirm they work.

## Before you emit files

Read `reference/harness-detail.md` once you know which harnesses you are
targeting. It carries the per-harness paths, frontmatter schemas and limits that
`foundation/harness-reference.md` deliberately leaves out. Do not emit a file at
a path you have not checked there — the cost of a wrong path is a context file
no harness ever reads, which looks like the agent ignoring the rules.

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

`AGENTS.md` is canonical. A `CLAUDE.md` that is a symlink or an `@AGENTS.md`
import inherits the change and needs no edit; a `CLAUDE.md` that is a full copy
needs the same edit, and the `agents-claude-sync` rule will flag it if you
forget.

For each per-harness pointer file the repo carries (`.cursor/rules/main.mdc`,
`.github/copilot-instructions.md`, `.windsurf/rules/main.md`), update the
`Verification:` line in the non-negotiables block to the fast command only. The
pointer files do not list the full verification — they point at `AGENTS.md` for
that. If a pointer file exists for a harness that now reads `AGENTS.md`
natively, say so once: deleting it is less work than keeping it current.

### Step 4b. Promote the rules that must hold every time

Before wiring hooks, read the Verification section you just wrote and ask of
each command: *must this run every time, or is it a judgement call?* The ones
that must run every time do not belong only in prose — prose asks, and the
asking competes for attention with everything else in the file
(`foundation/anti-patterns.md` #11).

If the repo targets Claude Code, offer two agent-runtime hooks in
`.claude/settings.json`. Do not write them without asking: they change what the
agent is allowed to do, and that is the user's call.

- **`Stop` → the full verification.** The agent cannot declare a task done on a red build.
- **`PostToolUse` matching the edit tools → the formatter or fast linter.** Removes a whole class of prose rule from `AGENTS.md`.

Both go under a `hooks` key in `.claude/settings.json`. **There is no
`.claude/hooks.json`.** The exit code is the mechanism: exit 2 blocks and the
hook's stderr is the message the agent reads, so write that stderr as a sentence
addressed to the agent. Exit 1 is a non-blocking error and enforces nothing —
getting this backwards is the most common way a hook silently does nothing.
Shapes and event names: `reference/runtime-detail.md`.

If the repo does not target Claude Code, say so plainly: the enforcement layer
is not available there, the git hooks in Step 6 are the nearest equivalent, and
they fire after the agent has already finished.

### Step 5. Wire in the detector

The `groundwork` CLI is a deterministic detector that complements the verification commands. It catches stale CLAUDE.md, MCP credential leaks, missing verification sections, secrets, and more. Wire it in two places:

**Pre-commit**: install via the hook runner (husky/pre-commit/lefthook) using `templates/husky-pre-commit.template` as the model. The hook calls `npx @ignitic/groundwork detect --fail-on P0`, so a bad commit fails fast.

**CI**: copy `templates/context-check.yml.template` to `.github/workflows/context-check.yml` (if the repo uses GitHub Actions). Adjust `--fail-on P0` if the team wants to gate on P1 too. Keep the step's `shell: bash`: GitHub's default Linux shell has no `pipefail`, so a piped step reports the exit status of the last command and a failing detector would pass the check.

If the repo runs GitHub Actions at all, suggest [actionlint](https://github.com/rhysd/actionlint) alongside this — a static checker for workflow files. Verified 2026-11-22 against its own README and `docs/checks.md`: it checks `${{ }}` expression syntax and types, validates `runs-on:` labels, and runs shellcheck over `run:` scripts when shellcheck is installed and the shell is `bash` or `sh`. It does **not** document a check for the masked-pipeline problem above, so it would not have caught it; do not claim otherwise to the user. Groundwork does not check workflows and should not start — this is the tool that does.

Run `npx @ignitic/groundwork detect .` once now to confirm it runs and to show the user the baseline findings. If there are P0 findings, surface them; let the user decide whether to fix-then-wire-in or wire-in-with-known-issues.

### Step 6. Local drift hooks

These are **git** hooks, a different thing from the agent-runtime hooks in
Step 4b. They fire when a human commits, long after the agent has moved on; the
runtime hooks fire while the agent can still act on them. A repo wants both, for
different failures.

They catch three classes of cross-file invariant the detector does not check by
itself, and they split across two stages because one of the three needs the
commit message:

| Check | Stage | Script |
| --- | --- | --- |
| `package.json` packageManager vs `AGENTS.md` | pre-commit | `check-context.sh` |
| Staged ADR with no Status | pre-commit | `check-context.sh` |
| Multi-file commit with no ADR added or referenced | **commit-msg** | `check-commit-msg.sh` |

git writes the commit message *after* pre-commit runs. A message check placed in
pre-commit therefore reads the previous commit's message — it blocks commits that
do reference an ADR, and passes ones that do not. Keep the third check in
`commit-msg`, where git passes the message path as `$1`.

The pre-commit shape:

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

# The ADR-status check lives in templates/hook.sh.template — copy it in.

exit 0
```

Use `templates/hook.sh.template` for the pre-commit script and `templates/commit-msg-hook.sh.template` for the commit-msg one; tailor both to the user's stack. The commit-msg template refuses to run when git passes it no message file, so wiring it into the wrong stage fails loudly instead of silently judging the wrong message. Neither template includes a parity check between context files — `AGENTS.md` is the canonical source, so there is no other file to be in parity with.

### Step 7. Register the hook

Detect which hook runner is in use:

- `.husky/` directory → husky. Add a `.husky/pre-commit` calling `check-context.sh`, and a `.husky/commit-msg` calling `check-commit-msg.sh "$1"`.
- `.pre-commit-config.yaml` → pre-commit. Add two local hook entries; the ADR-coverage one needs `stages: [commit-msg]`, and the runner needs `pre-commit install --hook-type commit-msg` to install that stage at all.
- `lefthook.yml` → lefthook. Add an entry to `pre-commit:` and one to `commit-msg:`, passing `{1}` to the latter.
- `.githooks/` plus `core.hooksPath` → plain git, no runner. Check that `git config core.hooksPath` actually points there: the directory is committed but the config is per-clone, so this is the one wiring that can look installed and do nothing.
- None → tell the user the one-line install for husky (most common for Node projects) or pre-commit (most common for Python), or the dependency-free `.githooks/` + `core.hooksPath` route if they do not want another devDependency.

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
