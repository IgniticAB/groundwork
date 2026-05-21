---
name: groundwork-onboard
description: Produce a tailored orientation brief that hands off a task to a fresh agent or engineer with the right context, no more. Surfaces the 3 to 5 most relevant ADRs, recent plans, area-specific conventions, verification commands, and any MCP policy that applies. Use when starting a new chat session on a familiar repo, when handing work to a teammate, when a fresh agent joins a long task, or when you want to "compact" a noisy session into a clean briefing. Triggers on "onboard a new agent to this", "brief me on this area", "what context does this task need", "/gw onboard", "handoff to fresh agent".
---

# `onboard` — Orientation brief for a fresh agent or engineer

The "surge staffing" command. Every other command in this skill produces context; this command consumes it and produces a task-specific subset.

The premise: a fresh agent (or human) has zero session history. Reading every ADR, every plan, every convention is wasteful. They need exactly the slice that applies to the task in front of them. This command builds that slice.

## When to use it

- Starting a new chat with a fresh agent on a familiar repo.
- Handing a task to a teammate.
- Opening Claude Code on a project after weeks away.
- Compacting a long, noisy session into a clean restart.
- The repo's context files are good but voluminous and the agent does not need all of it.

## What this command produces

A single markdown file: `.context/briefings/<YYYY-MM-DD>-<slug>.md`. Optionally, the briefing is also pasted inline into the chat for immediate use.

The structure:

```markdown
# Briefing: <task title>

**For**: <agent or person>
**Generated**: <date>
**Task**: <one-line description>

## What you're working on
<1 paragraph: the task, the why, the user-facing outcome>

## What you need to know about this repo
<3-5 sentences max. Stack, package manager, the one thing that's load-bearing for this task.>

## Conventions that apply to this area
<Only the rules that touch the files you'll edit. Not the whole repo's conventions.>

## Decisions worth knowing
<3-5 ADRs, with one-line summary each. Linked.>
<+ negative-space callouts if any rejected paths are likely to be re-suggested.>

## Recent activity in this area
<Last 5-10 commits in the files/dirs you'll touch. Date, author, one-line subject.>

## How to verify your work
<Fast verification: command. Full verification: command. Anything area-specific.>

## What's out of scope
<Explicitly. The agent's instinct is to expand; this section is the leash.>

## Tools you have access to
<Relevant MCP servers if any. Note any HITL requirements.>

## Where to look for more
<Pointers to AGENTS.md, .claude/rules/, docs/decisions/, full plan archive.>
```

## Procedure

### Step 1. Understand the task

Ask the user, in one focused question:

> What are you (or the fresh agent) about to work on? One sentence is fine. If you have a ticket or issue, paste the link or summary.

If they cannot summarize, push back. A briefing for an undefined task is a generic context dump, which is what this command exists to avoid.

### Step 2. Identify the relevant area

From the task description, figure out which files/directories the work will touch. Heuristics:

- Named features ("the auth flow") → grep for the feature keyword across the repo.
- Named files or directories ("the dashboard component") → glob them directly.
- Bug reports with a stack trace → use the trace's file paths.
- Vague tasks ("clean up the API layer") → ask one more focused question; do not guess.

You should be able to list 3 to 10 files or directories with confidence before continuing. If you cannot, the task is too vague and the briefing will be a guess. Push back.

### Step 3. Pull the relevant ADRs

Glob `docs/decisions/*.md`. For each:

- Read the title and the first paragraph.
- Decide if it applies to the area from step 2.
- Score relevance: "directly affects" (3), "related but tangential" (2), "background context" (1).

Pick the top 3 to 5 by relevance, capped at 5. Anything beyond 5 is noise.

If `docs/decisions/negative-space.md` exists, scan it for entries that might prompt the agent to re-suggest a rejected path. Include any matches.

### Step 4. Pull recent plans

Glob `.context/plans/*.md`. Sort by date desc, take the most recent 2 to 3 that touch the area from step 2. If none touch the area, skip the section entirely (do not pad).

### Step 5. Subset the conventions

Read `AGENTS.md` and any files in `.claude/rules/` that match the area. Pick out the rules that apply to the files/directories from step 2. If nested `CLAUDE.md` files exist in the area, prefer those (they are already scoped).

Do not include rules that do not apply. The briefing's value is in what it leaves out.

### Step 6. Pull recent activity

If git is available, run `git log --oneline --since="14 days ago" -- <files-from-step-2>`. Take the last 5 to 10 commits. Include author, date, and subject line. This gives the agent a sense of recent direction without making them read diffs.

### Step 7. Identify verification commands

Pull the fast and full verification commands from `AGENTS.md`. If any are scoped to the area (e.g. `pnpm test src/auth/`), prefer the scoped form.

### Step 8. Identify relevant tools

If `docs/mcp-policy.md` exists and any of the named systems are relevant to the task, include them in the "Tools" section. Note HITL requirements explicitly: the fresh agent does not know what is gated.

### Step 9. Define out-of-scope

For the named task, what would scope creep look like? Two or three bullets. Examples:

- "Do not refactor the surrounding auth middleware while fixing this specific bug."
- "Do not migrate the test framework as part of this change."
- "Do not touch the database schema."

If you cannot name what is out of scope, ask the user. The agent's default is to expand; this section is the constraint.

### Step 10. Write the briefing

Use `templates/briefing.template.md`. Substitute in the content from steps 1 to 9.

Total length: aim for 300 to 600 words. If you are over 800, you have included too much and the briefing has failed at its job. Cut. The right test: a fresh agent reads this and starts work in under 2 minutes.

### Step 11. Deliver

Two delivery modes:

- **Inline**: paste the briefing into the chat. Use this when the user is about to start working in the same session.
- **File only**: just save to `.context/briefings/`. Use this when the user is preparing a handoff and will share the file with someone else.

Default to inline; ask if the user wants file-only.

## Quality bar

- The briefing is under 600 words.
- Every section is task-relevant. If a section has nothing to add, the section is omitted, not padded.
- ADRs are listed with one-line summaries, not just titles.
- Out-of-scope has at least two bullets.
- Verification commands are real and work in this repo.

## Failure modes

- **Generic context dump.** If the briefing reads like a tour of the whole repo, it has failed. Cut to the area-specific content.
- **No out-of-scope.** Without it, the agent scope-creeps. Always include.
- **Padding ADR list to 5.** If only 2 ADRs are relevant, the list has 2 entries. Quality over count.
- **Briefing without a task.** If you cannot summarize the task in one sentence, you do not have enough to write a briefing. Ask, do not guess.
