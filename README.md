# Groundwork

![Groundwork](docs/hero.png)

A skill (and 9 commands) for setting up and maintaining state of the art context engineering on a project or repo.

Built from the practices in *The 2026 Context Engineering Blueprint*, structured after the model in [impeccable.style](https://impeccable.style): one umbrella skill, with shared foundation files that always load, plus focused commands for the highest-leverage moves.

## What it does

When the user wants to bootstrap a repo for AI-first development, audit how AI-ready their repo is, write or refresh a `CLAUDE.md` / `AGENTS.md` / `.cursor/rules/`, plan a non-trivial change before coding, capture a decision as an ADR, scope rules to file patterns, design an MCP server with least-privilege, or bake verification loops into the agent's context, they invoke this skill and pick a command.

## The nine commands

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

## Get started

### 1. Install the skill

One agent skill with 9 commands. Works in [50+ AI coding harnesses](https://github.com/vercel-labs/skills#supported-agents) including Claude Code, Cursor, Codex, Gemini CLI, and OpenCode.

```bash
npx skills add IgniticAB/groundwork
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

Then run `groundwork detect` to scan a project, or `npx @ignitic/groundwork detect` without installing. Ten deterministic rules, no LLM required, JSON output for build gates.

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

Ask 4 questions:
  1. Harnesses? → Claude Code, Cursor
  2. Verification? → pnpm test, pnpm lint, pnpm typecheck
  3. Conventions? → no-placeholder, plan-mode-for->3-files, interface-first
  4. Out-of-bounds? → infra/terraform/, .next/, node_modules/

Emit:
  - .context/conventions.md
  - CLAUDE.md
  - .cursor/rules/main.mdc
  - docs/decisions/README.md
  - docs/decisions/0001-record-architecture-decisions.md
  - docs/decisions/negative-space.md
  - .context/hooks/check-context.sh

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
        mcp-principles.md
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
      templates/                         files the commands emit
        conventions.template.md
        CLAUDE.md.template
        AGENTS.md.template
        cursor-rule.mdc.template
        copilot-instructions.md.template
        adr.template.md
        adr-0001-record-architecture-decisions.md
        decisions-readme.template.md
        negative-space.template.md
        plan.template.md
        mcp-config.template.json
        mcp-policy.template.md
        hook.sh.template
        husky-pre-commit.template
        context-check.yml.template
      slash-commands/                    optional Claude Code slash shim
        gw.md
  cli/                                   the detector CLI, published as @ignitic/groundwork
    src/
    bin/
    package.json
```

## Design principles

This skill follows five rules in its own design, the same rules it teaches.

1. **One skill, N commands.** Modeled on impeccable.style. A single entry in the skill menu; commands are discovered by typing the skill name.
2. **Foundation files load on every invocation.** `foundation/` is read once at session start. Commands assume it is in context.
3. **Templates over generation.** Files the commands emit are templates with substitutions, not regenerated from scratch each time. Templates are reviewable.
4. **Layer discipline.** Every file lives in the layer where it belongs (System, Project, Codebase, Session, Tooling).
5. **No placeholders in emitted output.** Either the file has real content or it does not exist.

## Source material

- *The 2026 Context Engineering Blueprint*, the source document this skill is built from. Lives in this same repo.
- [impeccable.style](https://impeccable.style), the structural reference for "one skill, N commands" with always-loaded foundation files.

## Status and scope

Version 1.1. Nine commands. Detector CLI with ten rules. Harness-agnostic output (Claude Code, Cursor, Codex, Copilot, and 50+ more via `npx skills`). Verification commands and detector are run for real, not declared.

If you want to extend it: add a new command file in `skills/groundwork/commands/` and a row in the table in `skills/groundwork/SKILL.md`. Add new detector rules in `cli/src/rules/` and register them in `cli/src/rules/index.ts`. Commands are independent; rules are independent; they share the foundation files but do not depend on each other.

## License

MIT. See [LICENSE](LICENSE).
