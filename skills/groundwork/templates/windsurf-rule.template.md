<!-- Windsurf reads AGENTS.md natively, so this file is a fallback, not the
     default. Emit it only when the team wants the three non-negotiables
     restated inside Windsurf's own rule surface. For rules that should fire on
     specific paths, add `trigger: glob` and a `globs` list — see the `scope`
     command. -->

# <Project> agent rules

Read `/AGENTS.md` and follow it for all project conventions.

Non-negotiables (always apply):
- Verification: `<fast verification command>`
- Plan mode required for changes touching more than 3 files, public APIs, or migrations.
- No placeholder comments.
