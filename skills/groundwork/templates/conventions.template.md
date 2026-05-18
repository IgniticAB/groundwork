# Project conventions

The canonical source of truth for how this codebase works with AI agents. The per-harness files (`AGENTS.md` and its `CLAUDE.md` symlink, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md`, `.windsurfrules` if present) all reference this file. Update this file first; regenerate the per-harness files after.

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

<!-- Behaviorally anchored. Every rule names the exact technology, command,
     or pattern. Vague principles ("write clean code") never appear here.
     3 to 6 rules. Each with a concrete Preferred/Avoid pair. -->

### <Rule 1>
<!-- Example: "Throw, don't return null, for missing entities" -->

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

## Anchored vs vague: the rule-writing standard

Every rule in this file (and in the per-harness files) follows the **anchored** column. Vague principles produce vague output.

| Category | Anchored (good) | Vague (bad) |
| --- | --- | --- |
| Error handling | Wrap external API calls in try/catch; log failures via the project `Logger`; never swallow exceptions. | "Write robust error handling." |
| Styling & assets | Use Tailwind utilities exclusively; conditional classes via `cn()`; images served from `/assets/`. | "Use clean styling patterns." |
| Testing | Write unit tests with `<framework>`; assert on user-facing behavior; run `<full-suite cmd>` before staging. | "Maintain high test coverage." |
| Git workflow | Conventional Commits prefixes; one file scope per commit where reasonable; humans are the sole authors of record. | "Commit often with helpful messages." |
| Dependencies | Pin critical packages; import named exports; run `<build cmd>` to verify type safety on modified modules. | "Keep dependencies updated." |

## Boundaries

Three explicit tiers. Replace the older flat "out-of-bounds" list with this layout.

### Always

Things the agent does without asking.
- Run the fast verification after every meaningful change.
- Update `.context/conventions.md` when introducing a new convention; regenerate the per-harness files in the same commit.
- <add project-specific>

### Ask first

Things the agent proposes (in plan mode or the chat) before doing.
- Any change touching more than 3 files, public APIs, or migrations.
- Adding a new dependency.
- Modifying CI configuration.
- <add project-specific>

### Never

Things the agent is forbidden from touching.
- `<generated path>`: <reason>
- `<vendored path>`: vendored upstream; do not edit in place.
- Anywhere wrapped in `<!-- CE:PRESERVE -->` / `<!-- /CE:PRESERVE -->` tags (see below).
- <add project-specific>

## Preserved regions

Wrap a code region in HTML preservation tags to forbid agent edits. Use sparingly: each pair is a hard "do not refactor" boundary. Common cases are legacy compromises, performance-tuned hot paths, or compatibility shims whose subtleties an agent will not see.

```ts
<!-- CE:PRESERVE: legacy auth flow, removed in v3. Do not modernize. -->
function legacyHash(input: string): string {
  // ...
}
<!-- /CE:PRESERVE -->
```

Rules:
- Use only when the alternative would silently break something.
- Always include a one-line reason in the opening tag.
- Audit the count of CE:PRESERVE pairs in code review; a growing pile is a smell.

## Plan mode

Plan mode is required for:
- Any change touching more than 3 files
- Any change to public APIs
- Any refactor
- Any migration

Use `groundwork plan` (or `/gw plan`) to draft the contract before coding.

## Defensive commits

Before any change touching more than 5 files: `git add -A && git commit -m "checkpoint: <description>"`. Record the hash in the plan file.

## No placeholder comments

Every function is either fully implemented or not in the file. If you do not have enough context to implement something, ask. Do not leave `// TODO: implement this`.

## Split-file conventions (`.claude/rules/`)

Stable, long-form, or per-area conventions live in `.claude/rules/<NN>-<name>.md`. Numeric prefix sets load order (sorted by filename). Suggested ranges:

- `00-09` — orientation (e.g. `00-conventions.md` points at this file)
- `10-29` — global style and naming
- `30-49` — verification and build
- `50-69` — per-area conventions (frontend, db, infra)
- `70-89` — security, MCP, credentials
- `90-99` — exceptions and overrides

The root `AGENTS.md` / `CLAUDE.md` stays lean (under ~400 tokens) and references this directory.

## References

- ADRs: `docs/decisions/`
- Negative space: `docs/decisions/negative-space.md`
- MCP policy (if any): `docs/mcp-policy.md`
- Plan archive: `.context/plans/`
- Rule directory: `.claude/rules/`
