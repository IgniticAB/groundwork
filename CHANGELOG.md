# Changelog

Notable changes to the Groundwork skill and the `@ignitic/groundwork` detector.
Dates are the date the work landed on `main`.

## 0.3.3 — 2026-11-22

Plugin `0.3.3`, skill `v1.1.3`. Detector unchanged, still `0.3.0` on npm.

The repo now runs the git hooks it tells other people to write. It had the
`Stop` hook in `.claude/settings.json` but neither git hook, so the README's
"output of its own `init`" claim was two files short of true.

### Added

- **`.context/hooks/check-context.sh` and `.context/hooks/check-commit-msg.sh`**,
  copied from the templates `init` emits, wired through committed
  `.githooks/pre-commit` and `.githooks/commit-msg` with
  `core.hooksPath`. Verified end to end: the commit-msg gate blocks a six-file
  commit with no ADR, passes one that says `no-adr-needed`, passes one that
  references `ADR-0003`, and the wrong-stage guard fails loudly when the script
  is called without a message path.
- **A fourth wire-up option in `init` step 7 and `verify` step 6:** committed
  `.githooks/` plus `core.hooksPath`, for repos that do not want another
  devDependency. All three existing options install a runner; this one installs
  nothing. It carries its own trap, now stated in both commands — the directory
  is committed but `core.hooksPath` is per-clone config, so the hooks are inert
  until someone runs the command. This repo wires it into `prepare`, so
  `npm install` does it.
- `npm run hooks:install` at the repo root.

Found by dogfooding: the option is in the skill because installing the hooks
here showed the existing three were all the wrong shape for this repo.

## 0.3.2 — 2026-11-22

Plugin `0.3.2`, skill `v1.1.2`. Detector unchanged, still `0.3.0` on npm.

One invented limit, found by an outside reviewer reading the skill against the
vendors' own docs. Groundwork told Cursor and Codex repos they had no
enforcement layer. Both have had one all along.

### Fixed

- **`audit` claimed agent-runtime hooks were unavailable outside Claude Code.**
  They are not. Cursor reads a committed `.cursor/hooks.json` ("checked into
  version control with your project", 21 events, deny via `permission: "deny"`
  or exit 2); Codex reads `.codex/hooks.json` in trusted project layers (deny
  via `permissionDecision: "deny"` or exit 2). Exit 2 blocks in all three
  harnesses. A Cursor or Codex repo with no hooks file now scores the same gap
  as a Claude Code repo with no hooks, instead of being told the layer does not
  exist for it. `commands/audit.md`, `foundation/runtime-controls.md`,
  `reference/runtime-detail.md` and the matching site page.

### Added

- **`reference/runtime-detail.md` gains "Hooks in Cursor and Codex"** — a
  per-harness table of project path, personal path, pre-tool event, JSON deny
  field and exit-code deny, plus the two traps: Cursor hooks fail *open* unless
  the script sets `failClosed: true`, and a committed `.codex/hooks.json` does
  nothing until the user trusts it with `/hooks`. Verified 2026-11-22 against
  cursor.com/docs/hooks and learn.chatgpt.com/docs/hooks.

This is the failure mode `AGENTS.md` names first: a vendor's behaviour stated
without reading that vendor's docs. The direction was new — previous instances
invented capabilities, this one invented a limit — but the cause was the same.

## 0.3.1 — 2026-11-22

Plugin `0.3.1`, skill `v1.1.1`. The detector is untouched and stays on npm at
`0.3.0`: nothing in `cli/` changed, and the fixes below ship in templates the
npm package does not carry.

Two bugs in templates `init` writes into other people's repos. Both were gates
that reported success while letting the thing they guard through, which is
worse than having no gate: the repo was green and the guard was off.

### Fixed

- **The generated CI workflow could pass on a P0.** `context-check.yml.template`
  pipes the detector through `tee` and set no `shell:`. GitHub's default Linux
  shell is `bash -e {0}`, with no `pipefail`, so the pipeline reported `tee`'s
  status — and `tee` always succeeds. The detector exited 1, the step exited 0,
  the check went green. Now sets `shell: bash` explicitly, which carries
  `-eo pipefail`. Groundwork's own CI invokes the detector directly, with no
  pipe, so no run of it ever exercised this.
- **The ADR hook blocked the commits it documents and passed the ones it
  guards against.** `hook.sh.template` ran as `pre-commit` and read the commit
  message from `.git/COMMIT_EDITMSG` — a file git does not write until after
  pre-commit has run. It was judging the *previous* commit's message. A commit
  saying `see ADR-0001` was rejected; so was the documented `no-adr-needed`
  opt-out; and a six-file commit with no ADR at all was accepted whenever the
  previous commit happened to carry the marker.

  The message-dependent check moved to a new `commit-msg-hook.sh.template`,
  installed as a `commit-msg` hook, where git passes the message path as `$1`.
  The file-only checks stay in `pre-commit`. The new script refuses to run when
  it receives no message file, so wiring it to the wrong stage fails loudly
  rather than silently judging the wrong text.

### Changed

- The CI template pins `@ignitic/groundwork@0.3` instead of `@latest`. A CI gate
  that floats to the newest published version can turn a green build red without
  anyone touching the repo.
- `init` and `verify` now emit and register two hook scripts rather than one,
  each at its own stage, and say why the split is not optional.

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
