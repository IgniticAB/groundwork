<!-- This file documents the contract between `groundwork audit --html` (which
     emits a remediation plan) and `groundwork apply` (which reads one).
     The HTML report's "Generate remediation plan" button produces files in
     exactly this shape. `apply` refuses files that lack the `groundwork-remediation`
     frontmatter marker.

     This template is reference material. It is not copied to a user's repo
     by `init`; only the HTML report writes files in this shape, and it does
     so dynamically. -->

---
generated: <YYYY-MM-DDTHH:MM:SSZ>
source-audit: <docs/context-audit-YYYY-MM-DD.md>
project: <project-name-from-AGENTS.md>
groundwork-remediation: v1
---

# Remediation plan

## To apply

<!-- Zero or more H3 blocks. Each block is one action `apply` will execute.
     `finding-id` is the rule id from the audit (e.g. `agents-md-vague-rules`).
     `action` is one of a small enum:
       replace-line, remove, add-stub, append-to-section,
       split-to-target, rewrite-link, create-target,
       add-frontmatter, rewrite-description, manual-review
     File paths are relative to the repo root.
     Quoted strings are JSON-encoded so special characters survive the round-trip.
     Any block may carry an optional `comment:` field with free-text guidance the
     user typed in the HTML report. `apply` passes it to the agent as additional
     instruction alongside the structured action. -->

### Anchor vague Style rule
- finding-id: agents-md-vague-rules
- file: AGENTS.md
- line: 23
- original: "Write robust error handling."
- new: "Wrap external API calls in try/catch; log via Logger; never swallow."
- action: replace-line
- comment: "match the wording style we use elsewhere in the Style section"

### Remove unresolvable verification command
- finding-id: verification-command-missing
- file: AGENTS.md
- command: "pnpm bench:realtime"
- action: remove

### Add missing npm script
- finding-id: verification-command-missing
- file: package.json
- script: "lint:strict"
- action: add-stub
- stub: "echo 'TODO: configure lint:strict' && exit 1"

### Populate Boundaries → Always
- finding-id: missing-verification
- file: AGENTS.md
- section: "Boundaries → Always"
- action: append-to-section
- additions:
  - "Preserve UTF-8 BOM on .cs files."

## Deferred

<!-- The user chose not to act now. `apply` records these but takes no action;
     the same finding can be revisited in the next audit. -->

### Missing-adr-xref on src/auth.ts
- finding-id: missing-adr-xref
- file: src/auth.ts
- line: 44
- status: deferred
- reason: "addressed by upcoming refactor"

## Dismissed

<!-- The user chose to mark as false positive. `apply` records the dismissal.
     Future audits may re-flag the same finding if the underlying state has
     not changed; the dismissal does not silence the rule. -->

### Vague description on team-helper skill
- finding-id: skill-vague-description
- file: .claude/skills/team-helper/SKILL.md
- status: dismissed
- reason: "intentionally generic; team uses it as a catch-all"
