# `.claude/rules/` — split rule files

Stable, long-form, or per-area conventions live here, not in the root `AGENTS.md` / `CLAUDE.md`. The root file stays lean (under ~80 lines / ~400 tokens). This directory holds everything that overflows.

## Why split

A single `AGENTS.md` that accumulates every convention over multiple sessions becomes an unreadable, bloated document that degrades model attention. The fix is structural: keep the root file as a lean entry point, and move stable rules into a directory of small, single-concern files that Claude Code loads on demand.

## Load order

Files load in **filename sort order**. Use a numeric prefix.

- `00-09` — orientation
- `10-29` — global style and naming
- `30-49` — verification and build
- `50-69` — per-area conventions (frontend, db, infra)
- `70-89` — security, MCP, credentials
- `90-99` — exceptions and overrides

Pick the smallest range that puts the rule in the right load slot. Leave gaps so future rules slot in without renumbering.

## One concern per file

Each file covers a single, named concern:

- `10-style-imports.md` — import-path rules
- `10-style-error-handling.md` — error-handling pattern
- `30-verification.md` — what counts as fast vs full
- `50-frontend-tailwind.md` — Tailwind usage and `cn()` helper
- `70-secrets.md` — never inline credentials; env var conventions

Files that contain unrelated rules will drift. Split them.

## Format

Plain Markdown. No frontmatter. Open with the H1 stating the concern, body is the rules with Preferred / Avoid pairs where applicable.

```markdown
# Style — error handling

Throw, do not return null, for missing entities.

```typescript
// Preferred
const user = await db.user.findUnique({ where: { id } });
if (!user) throw new NotFoundError('user', id);

// Avoid
const user = await db.user.findUnique({ where: { id } });
if (!user) return null;
```
```

## Relationship to other files

- **`AGENTS.md`** (and its `CLAUDE.md` symlink) — the lean, canonical root. Names the non-negotiables and the most critical rules inline. References this directory in its "See also" section.
- **`.cursor/rules/`, `.github/copilot-instructions.md`, `.windsurf/rules/`** — short pointer files that say "read `AGENTS.md`" plus the three non-negotiables. They do not duplicate the rules in this directory.

## When to edit

Most rules can be added here without touching `AGENTS.md`. Update `AGENTS.md` only when a non-negotiable changes (a new package manager, a new fast-verification command, a new always-applies rule). When you do change `AGENTS.md`, the per-harness pointer files usually need a touch too — hand-edit each one (Cursor, Copilot, Windsurf) since there is no generator.
