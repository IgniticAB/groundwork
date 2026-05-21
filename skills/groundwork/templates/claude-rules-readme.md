# `.claude/rules/` — Claude Code auto-loaded rules (optional)

This directory is a **Claude Code-specific** convention. Claude Code reads every file here on session start, in filename-sort order, and adds them to the active context. Codex, Cursor, Copilot, and Windsurf do **not** auto-load this directory — they read `AGENTS.md` and whatever it references.

If you want canonical, harness-agnostic overflow for `AGENTS.md`, put it in `docs/agents/<area>.md` instead. Reference those files from `AGENTS.md`'s "See also" so any harness can be pointed at them.

Use `.claude/rules/` only when you specifically want Claude Code's auto-loading behavior — for example, hooks, slash-command guidance, or per-area conventions you want preloaded in every Claude Code session without the agent having to find them.

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
- `30-verification.md` — what counts as fast vs full
- `50-frontend-tailwind.md` — Tailwind usage and `cn()` helper
- `70-secrets.md` — never inline credentials; env var conventions

Files that mix unrelated rules will drift. Split them.

## Format

Plain Markdown. No frontmatter. Open with the H1 stating the concern; body is the rules with Preferred / Avoid pairs where applicable.

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

- **`AGENTS.md`** (and its `CLAUDE.md` symlink) — the lean, canonical root. Names the non-negotiables and the most critical rules inline.
- **`docs/agents/`** — harness-agnostic overflow. Any harness can be told to read these. If you maintain content here in `.claude/rules/`, consider whether it should also live in `docs/agents/` so non-Claude harnesses see it.
- **`.cursor/rules/`, `.github/copilot-instructions.md`, `.windsurf/rules/`** — short pointer files that say "read `AGENTS.md`". They do not duplicate this directory.

## When to edit

A rule belongs in this directory when both of these are true:
- It is large or stable enough that inlining in `AGENTS.md` would push the file past ~80 lines.
- Claude Code is the primary harness, or the rule is genuinely Claude Code-specific (hooks, slash commands).

Otherwise, put it in `docs/agents/<area>.md` instead.
