# ADR-0001: Record architecture decisions

- **Status**: accepted
- **Date**: <YYYY-MM-DD>
- **Deciders**: <team>

## Context

This codebase is being developed with significant help from AI agents. Agents read the repo to decide what to do; they do not know the history of decisions made before they arrived. Without a written record of *why* choices were made, two things happen:

1. Future agents (and human engineers) re-derive the same conclusions from scratch, often arriving at a different answer because the constraints look different in isolation.
2. Rejected approaches get re-suggested every time the topic comes up.

Both compound into cognitive debt: the gap between the system's structure and the team's shared understanding of why it is structured that way.

## Decision

We record architecture decisions as ADRs in `docs/decisions/`, using the format described in `docs/decisions/README.md`. ADRs are written when a non-obvious choice is made, an obvious choice is made for a non-obvious reason, or a deliberate non-choice was made. Rejected approaches that do not warrant a full ADR go in `docs/decisions/negative-space.md`.

We use the `groundwork adr` skill command to author them, which enforces the format.

## Considered alternatives

### Option A: No formal record

**Pros**:
- Zero overhead.
- Decisions live in PRs and commit messages.

**Cons**:
- PR descriptions are not discoverable months later.
- Agents do not read PR descriptions.
- The *why* is lost the moment the author leaves the team.

**Why not chosen**: This is the default failure mode that ADRs exist to prevent. The cost of writing an ADR is small; the cost of forgetting a decision is large.

### Option B: Confluence / Notion docs

**Pros**:
- Rich formatting, comments, links.
- Familiar to non-engineers.

**Cons**:
- Lives outside the repo, so it drifts from the code.
- Agents working in the repo do not read external systems by default.
- Easy to delete or move; the URL rots.

**Why not chosen**: Decisions need to live with the code so they are read whenever the code is read. External wikis lose this property.

## Consequences

**Positive**:
- Every non-obvious decision has a permanent, in-repo record.
- New team members and new agents can read the ADRs as orientation.
- Rejected approaches stop being re-suggested.

**Negative**:
- Writing ADRs adds a small overhead to the decision process.
- The discipline has to be maintained; ADR-writing decays without enforcement.

**Reconsider if**: The team grows past the point where ADRs are read more often than they are written. At that scale, a more searchable layer (or a curated subset published as a handbook) may be more valuable than the raw ADR list.

## References

- `docs/decisions/README.md` — format and conventions for ADRs.
- `docs/decisions/negative-space.md` — rejected approaches not warranting a full ADR.
- Michael Nygard's original ADR write-up.
