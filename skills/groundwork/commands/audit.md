---
name: groundwork-audit
description: Score the repo's context engineering maturity across the five layers and produce an action plan. Use when the user asks "is my repo AI-ready?", "how good is our context setup?", "audit our CLAUDE.md", or before a major migration / handoff / new-hire onboarding. Also triggers for "/gw audit" and "context audit".
---

# `audit` — Score and find gaps

A structured assessment of how well the repo's information environment serves an AI agent. Produces a maturity score per layer, names the gaps, and recommends the next two or three moves.

## What this command produces

A single file: `docs/context-audit-<YYYY-MM-DD>.md`. Plus a short summary in the chat.

The audit file structure:

```markdown
# Context Engineering Audit — <date>

## Overall maturity: <0-100>

## Layer scores

| Layer | Score (0-5) | Notes |
| --- | --- | --- |
| System | x | one line |
| Project | x | one line |
| Codebase | x | one line |
| Session | x | one line |
| Tooling | x | one line |

## Findings

### P0 — fix before next agent session
- ...

### P1 — fix this sprint
- ...

### P2 — backlog
- ...

## Conformity check

[Result of running the project's own verification on a sample agent-generated change, if possible]

## Recommended next commands
1. ...
2. ...
3. ...
```

## Procedure

### Step 1. Map the repo

Read what exists. Do not skip this step; without it the audit is fiction.

For each of the five layers:

- **System.** Is there a global persona or guardrails file? (For Cowork: user preferences in memory.) Usually nothing in the repo for this; that is fine.
- **Project.** `AGENTS.md` (canonical)? `CLAUDE.md` (symlink or hand-mirrored)? `.cursor/rules/`? `.github/copilot-instructions.md`? `.windsurf/rules/`? `docs/agents/` (harness-agnostic overflow)? `.claude/rules/` (optional Claude Code auto-loading layer)? Read them; note their length and last-modified date. Key quality signals for `AGENTS.md`: exists, under 80 lines (soft) / 200 (hard), has Verification + Non-negotiables sections, has three-tier Boundaries, references `docs/agents/` if it's overflowing, **no rule restated across two sections** (plan-mode triggers should only appear under Boundaries → Ask first, not also under Non-negotiables).
- **Codebase.** Is there a top-level README that orients an agent? A `docs/architecture.md`? An ADR directory? A glossary? File maps? Are the conventions in the Project layer actually followed in the code?
- **Session.** Not applicable to a static audit (Session is transient). Note this and move on.
- **Tooling.** MCP server configuration? A `mcp-policy.md`? Are credentials scoped? Is there a pre-commit hook for context?

### Step 2. Score each layer

For each layer (skip Session), 0 to 5:

- **0**: Nothing. Layer does not exist in this repo.
- **1**: A file exists but is stale, contradictory, or generic.
- **2**: A file exists, is correct as far as it goes, but is missing several of the standard sections.
- **3**: The layer is set up reasonably; minor gaps.
- **4**: Solid. Follows the patterns in `foundation/`; current with the code.
- **5**: Exceeds the standard. Includes negative-space docs, scoped rules per area, ADRs that read as production-grade context.

Overall maturity: weighted average, with Project weighted 2x and the others 1x. Convert to a 0-100 scale for readability.

### Step 3. Run the conformity check

If you can:

1. Pick a small, low-risk task that the agent could plausibly handle (e.g. "add a new utility function with tests"), or use an existing TODO if present.
2. Have the agent attempt it in a scratch branch / worktree.
3. Run the project's verification commands on the result.
4. Record whether it passed without modification.

If you cannot run this (no scratch environment, no obvious task, the user said skip it), say so explicitly in the report. Do not fabricate a result.

### Step 4. ADR-coverage scan

Read the last 30 days of merge commits (`git log --merges --since="30 days ago" --name-status`). For each merge:

- Count source files touched (ignore docs, tests-only, config-only).
- Detect "decision-shaped" merges: more than 5 source files touched, OR the merge message mentions choosing/picking/migrating/switching, OR a new top-level directory was added.
- For each decision-shaped merge, check whether an ADR was added in the same merge (`docs/decisions/NNNN-*.md`) or referenced in the commit message.

Every decision-shaped merge without an ADR becomes a P1 finding with the merge SHA, the date, and a one-line reason for flagging it. Cap at the 10 most recent so the report stays readable.

For each finding, include a one-line "next step" pointing at the `adr` command's PR-ingest mode (Mode B): `groundwork adr from PR <url>`. The user can then convert the missing-ADR finding into an actual ADR with one invocation, instead of starting from scratch.

If the user pushes back ("that wasn't really a decision"), accept it; an audit is a starting point, not a verdict.

### Step 5. Findings, sorted by priority

Walk the anti-patterns from `foundation/anti-patterns.md` and check each one against what you mapped. Combine with the ADR-coverage findings from step 4. Priority:

- **P0**: anything that will make the agent actively do the wrong thing right now (stale stack info, contradictory rules, missing verification commands, exposed credentials in an MCP config).
- **P1**: anything that produces silent drift over weeks (missing ADRs flagged in step 4, no scoped rules, no pre-commit hook, oversized CLAUDE.md, AGENTS.md and CLAUDE.md out of sync).
- **P2**: niceties (negative-space docs are sparse, conventions could be more example-driven).

For each finding, name the specific file or absence. Vague findings ("documentation could be better") are not findings; they are vibes. Reject your own vague findings before they reach the report.

#### Context Rot check (cross-file consistency)

Beyond the per-file anti-patterns, the audit also looks for the four Context Rot patterns named in `foundation/cognitive-debt.md`:

- **Poisoning**: any `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/*` mention of a package manager, framework version, or API that no longer matches `package.json` (or equivalent). The CLI's `stale-claude-md` rule catches most of these; the audit confirms.
- **Distraction**: rules at the top level that apply to one area only. If a global rule says "use Tailwind utility classes" but the repo has a Python backend that doesn't render UI, the rule distracts when editing backend files. Flag for `scope`.
- **Confusion**: domain terms that the codebase uses interchangeably or contradictorily across context files. Example: `AGENTS.md` says "User" while `.cursor/rules/db.mdc` says "Account" for the same entity. Flag specifics.
- **Clash**: contradictions between context files. Example: `AGENTS.md` requires Vitest, but `.cursor/rules/test.mdc` mentions Jest. The pre-commit hook should catch most of these; if it didn't, surface as P0.

Each Context Rot finding gets a one-line description plus the specific files in conflict. The recommended next command for clashes is usually `document` (delta-merge to resolve) or `scope` (if a rule should have been scoped from the start).

#### Cross-section duplication in `AGENTS.md`

A subtler Confusion pattern: the same rule restated under two H2 sections inside `AGENTS.md` (e.g. plan-mode triggers in both Non-negotiables and Boundaries → Ask first; "run fast verification" in both Non-negotiables and Boundaries → Always). The agent reads the union, so duplication burns attention and creates near-miss paraphrases that drift apart over edits.

The CLI's `agents-md-duplication` rule catches the common patterns (plan-mode triggers, verification mentions, package-manager mentions) appearing under multiple sections. Surface its findings as P1. The fix is to move each rule into exactly one section per the strict scope:

- Universal procedural rules → Non-negotiables only.
- Plan-mode triggers and other "stop and propose" gates → Boundaries → Ask first only.
- Path-scoped automatic actions → Boundaries → Always only.
- Forbidden paths → Boundaries → Never only.

### Step 6. Recommended next commands

Pick the two or three commands from this skill that, if run, would address the highest-priority findings. Common combos:

- No context files at all → `init`.
- Has CLAUDE.md but stale → `document`.
- CLAUDE.md is good but no verification → `verify`.
- Multiple stacks in one repo with rules firing everywhere → `scope`.
- About to expose the agent to production systems → `mcp`.
- Several recent big decisions undocumented → `adr` for each.

Limit to the top 3. Do not list six.

### Step 7. Report

Save the file. In chat, show:
- Overall score (one number).
- Layer scores (one line).
- The top three findings.
- The recommended next commands.

Keep the chat output to under 15 lines. The detail lives in the file.

## Quality bar

- Scores are defensible. You can point at the evidence for each one.
- Findings are specific (filename + line, or specific absence).
- Recommendations are concrete commands, not principles.
- The audit file is something the user can hand to a teammate and they will know what to do next.

## Failure modes

- **Scoring on intuition.** Every score has a sentence of justification. If you cannot justify it, look again.
- **Praising the absence of bad things.** "Has no anti-patterns" is not a 5; it is a 3 if the good practices are also absent.
- **Listing twelve findings.** If everything is a finding, nothing is. Prioritize ruthlessly.
- **Skipping the conformity check.** It is the single piece of evidence that tells you whether the context is actually working. If you cannot run it, say so loudly.
