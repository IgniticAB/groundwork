# ADR-0001: Ship one skill with ten commands rather than ten skills

- **Status**: accepted
- **Date**: 2026-05-18
- **Deciders**: Magnus Nord

## Context

Groundwork does ten distinguishable jobs: bootstrap a repo, audit it, document
it, plan a change, author an ADR, scope rules, design MCP access, bake in
verification, brief a fresh agent, apply a remediation plan. The Agent Skills
format would let each be its own skill.

The constraint that decides it is how a harness chooses a skill. Every skill's
`description` sits in context from session start; only the body loads on use.
Ten skills means ten descriptions competing to match the user's intent, and
they overlap heavily — `init`, `document` and `verify` all write to
`AGENTS.md`, and a user who says "fix our AI setup" has not told anyone which
one they meant. Mis-routing is not a small cost here: `init` on a repo that
needed `document` overwrites files that had history in them.

## Decision

One skill named `groundwork`, with ten commands as files under `commands/`.
`SKILL.md` is a dispatcher: it names the ten, and the agent opens exactly one.

## Considered alternatives

### Option A: Ten separate skills

**Pros**:
- Each is independently installable; a user who only wants `adr` gets `adr`.
- Descriptions can be narrow and specific, which is what the matcher wants.

**Cons**:
- Ten overlapping descriptions in context at all times.
- Shared foundation would have to be duplicated into each, or published
  separately and linked — and a skill whose links point outside itself breaks
  when installed alone.
- Version skew between skills that assume the same vocabulary.

**Why not chosen**:
The overlap is the problem. These commands are not ten tools that happen to
ship together; they are ten moves in one method, and they share a foundation
that only makes sense whole. Splitting them would mean either duplicating that
foundation ten times or breaking it apart, and both are worse than one
description the matcher has to work slightly harder on.

### Option B: One skill, no commands — a single long procedure

**Pros**:
- Simplest possible structure.
- No dispatch step to get wrong.

**Cons**:
- Every invocation loads every procedure, including the nine the user did not
  want.
- The file would be thousands of lines, which is the skill's own
  anti-pattern #1.

**Why not chosen**:
It fails the thing this skill teaches. A tool that cannot practise its own
first rule is not evidence of anything.

## Consequences

**Positive**:
- One entry in the skill menu, one description to keep sharp.
- `foundation/` is written once and every command assumes it.
- Commands can reference each other by name without a dependency graph.

**Negative**:
- The description must carry trigger text for all ten commands, which pushes it
  long — currently around 1,280 of the 1,536 characters a host will accept.
- A user who wants only one command installs all ten.
- Dispatch can go wrong, so `SKILL.md` has to tell the agent to say which
  command it picked and why.

**Reconsider if**:
The description can no longer fit the trigger text for every command inside the
host's character limit, or if usage shows one command being invoked far more
than the rest — at which point that one is a skill and the rest are a skill.

## References

- `skills/groundwork/SKILL.md` — the dispatcher
- `foundation/anti-patterns.md` #1 — monolithic prompt bloat
