# Groundwork (CLI)

A deterministic detector for context-engineering anti-patterns. No LLM, no network,
no API key — so it runs in a pre-commit hook and in CI with a stable exit code.

Companion to the [Groundwork skill](https://github.com/IgniticAB/groundwork).
The skill authors your agent context; this CLI guards it.

## Install

```bash
npm i -g @ignitic/groundwork
# or, no install
npx @ignitic/groundwork detect
```

Requires Node 22 or newer. Tested on 22, 24 and 26.

## Usage

```bash
groundwork detect                   # scan the current directory
groundwork detect /path/to/repo
groundwork detect --json > findings.json
groundwork detect --fail-on P1      # exit 1 on P1 or worse (default: P0)
groundwork detect --only stale-claude-md,secrets-regex
groundwork watch                    # re-detect on change
groundwork list-rules
groundwork skills update            # update the installed groundwork skill
```

### What it does not scan

By default the detector only looks at context your repo *authored*. Skills sitting
under a harness install path (`.claude/skills/`, `.cursor/skills/`, `.agents/skills/`,
`.windsurf/skills/`), vendored copies and gitignored files are skipped: flagging
someone else's installed skill as oversized is noise, not a finding. Pass
`--include-installed` to scan them anyway.

## Updating the skill

```bash
npx @ignitic/groundwork skills update
```

A thin wrapper around `npx skills update groundwork` from
[vercel-labs/skills](https://github.com/vercel-labs/skills), scoped to the
groundwork skill so you don't have to remember the source path. Flags like `-g`,
`-p`, `-y` are forwarded. See `groundwork skills --help`.

## What it detects

Twenty rules, covering the highest-value mechanical checks:

| Rule | Severity | What it catches |
| --- | --- | --- |
| `no-agent-context` | P1 | A repo with real source files and no agent context file at all. Every other rule checks the quality of context that exists; this one checks that any exists |
| `stale-claude-md` | P0 | A context file names a package manager or framework not in `package.json`. Lines that discuss a tool rather than prescribe it ("not React", "migrated off Jest") do not fire |
| `verification-command-missing` | P0 | A Verification section names a command (`pnpm test`, `make build`) that does not resolve to a real script |
| `mcp-literal-credentials` | P0 | An MCP config holds a literal credential instead of an env var reference |
| `secrets-regex` | P0 | AWS / GitHub / OpenAI / Anthropic / Slack / PEM / JWT / Google keys in committed files |
| `placeholder-comments` | P0 | `TODO: implement`, `[fill this in]`, `not implemented` in source |
| `skill-missing-frontmatter` | P0 | A SKILL.md has no YAML frontmatter, or `name` / `description` is missing or empty — the harness cannot route to it |
| `oversized-claude-md` | P1 | A Project-layer context file over its prose-line budget. Code examples do not count: soft warning at 80, hard ceiling at 200 |
| `missing-verification` | P1 | A Project-layer context file with no Verification section |
| `agents-claude-sync` | P1 | AGENTS.md and CLAUDE.md both carry full, diverging rule sets. A CLAUDE.md that is one `@AGENTS.md` import does not fire |
| `agents-md-duplication` | P1 | The same rule restated under two H2 sections. Plan-mode triggers, verification rules and path scopes each belong in exactly one place |
| `agents-md-vague-rules` | P1 | A Style rule phrased as "write clean code" or "follow best practices" instead of a verb plus a named technology, command or pattern |
| `skill-oversized` | P1 | A SKILL.md entry point over 200 prose lines. Move detail into sub-files it references |
| `skill-broken-link` | P1 | A relative link in SKILL.md resolves to nothing — the agent reads empty where it expects content |
| `skill-frontmatter-portability` | P1 | SKILL.md frontmatter carries a field outside the six portable Agent Skills fields. Host-specific fields are a hard error on claude.ai and the Skills API |
| `missing-adr-xref` | P2 | A decision stated in prose with no link to the decision record |
| `todo-comments` | P2 | TODO / FIXME / HACK markers (noise threshold: 25) |
| `missing-license-header` | P2 | Repo is copyleft-licensed but source files lack SPDX headers |
| `oversized-cursor-rule` | P2 | A `.cursor/rules/*.mdc` file long relative to how often it loads (P1 for `alwaysApply: true`). Groundwork guidance, not a Cursor limit |
| `skill-vague-description` | P2 | A skill description that hedges — "various", "helps with", "useful for". The harness cannot route by intent if the description does not state the intent |

Severity:
- **P0** — fix before the next agent session. The agent will actively do the wrong thing.
- **P1** — fix this sprint. Silent drift over weeks.
- **P2** — backlog. Hygiene.

Every finding names a file, and a line where one exists.

## Output

Human (default):

```
P0 2 findings
  ● stale-claude-md AGENTS.md:19
    AGENTS.md tells the agent to use "yarn", but package.json declares packageManager: pnpm.
    > - Package manager: yarn
    fix: Change "yarn" to "pnpm" on this line, or run the groundwork skill's `document` command.
  ● secrets-regex src/config.ts:14
    Possible GitHub personal access token in committed file.
    > const token = "ghp_****************dEf"
    fix: Rotate the credential and remove from history (BFG / git-filter-repo).

20 rules, 47ms — 2 P0 · 0 P1 · 0 P2
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
      "file": "AGENTS.md",
      "line": 19,
      "message": "...",
      "evidence": "...",
      "fix": "..."
    }
  ]
}
```

## Suppressing a finding

`ce-ignore` on the offending line, or on the line above it, in any comment style:

```md
<!-- ce-ignore: this example is deliberately stale -->
- Package manager: yarn
```

`ce-ignore-file` within the first five lines opts the whole file out — useful for
test fixtures that contain the very patterns a rule looks for:

```ts
// ce-ignore-file: fixture for placeholder-comments
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

Rules live in `src/rules/<name>.ts`. Each exports a `Rule` with `id`,
`description`, `defaultSeverity`, and an async `run(ctx)`. Add it to the registry
in `src/rules/index.ts`, and ship both tests: one case that fires, one that must
not.

Pluggable by design: if a rule turns out to be naive — our secrets regex versus
full gitleaks, say — drop in a rule that shells out to the better tool.

## License

MIT.
