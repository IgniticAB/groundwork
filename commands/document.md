---
name: context-engineer-document
description: Scan the codebase and produce or refresh CLAUDE.md / AGENTS.md / .cursor/rules/ with current, correct information. Use this when the repo already has some context files but they are stale, or when adopting context engineering on a mature repo. Triggers on "refresh CLAUDE.md", "update our context files", "document this codebase for the agent", "/ce document".
---

# `document` — Refresh or first-pass-document an existing repo

`init` is for repos with nothing. `document` is for repos with something (either stale context files, or a mature codebase that has never had context files before).

The difference matters: `document` does delta updates that preserve history, instead of overwriting.

## What this command produces

The same set of files as `init` (`.context/conventions.md`, per-harness files, ADR scaffolding) — but:

- Existing files are not overwritten. They are extended with new sections, and stale sections are marked deprecated with a date and reason.
- The agent reads recent git history to understand which conventions have shifted recently.
- The output names "what changed" explicitly in the chat summary.

## Procedure

### Step 1. Detect what exists

- Glob for all known context file locations.
- Read each one and note its last-modified date and approximate accuracy (does it match the current code?).
- Note what is missing entirely.

### Step 2. Read the repo deeply

Beyond what `init` does:

- Read the last 50 commits. Look for stack changes, convention shifts, file moves.
- Scan a random sample of recent files in each major directory. Check if the conventions in the existing context files are reflected in the actual code. (If `CLAUDE.md` says "use Yarn" and `package.json#packageManager` says `pnpm@9`, that is a finding.)
- Note any patterns the agent should know about that are not in the existing context (e.g. "everything in `src/api/` uses Zod schemas").

### Step 3. Ask focused questions

Three questions, not four:

1. **Which existing rules are still correct?** Show each one detected and let the user confirm, deprecate, or replace.
2. **Which new patterns did I notice — should I write them in?** Show what you found from the code sample, let the user accept or reject each.
3. **Anything you want removed or marked deprecated that I haven't flagged?** Free text. Default empty.

Skip questions if you have high confidence and tell the user you did.

### Step 4. Delta-merge

For each existing file, the merge rules are:

- **Sections still correct**: keep verbatim.
- **Sections that drifted**: append a new section with the corrected content, dated, with the old section moved to a `## Deprecated` block at the bottom (with the date deprecated and the reason).
- **New sections**: append at the bottom of the relevant area.

Example:

```markdown
## Test framework

Vitest (since 2026-04). Faster, native ESM, drop-in for our Jest tests.
Run: `pnpm test`.

## Deprecated

### Test framework — Jest (until 2026-04)
Migrated away due to ESM friction with our Vite setup.
```

Why this matters: a future agent reading the file knows both the current rule *and* why the old rule existed. Cuts intent debt.

### Step 5. Reconcile across harnesses

If both `CLAUDE.md` and `AGENTS.md` exist and they disagree, flag it. Do not silently pick a winner. Show the user the diff between the two and ask which is correct.

### Step 6. Emit and verify

Same as `init` step 7 and 8: write files, run verification, show a short summary.

## Quality bar

- No correct sections were rewritten just because you touched the file.
- Every deprecation has a date and a one-line reason.
- The chat summary names exactly what changed (added, deprecated, kept).
- Cross-harness consistency was checked, not assumed.

## Failure modes

- **Rewriting from scratch.** The whole point of `document` is delta updates. If you find yourself blanking the file, switch to `init` (and tell the user).
- **Trusting the old file.** The old file is the source of *historical truth*. The code is the source of *current truth*. When they disagree, the code wins; the old file gets deprecated.
- **Skipping the git history scan.** Recent commits are the cheapest signal for "what changed lately". Use them.
