---
name: groundwork-plan
description: Produce a Plan Mode contract before any non-trivial change. Names files touched, approach, verification commands, and rollback. Required for any change touching more than three files, any refactor, any public-API change, or any migration. Triggers on "plan this change", "draft a plan for...", "before I start coding...", "/gw plan", "/plan mode".
---

# `plan` — Plan Mode contract

The agent (or the human) writes a plan *before* writing code. The plan is reviewed and approved as a contract. Code that strays from the plan is rejected; if reality forces a change, the plan is updated first.

The purpose is not bureaucracy. It is cognitive debt prevention: the human stays the architect, the agent is the implementer.

## When this command is required

`AGENTS.md` (set by `init`) usually says: plan mode is required for changes touching more than 3 files, or touching public APIs, or refactors, or migrations. The exact threshold is per-project.

If the user invokes this for something smaller, do not refuse. A two-file change can still benefit from a 5-line plan.

## What this command produces

A single file: `.context/plans/<YYYY-MM-DD>-<slug>.md`. Plus a short chat summary asking the user to approve the plan.

## The plan structure

The structure is non-negotiable. Use `templates/plan.template.md`. Sections:

```markdown
# Plan: <one-line title>

**Status**: draft | approved | in-progress | shipped | abandoned
**Owner**: <user>
**Checkpoint commit**: <hash, or "not yet"; filled in once approved>
**Started**: <date>

## Intent

One paragraph. What is being built or changed, and why. The "why" is the part future readers will need; do not skip it.

## Files touched

Bulleted list. For each file, one phrase about what changes.

## Approach

Two or three sentences. The shape of the change, not the implementation. The implementation belongs in the code; the approach belongs here.

## Verification

The commands that prove the change works. At minimum:
- Tests: `<command>`
- Lint: `<command>`
- Typecheck (if applicable): `<command>`
- Manual check (if applicable): `<one-line how-to>`

## Out of scope

What this change deliberately does not do. This is the negative-space section; agents are good at scope-creeping and this is the lever to stop them.

## Rollback

How to undo this change. Usually `git revert <checkpoint>` is enough; sometimes there are migrations or external systems involved.

## Risks

The things that might go wrong. One line each. Optional but recommended for anything touching shared infra.

## Notes

Anything else worth capturing. Optional.
```

## Procedure

### Step 1. Understand the task

Get the user's description of what they want done. If it is vague, ask one focused question. Do not start writing the plan until you can fill in the "Intent" paragraph confidently.

### Step 2. Read the relevant code

Map the files that will be touched. Do not skip this; the file list in the plan must be accurate, not aspirational. If you find more files than you expected, surface that to the user.

### Step 3. Draft the plan

Fill in each section. The structure is the template; the content is yours.

Hard rules:
- Approach is two or three sentences. Not a design doc.
- Out-of-scope is at least two bullets. Always. The agent's instinct is to expand scope; this section is the constraint.
- Verification names commands that actually run in this repo. If you do not know them, read `AGENTS.md`.
- Rollback is one sentence describing what to do if the change is bad.

### Step 4. Show the plan to the user and ask for approval

Three options:
- **Approve.** Set status to `approved`. Make the checkpoint commit (or ask the user to). Record the hash. Proceed.
- **Edit.** The user wants changes. Make them. Re-show.
- **Reject.** The plan is wrong shape. Discard, ask what changed, draft again.

Do not start coding before approval. This is the entire point.

### Step 5. Make the checkpoint

`git add -A && git commit -m "checkpoint: before <slug>"` or equivalent. Record the hash in the plan. This is defensive: if anything goes wrong during implementation, you can revert to a known-good state.

### Step 6. Implement, verifying as you go

Now (and only now) start writing code. Run the verification commands from the plan after each meaningful step. If verification fails, fix it before moving on.

If the implementation reveals the plan was wrong:
- Stop.
- Update the plan (the file, not just your mental model).
- Re-show it to the user.
- Continue once they re-approve.

This is the loop that prevents drift.

### Step 7. Mark shipped

When the change ships (PR merged, or local change committed), update the plan status to `shipped` and record the merge commit. Keep the file in the repo. It becomes context for future agents: "We did this; here is why."

### Step 8. Prompt for ADRs

Before considering this command done, scan the shipped plan for decisions that should outlive it. A decision is ADR-worthy if any of the following are true:

- The Approach section names a technology, library, or pattern choice that other parts of the system will need to follow.
- The Out-of-scope section explicitly rejected an alternative approach.
- The Risks section names a tradeoff the team accepted.
- A new convention was introduced that `AGENTS.md` (or `.claude/rules/`) does not yet cover.

For each decision detected, surface it to the user:

> This plan made a decision: <one-line summary>. That's the kind of thing that's worth an ADR so future agents know the reasoning. Want me to draft one? (yes / skip / show me more first)

If the user says yes, invoke the `adr` command with that decision as the input. If they say skip, add a one-line entry to `docs/decisions/negative-space.md` capturing the decision and the fact that no ADR was written (this preserves the trail).

Do not write ADRs without asking. The user always decides whether a decision is durable enough to formalize.

If the plan made no ADR-worthy decisions (e.g. a small bugfix that just exercised existing conventions), say so explicitly and skip this step. Do not invent decisions to justify an ADR.

## Quality bar

- The "why" is real. Not "to improve the code", but the specific reason this change is happening now.
- Files-touched list matches what actually gets touched. If it does not, the plan was wrong.
- Verification commands are real and they pass at the end.
- Out-of-scope has at least two bullets and they are specific.
- The plan file survives after the change ships. It is a permanent record.

## Failure modes

- **Plan written after the fact.** This is not a plan; it is a retro. Useful, but not what this command produces.
- **Plan that is a design doc.** Approach is two or three sentences. If it is a page, you are writing the wrong artifact.
- **No out-of-scope.** The agent will scope-creep. The out-of-scope section is the leash.
- **No checkpoint commit.** When the change goes sideways (it sometimes will), you have nothing to revert to.
