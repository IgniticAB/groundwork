# Groundwork

![Groundwork](docs/hero.png)

A skill (and 10 commands) for setting up and maintaining state of the art context engineering on a project or repo.

Structured after the model in [impeccable.style](https://impeccable.style): one
umbrella skill, with shared foundation files that always load, focused commands
for the highest-leverage moves, and reference files that load only when a
command needs them.

**This repo is the output of its own `init`.** Its agent context is an
[`AGENTS.md`](AGENTS.md) and nothing else, because that is what the skill now
tells you to write. Its decisions are in [`docs/decisions/`](docs/decisions/),
including the one that retired the architecture it used to recommend. What it
rejected is in [`negative-space.md`](docs/decisions/negative-space.md). The
verification in `AGENTS.md` is enforced by a `Stop` hook in
[`.claude/settings.json`](.claude/settings.json), so an agent working here
cannot declare a task done on a red build. `npm run detect` runs this repo
through its own detector and must stay clean — a tool that cannot pass its own
checks is not evidence of anything.

Last reviewed against vendor documentation: **2026-11-21**. The foundation
files that make factual claims carry their own `Last verified` dates.

## What it does

When the user wants to bootstrap a repo for AI-first development, audit how AI-ready their repo is, write or refresh a `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/`, plan a non-trivial change before coding, capture a decision as an ADR, scope rules to file patterns, design an MCP server with least-privilege, or bake verification loops into the agent's context, they invoke this skill and pick a command.

## The ten commands

| Command | Purpose |
| --- | --- |
| `init` | Bootstrap a repo with full context engineering scaffolding |
| `audit` | Score the repo's context engineering maturity, find gaps |
| `document` | Refresh / first-pass-document an existing repo (delta merge, not rewrite) |
| `plan` | Plan Mode contract before any non-trivial change |
| `adr` | Architecture Decision Record with negative-space section |
| `scope` | File-pattern-scoped rules per area |
| `mcp` | MCP configuration with least-privilege, HITL, audit policy |
| `verify` | Bake test/lint/typecheck commands into context; install drift hook |
| `onboard` | Produce a task-specific orientation brief for a fresh agent or engineer |
| `apply` | Enact a remediation plan produced by an interactive `audit` report |

## Get started

### 1. Install the skill

One agent skill with 10 commands. Works in [50+ AI coding harnesses](https://github.com/vercel-labs/skills#supported-agents) including Claude Code, Cursor, Codex, Gemini CLI, and OpenCode.

```bash
npx skills add IgniticAB/groundwork
```

Or, in Claude Code, install it as a plugin:

```bash
/plugin install groundwork --marketplace IgniticAB/groundwork
```

The installer auto-detects your harness and places files in the right location (`.claude/skills/groundwork/`, `.cursor/skills/groundwork/`, `.agents/skills/groundwork/`, etc.).

Target specific harnesses with `-a`:

```bash
npx skills add IgniticAB/groundwork -a claude-code
npx skills add IgniticAB/groundwork -a cursor -a codex
```

Install globally with `-g` so the skill is available across every project:

```bash
npx skills add IgniticAB/groundwork -g
```

### 2. Use it

Once installed, invoke the skill by name or by command:

- `groundwork init` to bootstrap a repo
- `groundwork audit` to score AI readiness
- `groundwork plan` to draft a Plan Mode contract before a change

Or describe what you want and let the skill pick: *"set up this repo for AI-first development"* triggers `init`; *"how good is our AI setup?"* triggers `audit`.

In Claude Code, the optional slash shortcut `/gw init`, `/gw audit`, `/gw plan` works once you copy `slash-commands/gw.md` into `.claude/commands/`.

### 3. Install the CLI (optional)

For CI and pre-commit anti-pattern scans outside the skill:

```bash
npm i -g @ignitic/groundwork
```

Then run `groundwork detect` to scan a project, or `npx @ignitic/groundwork detect` without installing. Twenty deterministic rules, no LLM required, JSON output for build gates.

The skill is for authoring context. The CLI is for guarding it. They complement each other.

### 4. Stay updated

```bash
npx @ignitic/groundwork skills update
```

Run periodically to pull the latest skill definitions. Alternatively, `npx skills add IgniticAB/groundwork` re-installs from scratch.

## Worked example: bootstrapping a new repo

```
You: groundwork init

Skill: Read your repo. Saw: Node 22, pnpm, Next.js 15, Vitest, Biome.

Ask 8 questions (Q6-Q8 skippable):
  1. Harnesses? → Claude Code, Cursor
  2. Verification, fast vs full? → pnpm test / pnpm test && lint && typecheck
  3. Style rules? → confirms the 4 it detected from a 25-file code sample
  4. Three-tier boundaries? → Always / Ask first / Never
  5. Anything need a file beyond AGENTS.md? → no
  6. Approaches you have rejected? → (skipped)
  7. Code an agent must not touch? → (skipped)
  8. Stub a first ADR? → (skipped)

Emit:
  - AGENTS.md (canonical, ~70 lines — Claude Code, Cursor, Codex,
      Copilot and Windsurf all read it, so that is the whole of it)
  - docs/decisions/README.md
  - docs/decisions/negative-space.md
  - .context/hooks/check-context.sh      (pre-commit: pkg-manager drift, ADR status)
  - .context/hooks/check-commit-msg.sh   (commit-msg: ADR coverage)

No first ADR: Q8 was skipped, and `init` never invents one.

Run pnpm test, pnpm lint, pnpm typecheck. All pass.

Next: try `groundwork plan` next time you have a change touching multiple files.
```

## Repo layout

```
groundwork/
  README.md                              the file you're reading
  LICENSE                                MIT
  docs/                                  images and supplementary docs
    hero.png
  skills/
    groundwork/                          the skill, installed by npx skills add
      SKILL.md                           the orchestrator
      foundation/                        always-loaded reference
        five-layer-stack.md
        contextops-lifecycle.md
        cognitive-debt.md
        anti-patterns.md
        good-practices.md
        harness-reference.md
        runtime-controls.md
        mcp-principles.md
      reference/                         loaded on demand, not at session start
        harness-detail.md
        runtime-detail.md
        mcp-detail.md
      commands/                          one file per command
        init.md
        audit.md
        document.md
        plan.md
        adr.md
        scope.md
        mcp.md
        verify.md
        onboard.md
        apply.md
      templates/                         files the commands emit
        AGENTS.md.template                canonical cross-tool source
        CLAUDE.md.template                one-line @AGENTS.md import, for repos that already have a CLAUDE.md
        docs-agents-readme.template.md    README for docs/agents/ (harness-agnostic overflow)
        claude-rules-readme.md            README for .claude/rules/ (optional Claude Code auto-load layer)
        cursor-rule.mdc.template          optional pointer for Cursor
        copilot-instructions.md.template  pointer for GitHub.com Chat, the one surface that ignores AGENTS.md
        windsurf-rule.template.md         optional pointer for Windsurf
        adr.template.md
        decisions-readme.template.md
        negative-space.template.md
        plan.template.md
        briefing.template.md
        mcp-config.template.json
        mcp-policy.template.md
        hook.sh.template
        commit-msg-hook.sh.template
        husky-pre-commit.template
        context-check.yml.template
        audit-report.html.template        interactive HTML audit report
        remediation.template.md           remediation plan consumed by `apply`
      slash-commands/                    optional Claude Code slash shim
        gw.md
  cli/                                   the detector CLI, published as @ignitic/groundwork
    src/
    bin/
    package.json
  site/                                  the docs site (Astro), deployed to GitHub Pages
  AGENTS.md                              this repo's own agent context — see "Dogfooding"
  docs/decisions/                        this repo's own ADRs
```

## Design principles

This skill follows five rules in its own design, the same rules it teaches.

1. **One skill, N commands.** Modeled on impeccable.style. A single entry in the skill menu; commands are discovered by typing the skill name.
2. **Foundation files load on every invocation; `reference/` does not.** `foundation/` is read once at session start and commands assume it is in context. `reference/` holds the per-harness and per-runtime detail that only some commands need, and is loaded at the point of use — the same progressive disclosure the skill tells other repos to practise.
3. **Templates over generation.** Files the commands emit are templates with substitutions, not regenerated from scratch each time. Templates are reviewable.
4. **Layer discipline.** Every file lives in the layer where it belongs (System, Project, Codebase, Session, Tooling).
5. **No placeholders in emitted output.** Either the file has real content or it does not exist.

## Source material

Two essays from May 2026 that the foundation was derived from, kept in
`docs/source/` for provenance rather than as guidance:

- `AI-First R&D Context Engineering 101.md`. The architectural view: five-layer stack, cognitive debt, ContextOps lifecycle, MCP principles.
- `AI Agent Context Engineering Best Practices.md`. The operational view: rule composition, file architecture, per-tool patterns, Context Rot taxonomy, three-tier boundaries.

Read `skills/groundwork/foundation/` instead. Several specifics in the essays
were checked against vendor documentation in November 2026 and did not survive;
`docs/source/README.md` lists which and says why they are left uncorrected.

The site at `/blueprint` synthesizes both into a single navigable summary.

- [impeccable.style](https://impeccable.style), the structural reference for "one skill, N commands" with always-loaded foundation files.

## Status and scope

Skill v1.1.2. Ten commands. Detector CLI (`@ignitic/groundwork`) with twenty rules. Harness-agnostic output (Claude Code, Cursor, Codex, Copilot, and 50+ more via `npx skills`). Verification commands and detector are run for real, not declared.

If you want to extend it: add a new command file in `skills/groundwork/commands/` and a row in the table in `skills/groundwork/SKILL.md`. Add new detector rules in `cli/src/rules/` and register them in `cli/src/rules/index.ts`. Commands are independent; rules are independent; they share the foundation files but do not depend on each other.

## License

MIT. See [LICENSE](LICENSE).
