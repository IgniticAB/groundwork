# Architecture Decision Records

This directory holds the decisions that shape this codebase. ADRs capture the *why* behind choices so future agents and humans do not have to re-derive it.

## When to write one

- A non-obvious technical choice was made.
- An obvious technical choice was made for a non-obvious reason.
- A *non-choice* was made deliberately (e.g. "we considered X and chose to stay with Y").
- A constraint was discovered that will shape future decisions.

## When not to write one

- Pure implementation details. The code expresses those.
- Preferences with no real tradeoff. Those go in `.context/conventions.md`.
- Decisions still being debated. Wait until decided.

## Format

We use a MADR-lite format. Use `context-engineer adr` to generate one with the right structure.

Each ADR has:

- A number (`docs/decisions/NNNN-slug.md`, zero-padded).
- A status (`proposed`, `accepted`, `superseded by ADR-XXXX`, `deprecated`).
- Context (the constraints that forced this decision).
- Decision.
- Considered alternatives with "why not chosen" for each.
- Consequences with a "Reconsider if" trigger.

## Naming

The title is the decision, not the topic. Good: "Use Vitest for unit tests". Bad: "Testing framework".

## Negative space

Rejected approaches that did not warrant a full ADR go in `negative-space.md`. They are short paragraphs that prevent future agents (and humans) from re-suggesting paths the team already considered and rejected.

## Reading order

ADR-0001 is the meta-decision: "We use ADRs". Read it first.
