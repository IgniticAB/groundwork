---
name: groundwork-adr
description: Author an Architecture Decision Record. Captures the why behind a choice so future agents and humans do not have to re-derive it. Triggers on "write an ADR for...", "document why we chose...", "we just decided X, capture it", "create a decision record", "/gw adr".
---

# `adr` — Architecture Decision Record

ADRs are the externalized intent that prevents the agent from re-suggesting rejected options and prevents the team from forgetting why a choice was made. They are not optional in any non-trivial repo.

Format follows the standard MADR-lite shape: numbered, dated, with status, context, decision, consequences, and a critical negative-space section.

## When to write one

- A non-obvious technical choice was made.
- An obvious technical choice was made for a non-obvious reason.
- A *non-choice* was made deliberately (e.g. "we considered GraphQL and chose to stay with REST").
- A constraint was discovered that will shape future decisions.

When *not* to write one:
- Pure implementation details that the code expresses well on its own.
- Preferences with no real tradeoff (e.g. "we use 2-space indent" — that goes in conventions, not ADRs).
- Decisions that are still being debated. Wait until it is decided.

## What this command produces

A single file: `docs/decisions/<NNNN>-<slug>.md`. Where `<NNNN>` is the next zero-padded number (0001, 0002, ...).

Also: if `docs/decisions/README.md` does not exist, create it. If `docs/decisions/negative-space.md` does not exist, create it (rejections that did not get a full ADR live here).

## The ADR structure

Use `templates/adr.template.md`. Structure:

```markdown
# ADR-<NNNN>: <title>

- **Status**: proposed | accepted | superseded by ADR-XXXX | deprecated
- **Date**: <YYYY-MM-DD>
- **Deciders**: <names or roles>

## Context

What is the situation that forced this decision? Two or three paragraphs. Include the constraints (technical, organizational, time, cost) that narrowed the option space.

## Decision

What did we decide. One paragraph. State it plainly.

## Considered alternatives

For each real option we considered:

### Option A: <name>
**Pros**: ...
**Cons**: ...
**Why not chosen**: ...

This section is the most valuable part of the ADR. It is the negative space.

## Consequences

What does this decision lock in or open up?
- **Positive**: ...
- **Negative**: ...
- **Reconsider if**: <condition under which we should revisit>

## References

Linked tickets, PRs, prior ADRs, external docs.
```

## Input modes

The user can invoke this command three ways. Detect which from their first message; do not ask which mode they want.

**Mode A: live decision (default).** The user describes a decision they are making now. Procedure starts at step 1 below.

**Mode B: from a merged PR.** The user names a PR (URL, number, or branch) or pastes PR data. Triggers on phrases like "ADR for PR #123", "document the decision in this merge", or any GitHub/GitLab PR URL in the message. Use the PR-ingest procedure below before step 1.

**Mode C: from a commit range.** The user names commits ("ADR for the work between abc123 and def456") or a recent area of the repo ("ADR for last week's auth refactor"). Use the commit-ingest procedure below before step 1.

### PR-ingest procedure (Mode B)

Goal: pre-fill as much of the ADR as possible from the PR before asking the user anything. Then ask only what could not be inferred.

1. **Get the PR data.** Try these in order until one works:
   - `gh pr view <number-or-url> --json title,body,commits,files,reviews,comments,headRefName,mergedAt,author` if `gh` is on PATH.
   - WebFetch the PR URL if the agent has web access and the PR is public.
   - Ask the user to paste the PR title, description, file list, and commit messages.
2. **Pre-fill what you can.**
   - **Title**: PR title, rewritten as a decision ("Use Vitest for unit tests") not a topic ("Testing").
   - **Date**: the merge date.
   - **Deciders**: PR author and approving reviewers from the reviews data.
   - **Context**: the PR description, condensed to constraints. Include linked issues if mentioned.
   - **Decision**: derived from the diff and the description. State it plainly.
   - **Consequences**: pull "positive" from the PR description's "why" statements; pull "negative" from review concerns that were accepted with caveats.
3. **Ask only about what is missing.** Almost always: the considered alternatives (PRs rarely document these explicitly) and the "Reconsider if" trigger. Show the user the pre-filled draft and ask:
   > I've pre-filled this from the PR. Two things I couldn't infer:
   > 1. What alternatives did the team consider before choosing this approach?
   > 2. When should this decision be revisited?
4. **Save and cross-link.** Continue from step 5 of the main procedure.

If the agent cannot get the PR data at all (no gh CLI, no web access, user does not paste), fall back to Mode A and tell the user that explicitly.

### Commit-ingest procedure (Mode C)

Similar to Mode B but starting from `git log` and `git diff`:

1. Resolve the commit range. If the user named one ("last week's auth refactor"), grep `git log --oneline --since="7 days ago"` and offer the candidates.
2. Read the commit messages, the diff summary, and any files in `docs/` that changed. Pre-fill the ADR sections.
3. Ask only about alternatives and "Reconsider if".

Mode C is slightly less reliable than Mode B because commits often lack the rationale a PR description provides. Surface lower-confidence inferences to the user and let them correct.

## Procedure

### Step 1. Understand the decision

Mode A only; Modes B and C have already filled this in. Get the user to state:
- What was decided.
- What problem it solves.
- What alternatives were considered.
- Who decided (or which forum decided).

If any of those are vague, ask. An ADR with a hand-wavy "Considered alternatives" is worse than no ADR.

### Step 2. Find the next number

Glob `docs/decisions/[0-9]*.md`, take the max, add one. If none exist, start at 0001. (0001 is conventionally the meta-ADR "we use ADRs"; if you are creating that one too, take 0002 for the real first decision.)

### Step 3. Draft

Fill in the template. Hard rules:

- **Context** has constraints, not just background. Why is this hard? What is making us choose now?
- **Considered alternatives** has at least one rejected option. A decision with no alternatives is a non-decision and does not need an ADR. If the user really only saw one path, document why (e.g. "the only thing that compiles with our constraints").
- **Reconsider if** is named. This is the future-trigger that prevents the ADR from being a tombstone. When the named condition is met, the team knows to revisit.
- **Title** describes the decision, not the topic. "Use Vitest for unit tests" beats "Testing framework". An agent searching ADRs for "should I use Jest?" finds the right one.

### Step 4. Show the draft to the user

Let them edit. ADRs are durable; a rushed ADR is worse than a delayed ADR.

### Step 5. Set status and write

If the decision is already in effect: status `accepted`. If it is still being formalized: `proposed`. If it replaces a previous ADR: `accepted` for the new one, edit the old one to `superseded by ADR-NNNN`.

Write the file. Show the path.

### Step 6. Cross-link

If this ADR creates a rule that belongs in agent context, add a one-liner to `AGENTS.md` (or to a `docs/agents/<area>.md` file if the rule is per-area and the file already exists) that points to this ADR. Example:

```markdown
- Test framework: Vitest (see ADR-0007 for rationale)
```

This way the agent reads the rule in the Project layer and can drill down to the why if it needs to.

### Step 7. Negative-space sweep

If the user mentioned options that were rejected without deep consideration (e.g. "yeah we briefly looked at Bun but never really tried it"), add a one-paragraph entry to `docs/decisions/negative-space.md` for those. They do not deserve a full ADR, but they should not be invisible either.

## Quality bar

- The "Considered alternatives" section names real options the team considered, not strawmen.
- The "Reconsider if" line is named and is specific.
- An agent reading this ADR six months later understands the choice without further context.
- The cross-link from `AGENTS.md` (or a `docs/agents/` file) exists if the decision creates an ongoing rule.

## Failure modes

- **Status: accepted, alternatives: none considered.** This is the most common failure. There were always alternatives; even "do nothing" is an alternative. Surface them.
- **Context paragraph is a brain dump.** Two or three paragraphs, focused on the constraints that forced the choice. Trim everything else.
- **No reconsider-if.** Without it, the ADR is a tombstone. Always name the future trigger.
- **Title is the topic.** Make it the decision.
