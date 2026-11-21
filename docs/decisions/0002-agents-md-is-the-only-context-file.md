# ADR-0002: Emit one AGENTS.md and stop

- **Status**: accepted
- **Date**: 2026-11-21
- **Deciders**: Magnus Nord

## Context

Groundwork's original architecture was `AGENTS.md` canonical, `CLAUDE.md` as a
symlink to it, and five-line pointer files at `.cursor/rules/main.mdc`,
`.github/copilot-instructions.md` and `.windsurf/rules/main.md`. That was the
correct answer in early 2026, when each harness read only its own hardcoded
path and there was no way to reach all of them with one file.

It is not the answer now. `AGENTS.md` is read natively by Claude Code
(v2.1.277+), Cursor, Codex, Copilot and Windsurf. The convention is stewarded
by the Linux Foundation's Agentic AI Foundation and is in 60k+ repositories.
The one surface that still does not read it is GitHub.com Chat.

The evidence that the old architecture had stopped paying for itself was in
this repo. `templates/CLAUDE.md.template` had drifted from
`templates/AGENTS.md.template` in three places — the exact failure the symlink
existed to prevent, in the templates that teach people to prevent it.

## Decision

`init` emits `AGENTS.md` and nothing else by default. A second context file is
written only when the user names one of four reasons: path-scoped rules, an
existing `CLAUDE.md`, GitHub.com Chat, or a multi-package repo. Where a
`CLAUDE.md` must exist, it is a one-line `@AGENTS.md` import, never a symlink
and never a copy.

## Considered alternatives

### Option A: Keep the symlink, demote the pointer files

**Pros**:
- Smaller change; the symlink has worked for the people already using it.
- A `CLAUDE.md` that exists wins over `AGENTS.md` in Claude Code, so a symlink
  guarantees Claude Code reads the canonical content.

**Cons**:
- Symlinks fail on Windows with `core.symlinks=false`, which is why the
  two-file fallback existed and why the drift happened.
- It is a second path to maintain for a file nothing needs any more.

**Why not chosen**:
The `@AGENTS.md` import does the same job, is Anthropic's own documented
recommendation, and works on Windows. A symlink is now a liability with no
remaining benefit.

### Option B: Keep emitting every pointer file, as before

**Pros**:
- Covers every harness, including ones that might regress.
- No decision for the user to make.

**Cons**:
- Four files nobody edits, drifting apart. Hand-maintained by definition —
  there is no generator.
- Teaches a pattern that is now obsolete, in a tool whose argument is that it
  knows what is current.

**Why not chosen**:
This is the item a knowledgeable visitor would notice first. Emitting pointer
files by reflex in late 2026 says the author has not looked at the ecosystem
since spring.

## Consequences

**Positive**:
- The default `init` run produces one file, which is the whole of the output
  and easy to review.
- `agents-claude-sync` has far less to detect, because there is far less to
  drift.
- The decision moved from "which harnesses?" to "does anything here actually
  need a second file?", which is the better question.

**Negative**:
- A team whose Claude Code is configured to `claude-md` only, and who skips the
  question, gets no file Claude Code reads. The question pre-ticks that case
  when `init` finds an existing `CLAUDE.md`, but a fresh repo with that config
  is a gap.
- Existing users following the old guidance now read advice that contradicts
  what they built. `good-practices.md` §11 says so explicitly rather than
  quietly changing.

**Reconsider if**:
A harness this skill targets drops `AGENTS.md` support, or GitHub.com Chat
gains it — the latter would remove the last always-valid reason for a pointer
file.

## References

- `skills/groundwork/foundation/harness-reference.md` — the four reasons, with a `Last verified` date
- `skills/groundwork/foundation/good-practices.md` §11
