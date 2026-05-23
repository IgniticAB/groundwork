---
name: groundwork-apply
description: Read a remediation plan produced by `groundwork audit --html` and apply the chosen fixes to the repo. Closes the loop between audit and action. Triggers on phrases like "apply this remediation", "run the audit fixes", "`/gw apply <file>`".
---

# `apply` — Run a remediation plan

`audit` decides what needs fixing. `apply` does the fixing. The bridge between them is a structured markdown file (`audit-remediation-<date>.md`) produced by the audit's interactive HTML report. `apply` reads that file and runs each chosen action against the repo.

## What this command produces

- Edits to one or more files in the repo (most often `AGENTS.md`, sometimes `package.json` or a `SKILL.md`), each tied to a specific finding the user already decided on.
- A short chat summary: what changed, what was skipped (and why), what is deferred for next time.
- The remediation file stays in place as part of the audit trail. Suggest committing it alongside the changes.

## When to reach for it

- Right after running `groundwork audit --html`, picking decisions in the browser, and downloading the remediation plan.
- When a teammate hands you a remediation plan they generated and asks you to enact it.
- Never on a hand-written `.md` that lacks the `groundwork-remediation: v1` frontmatter marker. `apply` refuses those by design (the format is the contract; freeform prose risks unsafe edits).

## When not to reach for it

- For a fresh repo with no context engineering. Use `init`.
- For a stale `AGENTS.md` you want to refresh from the current code. Use `document`.
- When the underlying repo state has changed since the audit ran. Re-audit first; line numbers in the remediation plan reference the state captured at audit time.

## Procedure

### Step 1. Read and validate the plan

Read the path the user passed (typically `docs/audit-remediation-<date>.md` or a path the user dragged from Downloads).

Validate, in order:

1. **YAML frontmatter parses.** Refuse anything that does not open with `---` / close with `---` and produce a parseable object.
2. **`groundwork-remediation: v1` is present.** Files without this marker are refused. Tell the user: "This file is missing the `groundwork-remediation: v1` marker. `apply` only reads plans produced by the audit's HTML report, to keep edits safe."
3. **Each H3 block under `## To apply`, `## Deferred`, or `## Dismissed` parses into the expected key-value shape.** Skip and report any block that does not.

If any validation step fails irrecoverably, stop and surface the failure cleanly. Do not partially apply.

### Step 2. Build the action list and show it (dry-run by default)

Walk the parsed plan and build a typed list:

- **To-apply actions.** Each carries: finding-id, file, action (one of the enum), and action-specific payload (e.g. `original` + `new` for `replace-line`, `script` + `stub` for `add-stub`, `additions` for `append-to-section`).
- **Deferred entries.** Listed but not enacted.
- **Dismissed entries.** Listed but not enacted.

Show the user the list **before touching any file**, grouped by file. Example chat output:

> Plan parsed: 4 actions to apply, 1 deferred, 1 dismissed.
>
> AGENTS.md
> - replace-line: line 23, "Write robust error handling." → "Wrap external API calls in try/catch; log via Logger; never swallow."
> - remove: "pnpm bench:realtime" from Verification
> - append-to-section: 1 bullet under Boundaries → Always
>
> package.json
> - add-stub: "lint:strict" → "echo 'TODO: configure lint:strict' && exit 1"
>
> Deferred (1): missing-adr-xref on src/auth.ts (reason: "addressed by upcoming refactor")
> Dismissed (1): skill-vague-description on team-helper (reason: "intentionally generic")
>
> Apply these 4 changes? (Y/n)

Default yes. If the user says no, exit without changes.

### Step 3. Pre-flight state check

For each `replace-line` action, read the target file and confirm the line at the recorded number matches the recorded `original`. If it does not (the user edited AGENTS.md between audit and apply), surface a clean mismatch and **skip** that one action; continue with the rest. Report the skip in the final summary.

For each `add-stub`, `remove`, and `append-to-section`, do a softer check (file exists; named section exists; named script does not already exist). Skip cleanly on mismatch.

Never silently rewrite the wrong line. Never patch around stale state.

### Step 4. Apply each action

Per action kind:

- **`replace-line`** (anchor a vague rule, or any single-line text swap). Locate the target line via the recorded number and `original` content. Replace with `new`. Preserve indentation.
- **`remove`** (drop a line, typically from the Verification section). Locate the line, remove it. If it is part of a code fence, leave the fence intact.
- **`append-to-section`** (add bullets under a named H2 → H3 path). Find the section heading, append the new bullets as the last list items in that section. Preserve existing content.
- **`add-stub`** (add a script to `package.json`). Parse JSON, add the script, write back with the same indentation and key order plus the new entry at the end of `scripts`.
- **`split-to-target`** (move a section to `docs/agents/<area>.md`). Read the source file, identify the section to move (by H2 heading), copy to the target path, remove from source, add a "See also" link in source pointing at target. Create `docs/agents/` and its `README.md` if missing.
- **`rewrite-link`** (fix a broken link in SKILL.md). Replace the matched link target with the new path.
- **`create-target`** (create a file the broken link pointed at). Touch an empty file with a one-line H1 placeholder so the link resolves and the user can fill it in.
- **`add-frontmatter`** (write a YAML frontmatter block at the top of a SKILL.md that had none). Insert `---` / `name:` / `description:` / `---` above the existing body. Use the captured `name` (from path) and `description` payload.
- **`rewrite-description`** (replace the description field in a SKILL.md frontmatter). Locate the line in the frontmatter, replace.
- **`manual-review`**. Log the entry. Do not edit.

After each successful edit, log it for the summary.

### Step 5. Verify

Read the fast verification command(s) from `AGENTS.md` (the Verification section). Run them. If they pass, the apply step ends cleanly. If they fail, show the failure output and ask whether to roll back via `git checkout -- <files-touched>` (only the files this command edited). Default to rolling back.

If git is not available, skip the rollback offer and just surface the verification failure.

### Step 6. Report

Short summary:

- Files touched, with paths the user can click.
- Changes per file (one line each).
- Skipped actions (with reason, e.g. "line 23 no longer matches recorded `original`; re-audit and try again").
- Deferred count, dismissed count.
- Verification result.
- One-line next move: "Commit the changes plus `docs/audit-remediation-<date>.md` so the audit trail stays intact."

End. The remediation file stays where it is.

## Quality bar

- No silent patches. Every mismatch is surfaced. Every skip is reported.
- No file outside the action list is touched.
- The fast verification runs after every apply, never skipped.
- The remediation file is never deleted by `apply`.

## Failure modes

- **Stale state.** The user edited AGENTS.md between audit and apply. The recorded `original` no longer matches the file. The command skips that action cleanly and tells the user to re-audit. It does not patch the wrong line.
- **Schema mismatch.** A hand-edited remediation file with a malformed block. The command refuses the file with a specific error: which block, which expected field.
- **Verification fails after apply.** The new content broke something. The command offers rollback via git. If accepted, restores; if declined, leaves the changes in place and reports.
- **Unknown action kind.** The plan references an action this version of `apply` does not implement. Skip with a clean log line ("unknown action `move-to-archive`; this version supports: [list]"); continue with the rest.
