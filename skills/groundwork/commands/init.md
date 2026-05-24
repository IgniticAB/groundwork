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
- `docs/decisions/` directory with a README and the negative-space starter. A first ADR is **not** auto-created; the user can opt in at the question step or write one later with `groundwork adr`.
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

### Step 2. Detect stack and sample the code

Only after Step 1 confirmed this is a fresh init, read the repo for context that frames the upcoming questions.

**Stack detection (manifests and scripts).**

- Look for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, etc. Identify the primary language(s) and package manager(s).
- Read scripts (`package.json#scripts`, `Makefile`, `pyproject.toml#tool.poetry.scripts`) to find test, lint, build, run commands.
- Check for `README.md` and skim it for stack and conventions clues.

**Code sampling (the missing step in most context tooling).** Pick up to 25 recent source files and read them. Stack-aware:

```
git log --since="60 days ago" --name-only --diff-filter=AM --pretty=format: \
  | sort -u | head -100
```

Filter to source extensions for the detected stack (`.ts`, `.tsx`, `.py`, `.rs`, `.go`, etc.; skip tests, generated files, lockfiles). Read the top 15 to 25. Note the dominant patterns:

- **Component / module shape.** Functional vs class. Default vs named exports. File-per-thing vs barrel.
- **Error handling.** Throw vs return-null vs Result/Either. Logged or silent.
- **Import style.** Named vs default vs namespace. Absolute vs relative.
- **Validation boundaries.** Where Zod / Pydantic / etc. is used.
- **Test colocation.** Sibling `*.test.ts` vs separate `tests/` directory.
- **File naming.** kebab-case, camelCase, PascalCase, snake_case.
- **Comment density and style.** JSDoc, docstrings, none.

For each pattern that is dominant (>70% of sampled files agree), keep a one-line note plus a representative real-file example. These become the candidate style rules in Q3.

If git history is empty or shallow (fresh repo, single commit), skip the sample and tell the user "no source files yet, Style rules will rely on Q3 free text only."

Build a short summary of what you found (stack + 2 to 4 most useful patterns) and show it to the user before asking questions. Four or five lines max. This proves you read the repo and frames the questions.

### Step 3. Ask

Use AskUserQuestion (or numbered options in prose if unavailable). Seven questions, in order. Each is scoped tightly; Q6 and Q7 are skippable in one click.

1. **Which harnesses should I emit files for?** Multi-select. Options: Claude Code, Cursor, Codex / generic, GitHub Copilot, Windsurf. Recommend the ones the user most likely uses given their tooling; do not assume.
2. **Which verification commands should the agent run?** Show the ones you detected as preselected. Common shapes: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pytest`, `cargo test`, `go test ./...`. Let the user adjust. Separate **fast** (after each change) from **full** (before declaring done).
3. **What style rules should I bake in?** Two parts.
   - **Part 1: confirm detected patterns.** Show the 3 to 6 candidate Style rules you derived from the Step 2 code sample, each with a real example from a real file. For each, ask: keep / drop / edit. Defaults to "keep." Example presentation:

     > Detected: **functional components only** (15 of 18 components sampled use function-form; class form only in `src/legacy/`).
     >
     > Example (`src/components/Card.tsx`):
     > ```tsx
     > export function Card({ children }: CardProps) { … }
     > ```
     >
     > Keep / drop / edit?

   - **Part 2: add anything missed.** Free text, short. "Any other rule you want enforced that I did not pick up?" Default empty.

   The four old multi-select defaults (no-placeholder, plan-mode-for->3-files, defensive-commits, interface-first) move to Non-negotiables, not Style; they always apply and do not need confirmation.
4. **Three-tier boundaries.** Free text, three slots, default empty: **Always** (things the agent does without asking), **Ask first** (things the agent proposes before doing), **Never** (paths the agent must not touch, e.g. `infra/terraform/`, `vendor/`, anything generated).
5. **Symlink CLAUDE.md to AGENTS.md, or keep two files?** Default symlink (single canonical source; lower drift). Offer the two-file fallback for Windows users or any repo with `git config core.symlinks=false` set. If the user does not know which they want, default to symlink and mention they can switch later.
6. **Any approaches you have explicitly rejected?** (Skippable.) "Mention 1 to 3 if so. They seed `docs/decisions/negative-space.md` so the agent stops suggesting them. Examples: 'we considered Redux and stayed with Context API', 'we briefly tried tRPC but reverted'." Free text. Default empty (the negative-space file ships as a stub the user can populate later).
7. **Any code that must not be modified by an agent?** (Skippable.) "Legacy compromises, performance-tuned hot paths, compatibility shims. Naming the path is enough." Free text. If filled, Step 4 adds a Preservation entry to AGENTS.md naming those paths, with a one-line reason if the user provided one. If empty, the standard "Preserved regions" paragraph about CE:PRESERVE markers stays in but no specific paths are listed.
8. **Want me to stub a first ADR for any past decision?** (Skippable.) Most users skip and write their first ADR with `groundwork adr` when a real decision arrives. If you do want one now, give a short title (e.g. "Use pnpm across the monorepo") and one or two sentences of context. Default: skip. If filled, Step 6 generates `docs/decisions/0001-<slug>.md` from `templates/adr.template.md` using the user's title and context.

Do not ask more than eight. Do not ask things you could have detected from the repo.

### Step 4. Emit `AGENTS.md`

Write `AGENTS.md` from `templates/AGENTS.md.template`, filling in the user's answers directly. There is no intermediate canonical file — `AGENTS.md` *is* the canonical file.

Sections to populate (do not deviate from this order):

- **What this project is** — one paragraph, from the detected stack and README hints.
- **Stack** — language(s), package manager, runtime/framework, one line each.
- **Verification** — fast (after every change) and full (before declaring done) commands the user picked.
- **Non-negotiables** — universal procedural rules, stated **abstractly**, no triggers or path scopes. Default set (always emitted, no user input needed): "Use plan mode when any Ask-first condition triggers", "No placeholder comments", "Use `<pkg-mgr>` only", "Run the fast verification after every meaningful change". **Do not list plan-mode triggers here** — those belong in Boundaries → Ask first.
- **Style** — three to six rules drawn from Q3. Each rule built from a Q3 Part 1 confirmed candidate (with the real-file example as the Preferred block) or a Q3 Part 2 free-text answer. Do not invent rules the user did not pick. Each rule must be behaviourally anchored (see contract below); reject vague rules at write time.
- **Boundaries** — the three-tier slots from Q4, with strict scope per tier:
  - **Always**: path- or area-scoped automatic actions only. **Not** universal rules — those are Non-negotiables.
  - **Ask first**: owns the trigger list. Default first bullet: ">3 files, public APIs, refactors, migrations". Append project-specific triggers from Q4.
  - **Never**: forbidden paths or destructive actions. Default empty if Q4's Never slot was empty.
- **Preserved regions** — one paragraph explaining the `preserve:start` / `preserve:end` markers. If Q7 named specific paths, add them as a short bulleted list inside this section with the user's reason (or "legacy / do not modernise" as the default reason).
- **See also** — pointers to `docs/agents/` (the overflow location; mention it even if the directory does not yet exist, so future readers know where to add per-area conventions) and `docs/decisions/`. Do not pre-seed a `docs/mcp-policy.md` reference here; the `mcp` command adds it when (and only when) it creates the policy file.

**The non-duplication contract.** Each rule belongs in exactly one section. Before emitting, scan the draft: if the same rule (or near-paraphrase) appears in two sections, delete the one in the lower-priority section. Common offenders:

| Smells like... | Belongs in | Not in |
| --- | --- | --- |
| ">3 files / public API / migration triggers" | Boundaries → Ask first | Non-negotiables |
| "Run fast verification" (universal) | Non-negotiables | Boundaries → Always |
| "Path-scoped auto-actions" (e.g. preserve BOM) | Boundaries → Always | Non-negotiables |
| "Forbidden paths" | Boundaries → Never | Non-negotiables |

The CLI rule `agents-md-duplication` will flag the common patterns post-hoc. The init contract is what prevents them at write time.

**The anchored-rule contract.** Every Style rule must be behaviourally anchored: it names a verb plus a specific technology, command, or pattern. Reject vague rules at write time. If the agent cannot anchor a rule, drop it rather than ship it. The bar:

| Anchored (ship) | Vague (drop or rewrite) |
| --- | --- |
| "Wrap external API calls in try/catch; log via `Logger`; never swallow." | "Write robust error handling." |
| "Tailwind utilities only; conditional classes via `cn()`." | "Use clean styling patterns." |
| "Vitest; assert on user actions; run `pnpm test:coverage` before staging." | "Maintain high test coverage." |
| "Throw `NotFoundError` for missing entities; never return null." | "Handle errors appropriately." |

Anchored rules carry a verb, a named tool or pattern, and a verification path. Vague rules carry an adjective and hope. Same goes for Boundaries entries: "edit `kubernetes/`" beats "edit infrastructure".

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

Always create these two files from templates in `templates/`:

- `docs/decisions/README.md` — copy from `templates/decisions-readme.template.md`. Explains the ADR format and when to write one.
- `docs/decisions/negative-space.md` — copy from `templates/negative-space.template.md`. Starter file for rejected approaches that do not warrant a full ADR. If Q6 named any rejected approaches, append one short bullet per answer to this file before saving so it is not a stub from day one (one to three sentences per bullet; the user can elaborate later).

**Conditional first ADR.** Only if Q8 was answered with a title and context, also create:

- `docs/decisions/0001-<slug>.md` — copy from `templates/adr.template.md`. Slug is a kebab-case shortening of the user's title (e.g. "Use pnpm across the monorepo" → `use-pnpm-across-the-monorepo`). Fill in the title, today's date, `Status: accepted`, `Deciders` (best inference from git or "team"), and the user's one-to-two-sentence context. Leave the Decision, Considered alternatives, and Consequences sections as stub prompts the user will flesh out — say so explicitly in the chat summary ("0001-<slug>.md is stubbed; fill in the Decision, Alternatives, and Consequences sections when you can").

If Q8 was skipped, do not create any ADR file. The user can write their first one any time with `groundwork adr`.

Subsequent ADRs use `templates/adr.template.md` and are authored via the `adr` command.

### Step 7. Set up the pre-commit hook

Create `.context/hooks/check-context.sh` from `templates/hook.sh.template`. Make it executable. The hook does three things: warn on `package.json#packageManager` drift vs `AGENTS.md`, require an ADR (or a reference to one) on multi-file commits, and require a valid Status on staged ADRs. It does **not** enforce parity between any context files.

Wire it up only if the repo already uses `husky`, `pre-commit`, or `lefthook` — detect this. If a runner is present, add the hook entry directly and tell the user it is wired in.

If none is present, leave the hook script in place and report to the user, using this exact framing:

> No hook runner detected (`husky`, `pre-commit`, `lefthook`). The hook script is in place at `.context/hooks/check-context.sh` but is not wired into anything yet. To wire it up, run one of:
>
> - **Node repo, macOS/Linux:** `npx husky init && echo 'sh .context/hooks/check-context.sh' >> .husky/pre-commit`
> - **Node repo, Windows PowerShell:** `npx husky init; Add-Content .husky/pre-commit 'sh .context/hooks/check-context.sh'`
> - **Python repo:** `pip install pre-commit && pre-commit install` (then add the hook entry to `.pre-commit-config.yaml`)

Pick the closest match to the user's repo. Do not silently add a new tool to the repo. Suggest, do not install. The platform only changes the install-command syntax; the decision (suggest vs install) depends on whether a hook runner was already present, not on the operating system.

### Step 8. Verify

Run the fast verification command the user picked. If it fails, show the failure clearly and stop. The agent should see the same failures the user does. (If the user said "I know lint is broken, just continue", proceed and add a note to `AGENTS.md`'s Non-negotiables section flagging the known-failing check.)

### Step 9. Report

A short summary:
- Files created (with paths the user can click).
- Verification status.
- One-line next moves: "Try `groundwork plan` next time you have a change touching multiple files."

No long postamble.

## Quality bar

- `AGENTS.md` is under ~80 lines and self-sufficient. It does not delegate to a separate canonical-conventions file; the only legitimate "see also" targets are `docs/agents/` (overflow) and `docs/decisions/`. `docs/mcp-policy.md` is added by the `mcp` command if and when it creates the policy.
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
