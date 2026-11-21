---
name: groundwork-scope
description: Generate file-pattern-scoped rules so the right context loads for the right files. Use this when the repo has multiple stacks (frontend + backend, app + infra), or when global rules keep firing in the wrong places. Triggers on "scope these rules", "per-directory rules", "frontend rules separate from backend", "/gw scope".
---

# `scope` — Scoped rules per file pattern

A single `CLAUDE.md` or `.cursorrules` is fine for a single-stack repo. The moment you have a frontend and a backend, or an app and infra, or multiple languages, scoped rules become essential. Without them, the agent sees the SQL conventions while editing a React component and gets distracted.

## What this command produces

Per-harness, in priority order:

- **Cursor**: `.cursor/rules/<area>.mdc` files with `globs` frontmatter. This is the harness with the cleanest scoping; it is the reference shape.
- **Copilot**: `.github/instructions/<area>.instructions.md` files with `applyTo` frontmatter.
- **Claude Code / Codex / generic**: nested `CLAUDE.md` or `AGENTS.md` files at directory boundaries. The agent reads the nearest one when working on a file.

For each area the user identifies, emit one file per targeted harness.

## Before you emit files

Read `reference/harness-detail.md` once you know which harnesses you are
targeting. It carries the per-harness paths, frontmatter schemas and limits that
`foundation/harness-reference.md` deliberately leaves out. Do not emit a file at
a path you have not checked there — the cost of a wrong path is a context file
no harness ever reads, which looks like the agent ignoring the rules.

## Procedure

### Step 1. Map the repo

Glob the top-level directories. For each that contains source code (skip `node_modules`, `vendor`, `.git`, build outputs), note:
- The primary language(s).
- The conventions that look different from the rest of the repo (different test framework, different style, different patterns).

Build a short summary and show it. This is the same "show before asking" pattern from `init`.

### Step 2. Ask: which areas need their own rules?

Use AskUserQuestion. Multi-select, with detected candidates as the options. Common splits:

- `src/components/` — UI components
- `src/api/` or `app/api/` — backend routes
- `db/migrations/` — database migrations
- `infra/` or `terraform/` — infrastructure
- `scripts/` — dev tooling
- `tests/` or `e2e/` — testing

Add any others you detected. Include "All of these as one set" as an option (some users want every area scoped at once).

Also ask: **which harness(es)?** If `AGENTS.md` already names the target harnesses (or you can infer them from which pointer files exist — `.cursor/rules/`, `.github/copilot-instructions.md`, `.windsurf/rules/`), default to those.

### Step 3. For each area, gather the rules

Two sub-steps per area:

a) **Detect**. Read a sample of files in the area. What conventions are already followed that the agent should respect? (Specific test framework? Specific component patterns? Specific imports avoided?)

b) **Ask**. Show what you detected and let the user confirm/edit/add. Three or four conventions per area is usually enough; more is bloat.

### Step 4. Write the scoped files

For each (area × harness), emit one file.

**Cursor rule types.** Cursor activates `.mdc` files four ways. Use the narrowest one that works: a rule costs tokens on every request it matches.

| Type | Frontmatter | Typical use |
| --- | --- | --- |
| Always Apply | `alwaysApply: true` | Core stack metadata, framework pins |
| Apply to Specific Files | `alwaysApply: false` + `globs` | Component libraries, ORM patterns, test files |
| Apply Intelligently | `alwaysApply: false` + `description`, no `globs` | Integration rules, auth flows |
| Apply Manually | neither `globs` nor `description` | Referenced with `@rule-name`. Rare migrations, onboarding |

Names are Cursor's own, from its rule-type dropdown. A plain `.md` file in `.cursor/rules/` is ignored; the `.mdc` extension is required.

**On body length.** Cursor documents one limit: keep a rule under 500 lines, and split larger ones into composable rules. It publishes **no** per-trigger word or token budget. Do not quote one as if it were a product limit. The useful discipline is narrower globs, not shorter prose: a 300-line rule scoped to `db/migrations/**` costs nothing when editing React. If a rule is long *and* broad, split it by path, or move long examples into `docs/agents/<area>.md` and reference them.

Templates:

**Cursor** (`.cursor/rules/<area>.mdc`):

```markdown
---
description: Conventions for <area>
globs:
  - <glob 1>
  - <glob 2>
alwaysApply: false
---

# <Area> conventions

[3-5 rules with Preferred/Avoid pairs, sized to fit the trigger budget above]

## Verification
[The specific commands that verify changes in this area]
```

**Copilot** (`.github/instructions/<area>.instructions.md`):

```markdown
---
applyTo: "<glob>"
---

# <Area> conventions
[same body as Cursor file]
```

**Claude Code / Codex** (nested `CLAUDE.md` or `AGENTS.md` at the area's directory root):

Plain Markdown, no frontmatter. The nested location *is* the scoping.

### Step 5. Reconcile with the top-level file

The top-level `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/main.mdc` should keep only the truly global rules. Anything that is now in a scoped file should be removed from the top level (or referenced).

Do this carefully: read the top-level file, identify rules that are now duplicated in scoped files, and update the top-level file to either remove them or replace them with a pointer like:

> Frontend conventions live in `.cursor/rules/frontend.mdc`. Backend in `.cursor/rules/backend.mdc`.

### Step 6. Verify

Pick one file in each newly-scoped area. Open it and check (mentally or by asking the agent to dry-run) that the agent now sees the scoped rules. Cursor will show which rules are active; Claude Code's nested file is loaded automatically by the file's path.

### Step 7. Report

Files emitted, areas scoped, the cleanup done at the top level. Two or three lines.

## Quality bar

- Every scoped file has 3 to 6 rules; not 1, not 15.
- Globs are accurate. Test by listing matching files.
- The top-level file is leaner after this command than before.
- Every rule has a Preferred/Avoid pair or a verification command attached.

## Failure modes

- **Same rule in two scopes.** If a rule applies to both frontend and backend, it is global. Put it at the top, not in both.
- **Glob too broad.** `src/**/*` is not a scope; it is the whole project. Use it only if the rule really is universal.
- **Glob too narrow.** A single file does not need its own scope. Inline-comment it instead.
- **Forgetting to clean up the top-level file.** Scoping without removing duplicates is just adding more files for the agent to read.
