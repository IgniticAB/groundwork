# Groundwork — agent context

<!-- This repo is the output of its own `init`. If you change the skill's
     conventions, change this file to match: it is the worked example.
     Budget ~80 lines. Overflow goes to docs/agents/<area>.md. -->

## What this project is

Groundwork is an agent skill that sets up and maintains context engineering in
other people's repos, plus a deterministic detector CLI that guards what the
skill authors. Three deliverables: `skills/groundwork/` (the skill), `cli/`
(published as `@ignitic/groundwork`), `site/` (Astro docs on GitHub Pages).

The repo is its own worked example, and that is load-bearing.

## Stack

- Language: TypeScript 5.x, ES2022 modules, no bundler
- Package manager: npm (one lockfile per sub-project; the root delegates)
- Runtime: Node 22+ (CI matrix: 22, 24, 26)
- Site: Astro 5, no integrations

## Verification

After any change:
```bash
npm run typecheck
```

Before declaring a task done:
```bash
npm run build
npm test
npm run detect
```

`npm run detect` runs this repo through its own detector and must stay clean:
a tool that cannot pass its own checks is not evidence of anything.

## Non-negotiables

- No placeholder comments. Ask if you lack context.
- Use npm. Do not introduce another package manager.
- Never commit `node_modules/` or `dist/`. Both were committed once and it took
  540 tracked files to undo.
- Every count stated in prose must match disk. Currently ten commands, twenty
  rules, stated in README, SKILL.md, `slash-commands/gw.md` and the site.
- Never state a vendor's limit, field name or behaviour without checking that
  vendor's own docs. Six invented "facts" shipped for six months because nobody
  did. Files making such claims carry a `Last verified` date; move it when you
  re-check.
- `foundation/` loads every invocation, `reference/` only on demand. New detail
  goes in `reference/` unless every command needs it.

## Style

### Rules carry their own evidence
Every detector finding names a file, and a line where one exists.
```ts
// Preferred
findings.push({ ruleId, severity: 'P1', file, line, evidence: line.trim(), fix: '…' });
// Avoid
findings.push({ ruleId, severity: 'P1', message: 'documentation could be better' });
```

### Guard against false positives at the rule, not the report
A rule that cannot tell a real hit from a plausible one is skipped, not softened.
```ts
// Preferred
if (!classifyCommand(cmd)) continue;   // unrecognised shape: say nothing
// Avoid
severity = 'P2';                        // fire anyway and hope nobody minds
```

### New rules ship with both tests
One case that fires, one that must not. `cli/src/test/`.

## Boundaries

**Always** — regenerate `cli/dist/` from source rather than editing it by hand.

**Ask first**
- Changes touching more than 3 files, the rule registry, or any published interface.
- Bumping `cli/package.json` version, or publishing to npm.
- Adding a detector rule, or changing an existing rule's severity.
- Anything that changes what `init` emits into a user's repo.

**Never**
- `cli/node_modules/`, `cli/dist/`, `site/dist/`, `site/.astro/`: build output.
- `.agents/skills/`: other people's skills, installed locally.

## See also

- `docs/decisions/` — ADRs; the *why* behind the architecture, and `negative-space.md` for what was rejected
- `skills/groundwork/foundation/` — the principles the commands rely on
- `skills/groundwork/reference/` — per-harness, per-runtime and per-MCP detail, loaded on demand
- `docs/source/` — the May 2026 essays this was derived from; provenance, not guidance
- `CHANGELOG.md` — what changed and why
