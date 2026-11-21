# Good Practices

The practices that high-performing AI-first teams have converged on. Every one of these has a command in this skill that operationalizes it.

## 1. Negative space documentation

Document what was *not* done and why. Future agents (and humans) read this and stop re-suggesting the rejected paths.

Where it lives: in each ADR under "Considered alternatives", or in a dedicated `docs/decisions/negative-space.md`.

Example:

```markdown
## Considered: GraphQL for the public API

Rejected because: our customers are industrial integrators with constrained
dev resources. REST + OpenAPI is what they already know. GraphQL would have
moved complexity from us to them.

Reconsider if: customer profile changes, or we have a strong need for
selective field fetching that REST cannot meet.
```

The "Reconsider if" line is the magic. It tells future engineers when the rejection should be revisited and when it should stay closed.

Command: `adr`.

## 2. Defensive commits

Make a git commit before any large refactor or agent-driven change. The commit is a checkpoint you can return to if the change goes sideways.

This is not version control hygiene; it is data loss prevention. Long agent sessions can touch dozens of files, and without a checkpoint, partial rollback is painful.

State this in the Project layer: "Before any change that touches more than five files, make a checkpoint commit."

Command: `plan` includes a checkpoint step in its template.

## 3. Interface-first development

Define the types, the function signatures, the API contract, *before* the implementation. The agent then has a hard constraint and cannot invent a sprawling abstraction.

Example: for a new endpoint, write the OpenAPI definition first. For a new TypeScript module, write the `.d.ts` first. The implementation follows.

Why it works: the model is good at filling in a defined shape. It is bad at choosing the shape.

State this in the Project layer for type-rich languages.

## 4. Verification-driven logic

Every agent task ships with a verification command. The agent iterates until verification passes.

Examples:
- "Fix the bug in `auth.ts` and run `pnpm test auth` to verify."
- "Implement the function and `mypy` it; `mypy` must pass with no errors."
- "Refactor the component and the existing tests must still pass without modification."

Without verification, you become the reviewer for syntax-level details. With verification, you only review the design.

Command: `verify`.

## 5. Plan Mode discipline

Before any non-trivial implementation, the agent produces a plan. The plan is reviewed and approved as a contract before any code is written.

The plan names:
- What is being built and why
- Which files will be touched
- The proposed approach in two or three sentences
- The verification commands
- The rollback / checkpoint commit hash

State in the Project layer: "For changes touching more than three files or affecting public APIs, run plan mode first."

Command: `plan`.

## 6. Standardized initialization

Every new repo starts with the same scaffolding: `AGENTS.md`, `docs/decisions/`, a pre-commit hook, and the verification commands.

A single command does this so it is not skipped. The skipping is what kills teams: one repo without context files becomes the one where the agent always misbehaves, and then "AI is unreliable" becomes the team's narrative.

Command: `init`.

## 7. Delta updates over rewrites

When a convention changes, do not rewrite the file. Add the new convention with a date, mark the old one deprecated with a date and a reason, and keep both visible.

Why: the *why* of the old convention is often still relevant context. Rewriting erases it.

```markdown
## Test framework

- 2026-04 — Switched to Vitest. Faster, native ESM, drop-in for our Jest tests.
- 2024-08 (deprecated 2026-04) — Jest. Migrated away due to ESM friction.
```

Command: `document` does the delta merge.

## 8. Scoped rules

Rules apply where they make sense. Frontend rules in frontend files; database rules in migrations; nothing applies "globally" unless it really is global (like "no placeholder comments"). The mechanisms — Cursor's `globs`, Copilot's `applyTo`, Claude Code's `paths:` — are in `foundation/harness-reference.md`.

Command: `scope`.

## 9. Least-privilege tooling

Agent access to live systems is partitioned. Read-only context is one server; write actions are another. Destructive actions require human approval.

This is operational, not just security: it also makes the agent's mental model cleaner. "I am in read mode" produces better suggestions than "I have all the tools". Enforcement belongs in the server, not in an annotation or a prompt — `foundation/mcp-principles.md`.

Command: `mcp`.

## 10. Measure conformity

The single metric worth tracking: the share of generated code that passes the
project's own checks (tests, lint, types) without human modification. This skill
publishes no threshold — pick one, write it down, and hold it steady, because
the trend is what tells you anything and a number that moves with the
measurement tells you nothing.

The honest version of this measurement runs each case with *and without* the
context, so you can see what the context actually added
(`foundation/runtime-controls.md` §5).

Command: `audit` reports this as part of the maturity score.

## 11. One canonical file, scoped additions only

A single context file that grows over time becomes a dumping ground. The agent
treats it as mutable and appends narrow, session-specific rules; over weeks the
file is unreadable and the model's attention is diluted.

The fix is structural, and it got simpler. `AGENTS.md` at the repo root is read
natively by every harness this skill targets, so **emit `AGENTS.md` and stop.**
Hand-edited, self-sufficient, capped around 400 tokens (~80 lines). Overflow
goes to `docs/agents/<area>.md`, plain markdown, one area per file, referenced
from "See also" so it is discoverable from the canonical file.

Add a second file only for a reason you can name — path-scoped rules, an
existing `CLAUDE.md`, GitHub.com Chat, or a multi-package repo. The four cases
and what each one takes are in `foundation/harness-reference.md`; they are not
restated here, because a rule in two places is the thing this section is about.

Earlier versions of this skill recommended symlinking `CLAUDE.md` to
`AGENTS.md`. That was right when Claude Code read only `CLAUDE.md`. It is not
any more: a symlink is a Windows liability and a second path to maintain for a
file nothing needs. Where a `CLAUDE.md` already exists — and Claude Code prefers
it when both are present — reduce it to a single `@AGENTS.md` import.

Command: `init` sets up this layout. `audit` flags `AGENTS.md` if it has crept
past the threshold.

## 12. Three-tier boundary layout

The older "out-of-bounds" framing is a single bucket. Real projects have three:

- **Always.** Things the agent does without asking (run fast verification, follow the non-negotiables in `AGENTS.md`).
- **Ask first.** Things the agent proposes before doing (multi-file changes, dependency additions, CI changes, public-API edits).
- **Never.** Hard forbids (generated paths, vendored upstream, anything inside `preserve:start` / `preserve:end` markers). Back each one with a `deny` permission rule where the harness supports it — see `foundation/runtime-controls.md` §4.

State all three explicitly in `AGENTS.md`. The "ask first" tier is the most often missing one; it's also the one that prevents the most scope creep.

## 13. Preservation markers

When a piece of code must not be edited by an agent (legacy compromises,
performance-tuned hot paths, compatibility shims whose subtleties an agent will
miss), wrap it in **`preserve:start` / `preserve:end`** markers, in whatever
comment syntax the file already uses. Every template this skill emits uses that
pair; nothing emits the older `CE:PRESERVE` form.

```ts
// preserve:start — legacy auth flow, removed in v3. Do not modernize.
function legacyHash(input: string): string {
  // ...
}
// preserve:end
```

Always give a one-line reason. Use sparingly; a growing pile is a smell.

Nothing enforces this. The markers are a message to a reader, and an agent that
has not been told to respect them will edit straight through. Where it genuinely
must not happen, a `deny` permission rule on the path is the control and the
marker is the explanation (`foundation/runtime-controls.md` §4).
