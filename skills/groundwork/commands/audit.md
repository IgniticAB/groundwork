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
- **Project.** `AGENTS.md` (canonical)? `CLAUDE.md` (symlink or hand-mirrored)? `.cursor/rules/`? `.github/copilot-instructions.md`? `.windsurf/rules/`? `docs/agents/` (harness-agnostic overflow)? `.claude/rules/` (optional Claude Code auto-loading layer)? Read them; note their length and last-modified date.

  Beyond file structure, score AGENTS.md on **content quality**. Each of the following is a separate signal:
  - Exists, under 80 lines (soft) / 200 (hard).
  - Has Verification + Non-negotiables sections; has three-tier Boundaries.
  - References `docs/agents/` if it is overflowing.
  - **No rule restated across two sections.** Plan-mode triggers belong only under Boundaries → Ask first; "run fast verification" belongs only under Non-negotiables.
  - **Every Style rule is behaviourally anchored.** A rule names a verb plus a specific technology, command, or pattern. "Use Vitest; assert on user actions" passes. "Write clean code" fails. The vague-rule failure modes mirror anti-pattern #2 (foundation/anti-patterns.md).
  - **Every Style rule has a Preferred / Avoid pair or a verification command.** A rule without a concrete example or a way to check it is decorative.
  - **Every verification command resolves to a real script.** Each command in the Verification section maps to a script in `package.json`, `pyproject.toml`, `Cargo.toml`, or `Makefile`. A command that does not exist is a P0 because the agent will run something that does not work.
  - **Boundaries → Always and Boundaries → Ask first each have at least one project-specific entry.** The default "plan-mode triggers" bullet under Ask first does not count by itself; if it is the only entry, the team has not done the work to localise.
  - **`docs/decisions/negative-space.md` exists and has content beyond the template stub.** Empty negative-space is a P2; the file is supposed to capture rejected paths so the agent stops re-suggesting them.

  **Installed skills.** Skills are procedure-as-context: every invocation reads the skill's `SKILL.md` and any sub-files it references. A bloated, vaguely-described, or structurally broken skill misroutes invocations the same way a bloated `CLAUDE.md` does. Audit them as part of the Project layer.

  Glob from the repo root:
  ```
  .claude/skills/*/SKILL.md
  .cursor/skills/*/SKILL.md
  .agents/skills/*/SKILL.md
  ```

  For each match, parse the YAML frontmatter and read the body. Record per skill: `name`, `description`, total SKILL.md line count, and the list of relative-link targets found in the body (skip anything starting with `http://`, `https://`, `mailto:`, or `#`).

  Compare each skill's path against the harness target list (the harnesses the repo emitted pointer files for during `init`, or the ones named in `AGENTS.md`). A `.cursor/skills/X/` in a Claude-only repo is dead weight.

  Check each skill on these specific signals (these feed Step 5's findings):
  - **Structural validity.** SKILL.md exists; YAML frontmatter parses; both `name` and `description` are present and non-empty.
  - **Description quality.** The description does not contain hedge phrases ("various", "general purpose", "helps with", "useful for", "good at", plus the rest of the `agents-md-vague-rules` hedge-word list). No length threshold; a short concrete description ("Generates Prisma migrations.") passes.
  - **Entry-point budget.** SKILL.md under 200 lines (same hard ceiling as `oversized-claude-md`). Above that, the entry point is bloated; detail should live in sub-files referenced from it.
  - **Internal-link resolution.** Every relative-path link in SKILL.md resolves to a real file in the skill directory.
  - **Path-target match.** The skill is installed under a harness path the repo targets, not a stray one.
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

Installed-skill quality feeds the Project-layer score. A repo with a complete `AGENTS.md` and three well-formed skills scores higher on Project than the same `AGENTS.md` paired with a malformed or vague-described skill. Per-layer evidence sentence names skill issues when they exist (e.g. "Project 3/5: AGENTS.md solid, but `.claude/skills/team-helper/` has an empty `description`").

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

#### Content-quality findings in `AGENTS.md`

Two specific failure modes that the Step 1 content-quality scan surfaces. Each becomes its own finding with quoted evidence; do not collapse them into a generic "Style needs work" line.

- **Vague Style rule.** Any Style entry that lacks a verb plus a named technology, command, or pattern. P1. Quote the offending line verbatim. Propose an anchored rewrite based on the actual code in the repo (e.g. "Write robust error handling" → "Wrap external API calls in try/catch; log via `Logger`; never swallow."). If you cannot infer a rewrite from the repo, ask the user to anchor or drop the rule.
- **Verification command does not resolve.** The Verification section names `pnpm test` but `package.json` has no `test` script (or `pytest` but `pyproject.toml` has no test config, etc.). P0. Quote the missing command and the file that should have defined it. The fix is either to add the script or to remove the command from AGENTS.md; the agent should not be told to run something that does not exist.

A third, softer signal worth recording:

- **Empty Boundaries tier or stub negative-space.** If Boundaries → Always or Boundaries → Ask first has only the default plan-mode entry, or if `docs/decisions/negative-space.md` is still the template stub, the team has not localised the context to the repo. P2 each. The fix is one round of `document` to populate them.

#### Installed-skill findings

For each skill globbed in Step 1, surface the following as separate findings. Do not collapse them into a generic "skills need work" line. Each finding names the skill by its full path (e.g. `.claude/skills/data-export/SKILL.md`) so the user can navigate to it directly.

- **Missing or malformed frontmatter** → P0. YAML must parse and contain non-empty `name` and `description`. Without these the host harness cannot route invocations.
- **Vague description** → P2. Quote the description. Triggers only on hedge phrases ("various", "general purpose", "helps with", "useful for", "good at", plus the hedge-word list shared with `agents-md-vague-rules`). No length threshold; concrete descriptions like "Generates Prisma migrations." pass.
- **Bloated entry point** → P1. SKILL.md over 200 lines. Move detail into sub-files referenced from SKILL.md so the entry point stays a lean dispatcher.
- **Broken internal link** → P1. A relative-path link in SKILL.md does not resolve to a real file. Name the unresolved target. The agent reads nothing where it expects content.
- **Skill at unexpected path** → P2. The skill is installed under a harness path the repo does not target (per `AGENTS.md` Stack / the pointer files `init` emitted). Often dead weight; sometimes an individual contributor's tooling. Surface as observation, not blocker.

A repo with no skills installed gets no findings here. A repo with three well-formed skills also gets none. The findings exist to catch the actual failures, not to demand skills exist.

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

Two passes. First pick the **bootstrap** command, exactly one. Then layer **additive** commands that address remaining findings.

**Pass 1: bootstrap. Pick exactly one.** The decision is deterministic, based on file presence (using the same signal `init`'s Step 1 safety check uses):

- **None** of these files exist: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, `.windsurf/rules/`, `.claude/rules/`, `docs/agents/`, `docs/decisions/` → recommend [`init`](init.md).
- **Any** of those files exists → recommend [`document`](document.md). Never recommend `init` in this case. `init` will refuse to run and tell the user to use `document` instead; recommending it wastes a turn.

`init` and `document` are mutually exclusive. Never recommend both.

**Pass 2: additive. Pick up to two.** These layer on top of whichever bootstrap command Pass 1 picked.

- Verification is missing or stale → [`verify`](verify.md).
- Multiple stacks in one repo with rules firing in the wrong places → [`scope`](scope.md).
- About to expose the agent to production systems → [`mcp`](mcp.md).
- Several recent decision-shaped merges without ADRs → [`adr`](adr.md) for each (cap the ADR recommendations at 3).
- Fresh agent or teammate joining a noisy area → [`onboard`](onboard.md).

Total cap: 3 commands. One from Pass 1, up to two from Pass 2.

### Step 7. Report

Save the file. In chat, show:
- Overall score (one number).
- Layer scores (one line).
- The top three findings.
- The recommended next commands.

Keep the chat output to under 15 lines. The detail lives in the file.

### Step 8. Optional HTML report

After the markdown report is saved, ask the user once:

> Want a delightful HTML version of this report? You can iterate on findings in a browser and download a structured remediation plan that `groundwork apply` will read. (Y/n)

Default no. If the user declines, end the command.

If yes, build `docs/context-audit-<YYYY-MM-DD>.html` from `templates/audit-report.html.template`:

1. **Copy the template.** Read `skills/groundwork/templates/audit-report.html.template`.
2. **Substitute placeholders.** The template has these tokens (each appears exactly once except where noted):
   - `{{PROJECT_NAME}}` — from `AGENTS.md` H1 or `package.json#name`. Two occurrences (page title + hero kicker).
   - `{{AUDIT_DATE}}` — `YYYY-MM-DD`. Three occurrences (hero meta, output-hint, default filename).
   - `{{OVERALL_SCORE}}` — integer 0-100 from Step 2.
   - `{{META_JSON}}` — JSON object: `{"project": "<name>", "date": "<YYYY-MM-DD>", "auditFile": "docs/context-audit-<date>.md"}`.
   - `{{LAYERS_JSON}}` — JSON array, one entry per layer (System / Project / Codebase / Tooling, Session skipped). Each entry: `{"name": "Project", "score": 4, "evidence": "AGENTS.md solid; no docs/agents/ overflow yet.", "weighted": true}`. Mark Project with `weighted: true` (it is 2× in the rubric).
   - `{{FINDINGS_JSON}}` — JSON array. One entry per finding from Step 5, in the shape below.
3. **Write the file.** Save to `docs/context-audit-<YYYY-MM-DD>.html`. Tell the user the path and that opening it in a browser (Safari / Chrome / Firefox) gives them the interactive report.

**Findings JSON shape (per entry):**

```json
{
  "id": "agents-md-vague-rules-AGENTS.md-23",
  "ruleId": "agents-md-vague-rules",
  "severity": "P1",
  "title": "Vague Style rule in AGENTS.md",
  "file": "AGENTS.md",
  "line": 23,
  "evidence": "Write robust error handling.",
  "fixHint": "Name the technology, command, or pattern.",
  "suggestedFix": "Wrap external API calls in try/catch; log via Logger; never swallow."
}
```

- `id` is unique within the report (combine `ruleId`, `file`, and `line` if present).
- `severity` is `P0`, `P1`, or `P2`.
- `title` is a one-line human-readable description (e.g. "Vague Style rule in AGENTS.md", "Verification command does not resolve", "SKILL.md missing frontmatter").
- `evidence` is the quoted line or value that triggered the finding. Optional.
- `fixHint` is the short hint that already appears in the markdown report. Optional.
- `suggestedFix` pre-fills the inline input when the user picks "Fix now" on rules with a textual rewrite (`agents-md-vague-rules`, `skill-vague-description`, `skill-missing-frontmatter`, etc.). Optional.

The HTML's JS uses `ruleId` to dispatch which inline controls to show. Do not invent new `ruleId` values; use the ones the audit found in Step 5.

**No need to escape inside the JSON tokens.** The template's JSON islands are `<script type="application/json">` blocks; the agent writes valid JSON in directly and the runtime parses it with `JSON.parse`. The HTML renders user strings via `textContent`, not `innerHTML`, so no XSS risk from quoted lines.

The user opens the file, walks through findings, downloads `audit-remediation-<YYYY-MM-DD>.md`, and feeds it to `groundwork apply` to enact the chosen fixes. Both files (markdown audit + HTML report + downloaded remediation) live in `docs/` and stay as the audit trail.

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
