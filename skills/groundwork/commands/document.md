---
name: groundwork-document
description: Scan the codebase and produce or refresh CLAUDE.md / AGENTS.md / .cursor/rules/ with current, correct information. Use this when the repo already has some context files but they are stale, or when adopting context engineering on a mature repo. Triggers on "refresh CLAUDE.md", "update our context files", "document this codebase for the agent", "/gw document".
---

# `document` — Refresh or first-pass-document an existing repo

`init` is for repos with nothing. `document` is for repos with something (either stale context files, or a mature codebase that has never had context files before).

The difference matters: `document` does delta updates that preserve history, instead of overwriting.

## What this command produces

Whatever set of context files the repo already has — `AGENTS.md`, a `CLAUDE.md`, per-harness pointer files, ADR scaffolding, `docs/agents/`, `.claude/rules/` — but:

- Existing files are not overwritten. They are extended with new sections, and stale sections are marked deprecated with a date and reason.
- The agent reads recent git history to understand which conventions have shifted recently.
- The output names "what changed" explicitly in the chat summary.

## Before you emit files

Read `reference/harness-detail.md` once you know which harnesses you are
targeting. It carries the per-harness paths, frontmatter schemas and limits that
`foundation/harness-reference.md` deliberately leaves out. Do not emit a file at
a path you have not checked there — the cost of a wrong path is a context file
no harness ever reads, which looks like the agent ignoring the rules.

## Procedure

### Step 1. Detect what exists

- Glob for all known context file locations.
- Read each one and note its last-modified date and approximate accuracy (does it match the current code?).
- Note what is missing entirely.

### Step 2. Read the repo deeply

Beyond what `init` does:

- Read the last 50 commits. Look for stack changes, convention shifts, file moves.
- Scan a random sample of recent files in each major directory. Check if the conventions in the existing context files are reflected in the actual code. (If `AGENTS.md` says "use Yarn" and `package.json#packageManager` says `pnpm@9`, that is a finding.)
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

**Anti-duplication sweep.** Before writing the merged file, scan it for cross-section duplication. A rule belongs in exactly one section:

- Plan-mode triggers (">N files", "public APIs", "migrations", "refactors") → Boundaries → Ask first only.
- Universal procedural rules ("run verification", "use pkg-mgr", "no placeholders") → Non-negotiables only.
- Path/area-scoped automatic actions → Boundaries → Always only.
- Forbidden paths → Boundaries → Never only.

If the existing file had a rule restated in two sections, delete the lower-priority instance and note the cleanup in the chat summary. The CLI's `agents-md-duplication` rule will catch any that slip through.

**Anchored-rule sweep.** After the anti-duplication pass, walk the Style section. Each rule must be behaviourally anchored: a verb plus a specific technology, command, or pattern. Flag vague rules for the user with a proposed anchored rewrite; do not silently rewrite them. The bar matches the one in `init`:

| Anchored (keep) | Vague (rewrite or drop) |
| --- | --- |
| "Wrap external API calls in try/catch; log via `Logger`." | "Write robust error handling." |
| "Tailwind utilities only; conditional classes via `cn()`." | "Use clean styling patterns." |
| "Throw `NotFoundError` for missing entities; never return null." | "Handle errors appropriately." |

Three options per flagged rule: **anchor** (the user supplies the verb + tool), **drop** (the rule was aspirational; remove it), or **keep as-is** (the user accepts the vagueness; the CLI will continue to flag it in audits). Surface the choice; do not decide for the user. Note each flagged rule in the chat summary.

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

`AGENTS.md` is canonical. Every harness this skill targets reads it, so the
reconciliation job is mostly deletion.

**`CLAUDE.md`.** If it is a symlink, or already a one-line `@AGENTS.md` import,
there is nothing to do. If it is a full second copy that diverges from
`AGENTS.md`, do **not** silently pick a winner: show the user the diff, ask
which side is correct, fold that decision into `AGENTS.md`, and then offer to
replace `CLAUDE.md`'s body with `@AGENTS.md` so the question cannot come back.
That offer is the point of the step — mirroring the two files by hand only
resets the clock on the same drift.

**Per-harness pointer files.** If the repo carries
`.cursor/rules/main.mdc`, `.github/copilot-instructions.md` or
`.windsurf/rules/main.md`, first ask whether they are still needed: Cursor,
Windsurf and every Copilot surface except GitHub.com Chat now read `AGENTS.md`
directly. For the ones the user keeps, update the `Verification:` line and the
non-negotiables block by hand when they change in `AGENTS.md`. There is no
generator, which is exactly why fewer files is the better answer.

### Step 6. Emit and verify

Same as `init` step 7 and 8: write files, run verification, show a short summary.

## Quality bar

- No correct sections were rewritten just because you touched the file.
- Every deprecation has a date and a one-line reason.
- The chat summary names exactly what changed (added, deprecated, kept).
- Cross-harness consistency was checked, not assumed.
- No rule appears in two sections. The anti-duplication sweep ran before the file was written.

## Failure modes

- **Rewriting from scratch.** The whole point of `document` is delta updates. If you find yourself blanking the file, switch to `init` (and tell the user).
- **Trusting the old file.** The old file is the source of *historical truth*. The code is the source of *current truth*. When they disagree, the code wins; the old file gets deprecated.
- **Skipping the git history scan.** Recent commits are the cheapest signal for "what changed lately". Use them.
