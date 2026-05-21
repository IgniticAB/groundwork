# `docs/agents/` — agent rules overflow

`AGENTS.md` is the canonical, lean root (~80 lines). When it outgrows that budget, per-area conventions live here. This directory is **harness-agnostic** — any agent can be told to read these files, regardless of which harness it runs in.

Reference each file from `AGENTS.md`'s "See also" section so agents reading `AGENTS.md` know they exist.

## When to add a file here

A rule belongs here when:
- It is too long to inline in `AGENTS.md` without pushing the file past ~80 lines.
- It is stable (not session-specific or temporary).
- It is area-scoped (frontend, backend, db, infra) rather than universal — universal rules belong in `AGENTS.md`'s Non-negotiables.

## Naming

One file per area or concern, plain markdown, no frontmatter.

- `docs/agents/frontend.md` — frontend conventions
- `docs/agents/backend.md` — backend conventions
- `docs/agents/database.md` — schema, migrations, query patterns
- `docs/agents/infra.md` — deployment, CI, environment

Use the file's H1 to name the concern: `# Frontend conventions`, `# Database conventions`.

## Format

Plain markdown. Each rule has a Preferred / Avoid pair where applicable.

```markdown
# Frontend conventions

## Components

Functional components with hooks; no class components.

```tsx
// Preferred
export function Card({ children }: CardProps) {
  return <div className="card">{children}</div>;
}

// Avoid
export class Card extends React.Component<CardProps> { ... }
```
```

## Relationship to other locations

- **`AGENTS.md`** — canonical root. References this directory in "See also".
- **`.claude/rules/`** (optional, Claude Code-specific) — if your team uses Claude Code as the primary harness and wants auto-loaded rules, you can additionally mirror content there. See `templates/claude-rules-readme.md` for the convention.
- **`.cursor/rules/*.mdc`** — Cursor's native split-rule mechanism with frontmatter scoping. Use Cursor's own format for Cursor-specific rules; reference cross-harness rules from here.
