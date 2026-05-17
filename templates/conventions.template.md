# Project conventions

The canonical source of truth for how this codebase works with AI agents. Per-harness files (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`) reference this file. Update this file first; regenerate the per-harness files after.

## Stack

<!-- One line per: language, framework, package manager, test framework, lint, typecheck, build. -->
<!-- Example:
- Language: TypeScript 5.4 (strict mode)
- Framework: Next.js 15 (App Router)
- Package manager: pnpm 9
- Tests: Vitest
- Lint: Biome
- Typecheck: tsc --noEmit
- Build: next build
-->

## Verification commands

<!-- Fast loop: runs after every meaningful change. Cheap to run. -->
**Fast** (after every change):
```bash
<command 1>
<command 2>
```

<!-- Full loop: runs before declaring a task done. -->
**Full** (before done):
```bash
<command 1>
<command 2>
<command 3>
```

<!-- Known-failing: things the agent should NOT try to fix unless asked. -->
Known-failing checks: <list, or "None">

## Style and naming

<!-- 3 to 6 rules. Every one has a concrete Preferred/Avoid pair. -->

### <Rule 1>
<!-- e.g. "Throw, don't return null, for missing entities" -->

```typescript
// Preferred
const user = await db.user.findUnique({ where: { id } });
if (!user) throw new NotFoundError('user', id);

// Avoid
const user = await db.user.findUnique({ where: { id } });
if (!user) return null;
```

### <Rule 2>

### <Rule 3>

## Plan mode

Plan mode is required for:
- Any change touching more than 3 files
- Any change to public APIs
- Any refactor
- Any migration

Use `context-engineer plan` (or `/ce plan`) to draft the contract before coding.

## Defensive commits

Before any change touching more than 5 files: `git add -A && git commit -m "checkpoint: <description>"`. Record the hash in the plan file.

## No placeholder comments

Every function is either fully implemented or not in the file. If you do not have enough context to implement something, ask. Do not leave `// TODO: implement this`.

## Out-of-bounds

<!-- Paths the agent should not modify unless explicitly asked. -->
- <path>: <reason>

## References

- ADRs: `docs/decisions/`
- Negative space: `docs/decisions/negative-space.md`
- MCP policy (if any): `docs/mcp-policy.md`
- Plan archive: `.context/plans/`
