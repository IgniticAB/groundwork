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

Ten rules in v0.1, covering the highest-value mechanical checks:

| Rule | Severity | What it catches |
| --- | --- | --- |
| `stale-claude-md` | P0 | CLAUDE.md / AGENTS.md names a package manager or framework not in package.json |
| `conventions-drift` | P1 | `.context/conventions.md` is newer than per-harness files |
| `missing-adr-xref` | P2 | Decision-like statements with no ADR cross-link |
| `mcp-literal-credentials` | P0 | MCP config contains literal credentials instead of env var references |
| `oversized-claude-md` | P1 | CLAUDE.md / AGENTS.md over 200 lines (prompt bloat) |
| `placeholder-comments` | P0 | `TODO: implement`, `[fill this in]`, `not implemented` in source |
| `missing-verification` | P1 | CLAUDE.md / AGENTS.md has no Verification section |
| `secrets-regex` | P0 | AWS / GitHub / OpenAI / Anthropic / Slack / PEM / JWT / Google keys in committed files |
| `missing-license-header` | P2 | Repo is copyleft-licensed but source files lack SPDX headers |
| `todo-comments` | P2 | TODO / FIXME / HACK markers (noise threshold: 25) |

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

10 rules, 47ms — 2 P0 · 0 P1 · 0 P2
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
