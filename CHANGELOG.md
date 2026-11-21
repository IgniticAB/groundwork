# Changelog

Notable changes to the Groundwork skill and the `@ignitic/groundwork` detector.
Dates are the date the work landed on `main`.

## 0.3.0 — 2026-11-21

A correctness release. The repo had been untouched since May, and six months is
a long time in this ecosystem: several things the skill asserted as fact had
stopped being true, and a few had never been true. This release fixes what it
got wrong before adding anything.

### Fixed — claims that were not true

- **MCP has no `requiresConfirmation` field.** The skill asserted it in the
  principles file, mandated it as a quality bar, and baked it into five servers
  in the config template. A team following that guidance would have believed a
  production deploy was gated when nothing was gating it. Replaced with the
  four real tool annotations (`readOnlyHint`, `destructiveHint`,
  `idempotentHint`, `openWorldHint`), stated plainly as hints rather than
  enforcement, with the actual control relocated to the server.
- **`mcp` emitted `.context/mcp-config.json`**, described as standard host
  format. No host reads that path. Now emits `.mcp.json`, `.cursor/mcp.json`
  or `.vscode/mcp.json`.
- **Cursor publishes no per-trigger word budget.** The skill invented one
  (200 / 200–500 / 500–800 words) and hardcoded it into a detector rule whose
  message told users they had exceeded a Cursor limit. The rule now owns the
  threshold as a Groundwork heuristic and says so.
- Removed, after checking each against vendor documentation: a special
  `.cursor/rules/composer.mdc` filename, Windsurf 6,000 / 12,000-character
  limits, a `.windsurfmemories` repo file, Copilot `/agent <name>` syntax.
- Hooks live under a `hooks` key in `.claude/settings.json`, not in a
  `.claude/hooks.json`. Claude Code's auto memory is at
  `~/.claude/projects/<project>/memory/`, not `.claude/memory/`.
- Preservation markers had two mutually exclusive syntaxes. Settled on
  `preserve:start` / `preserve:end`; the claim that `audit` counted the other
  form is removed, because it never did.
- Dropped two unsourced numbers rather than dressing them up: the
  hour-two / hour-four context-rot timings, and an 80% conformity threshold.

### Changed — architecture

- **`init` emits one `AGENTS.md` and stops.** Claude Code, Cursor, Codex,
  Copilot and Windsurf all read it natively now, so the `CLAUDE.md` symlink and
  the per-harness pointer files are no longer the default. A second file is
  written only for one of four named reasons. Where a `CLAUDE.md` must exist it
  is a one-line `@AGENTS.md` import. See ADR-0002.
- Foundation split: per-harness, per-runtime and per-MCP detail moved into
  `reference/`, loaded at the point of use rather than on every invocation.

### Added

- **`foundation/runtime-controls.md`** — the agent-runtime layer the skill had
  no vocabulary for. Hooks as enforcement, subagents as context isolation,
  skills vs MCP vs hooks, permissions, and evals as the only honest conformity
  check. Grepping the old skill for `PreToolUse`, `settings.json` or
  `subagent` returned nothing.
- Two anti-patterns: rules that should be hooks, and trusting untrusted content
  in agent context.
- Two detector rules: **`no-agent-context`** (P1 — every other rule detected
  bad content, so a large repo with none at all scored clean) and
  **`skill-frontmatter-portability`** (P1 — host-specific frontmatter is a hard
  error on claude.ai and the Skills API, and nothing else checks it).
- `--include-installed`, Claude Code plugin and marketplace manifests, a `Stop`
  hook in `.claude/settings.json`, ADRs in `docs/decisions/`, and this file.

### Fixed — the detector

- It was **blind to the skill this repo ships**: it globbed the three harness
  install paths and never `skills/*/SKILL.md`, so `detect .` reported clean
  because it had nothing to read.
- It was **loud about other people's skills**: 37 P1 findings on one real repo,
  almost all against vendored skills the developer installed and does not
  maintain. Install paths are now skipped behind `--include-installed`.
- `stale-claude-md` tested framework names against the whole file body, so a
  Vue project saying "do not use React patterns here" got a **P0**. Now
  line-scoped, with prohibitions and migration history excluded, and it reports
  the line and the text.
- `placeholder-comments` flagged `throw new Error('Not implemented')`, which is
  finished code in an abstract base.
- Three `fix:` hints named CLI commands that do not exist and exit 2.
- `mcp-literal-credentials` never globbed `.mcp.json`.
- Tests: 0 → 29. chokidar 3 → 6.

### Fixed — the repository

- The committed `cli/dist/` was a **broken partial snapshot**: it imported 18
  rule modules with 11 tracked, so a fresh clone crashed with
  `ERR_MODULE_NOT_FOUND` on the headline command. `dist/` and `node_modules/`
  untracked; 659 tracked files down to 119.
- Command and rule counts contradicted each other in four places (8 / 9 / 10
  commands, 10 / 12 / 18 rules). Reconciled to ten and twenty.
- First CI that builds and tests the CLI. Before this, only the site deployed.
- `npm run typecheck` ran `tsc` from a directory with no tsconfig and exited 1
  with the help text.

## 0.2.0 — 2026-05-24

Detector CLI published to npm. Skill at ten commands.

## 0.1.0 — 2026-05

First release.
