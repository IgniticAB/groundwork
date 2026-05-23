# Groundwork (CLI)

A deterministic detector for context-engineering anti-patterns. No LLM. Runs in milliseconds. Ships JSON for CI.

Companion to the [groundwork skill](../skills/groundwork/). The skill is for authoring; this CLI is for guarding.

## Install

```bash
npm i -g @ignitic/groundwork
# or
npx @ignitic/groundwork detect
```

## Usage

```bash
groundwork detect              # scan current directory
groundwork detect /path/to/repo
groundwork detect --json > findings.json
groundwork detect --fail-on P1     # exit 1 on P1 or worse (default: P0)
groundwork detect --only stale-claude-md,secrets-regex
groundwork list-rules
groundwork skills update           # update the installed groundwork skill
```

## Updating the skill

To pull the latest skill definitions into your installed harness directories:

```bash
npx @ignitic/groundwork skills update
```

This is a thin wrapper around `npx skills update groundwork` from the [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI, scoped to the groundwork skill so you don't have to remember the source path. Forward flags like `-g`, `-p`, `-y` work as expected. See `groundwork skills --help`.

## What it detects

Eighteen rules, covering the highest-value mechanical checks:

| Rule | Severity | What it catches |
| --- | --- | --- |
| `stale-claude-md` | P0 | CLAUDE.md / AGENTS.md names a package manager or framework not in package.json |
| `verification-command-missing` | P0 | Verification section names a command (`pnpm test`, `make build`) that does not resolve to a real script |
| `skill-missing-frontmatter` | P0 | A SKILL.md is missing YAML frontmatter, or `name` / `description` is missing or empty |
| `missing-adr-xref` | P2 | Decision-like statements with no ADR cross-link |
| `mcp-literal-credentials` | P0 | MCP config contains literal credentials instead of env var references |
| `oversized-claude-md` | P1 | CLAUDE.md / AGENTS.md over 200 lines (prompt bloat) |
| `placeholder-comments` | P0 | `TODO: implement`, `[fill this in]`, `not implemented` in source |
| `missing-verification` | P1 | CLAUDE.md / AGENTS.md has no Verification section |
| `secrets-regex` | P0 | AWS / GitHub / OpenAI / Anthropic / Slack / PEM / JWT / Google keys in committed files |
| `missing-license-header` | P2 | Repo is copyleft-licensed but source files lack SPDX headers |
| `todo-comments` | P2 | TODO / FIXME / HACK markers (noise threshold: 25) |
| `agents-claude-sync` | P1 | AGENTS.md and CLAUDE.md exist as separate files with diverging content |
| `oversized-cursor-rule` | P2 | `.cursor/rules/*.mdc` exceeds word budget for its trigger level (P1 for `alwaysApply: true`) |
| `agents-md-duplication` | P1 | Same rule restated under two H2 sections in AGENTS.md / CLAUDE.md (e.g. plan-mode triggers in both Non-negotiables and Boundaries → Ask first) |
| `agents-md-vague-rules` | P1 | A Style rule uses vague phrasing ("write clean code", "use good judgment", "follow best practices") instead of a verb plus a named technology, command, or pattern |
| `skill-oversized` | P1 | A SKILL.md entry point over 200 prose lines (code excluded). Move detail into sub-files referenced from SKILL.md |
| `skill-broken-link` | P1 | A relative-path link in SKILL.md does not resolve to a real file or directory |
| `skill-vague-description` | P2 | A skill's frontmatter description uses hedge phrasing ("various", "helps with", "useful for") |

Severity:
- **P0** — fix before next agent session. The agent will actively do the wrong thing.
- **P1** — fix this sprint. Silent drift over weeks.
- **P2** — backlog. Hygiene.

## Output

Human (default):

```
P0 2 findings
  ● stale-claude-md CLAUDE.md
    CLAUDE.md mentions "yarn" but package.json declares packageManager: pnpm.
    fix: Run: groundwork document
  ● secrets-regex src/config.ts:14
    Possible GitHub personal access token in committed file.
    > const token = "ghp_****************dEf"
    fix: Rotate the credential and remove from history (BFG / git-filter-repo).

18 rules, 47ms — 2 P0 · 0 P1 · 0 P2
```

JSON (for CI):

```json
{
  "version": 1,
  "durationMs": 47,
  "rulesRun": ["stale-claude-md", "..."],
  "findings": [
    {
      "ruleId": "stale-claude-md",
      "severity": "P0",
      "file": "CLAUDE.md",
      "message": "...",
      "fix": "..."
    }
  ]
}
```

## CI

GitHub Actions:

```yaml
- name: groundwork
  run: npx @ignitic/groundwork detect --fail-on P1
```

Pre-commit (via husky):

```bash
npx @ignitic/groundwork detect --fail-on P0
```

## Extending

Rules live in `src/rules/<name>.ts`. Each exports a `Rule` with `id`, `description`, `defaultSeverity`, and an async `run(ctx)`. Add to the registry in `src/rules/index.ts`.

Pluggable design: if a custom rule turns out to be naive (e.g. our secrets regex versus full gitleaks), drop in a rule that shells out to the better tool.

## License

MIT.
