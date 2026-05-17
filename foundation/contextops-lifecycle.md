# The ContextOps Lifecycle

ContextOps is to context what DevOps is to code: a versioned, governed lifecycle that prevents drift between what the agent thinks is true and what the code actually does.

Five stages. Every command in this skill maps to one or more of them.

## 1. Build

Generate the initial context files by scanning the repo, not by guessing.

- Detect the tech stack from package manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.).
- Detect test and lint commands from scripts and config files, not from convention.
- Detect the dominant style (TypeScript strict mode? Tabs vs spaces? Conventional commits?) by reading a sample of recent files and recent commits.
- Output one file per harness, not one mega-file. See `foundation/harness-reference.md`.

Commands: `init`, `document`.

## 2. Distribute

The same rules, in the format each harness expects. A single source of truth, multiple emitted files.

- Claude Code reads `CLAUDE.md` and `.claude/skills/*`.
- Cursor reads `.cursor/rules/*.mdc` with YAML frontmatter for file-scoping.
- Codex / generic agents read `AGENTS.md`.
- GitHub Copilot reads `.github/copilot-instructions.md`.

Do not write the same rules five times. Write them once, transform them into each format.

Commands: `init`, `document`, `scope`.

## 3. Maintain

Pre-commit hooks and CI checks that validate context files are updated when the code they describe changes.

- If `package.json` changes and `CLAUDE.md` still names the old framework, fail the commit.
- If a new directory is added and no `.cursor/rules/*.mdc` covers it, warn.
- If an ADR references a file that no longer exists, flag it.

This is the stage most teams skip. Without it, context rots.

Commands: `verify` (sets up the hook), `audit` (finds existing rot).

## 4. Update

Context evolves through *delta updates*, not full rewrites. Preserve history.

- New conventions go in as additions, with a date.
- Deprecated conventions are not deleted; they are marked deprecated with the date and the reason.
- The agent reading the file can tell the difference between "this is how we do it now" and "this is how we used to do it and here's why we stopped".

Why: full rewrites lose the *why*. The why is the most valuable part.

Commands: `adr` (captures the why), `document` (does the delta merge).

## 5. Measure

Track how often the AI's output actually conforms to the rules in the context files. Low conformity means the context is failing to communicate.

- Lint rules and tests catch some of this automatically.
- For convention-level conformity (e.g. naming, file structure), a periodic audit by a fresh agent is the cheap version. A proper conformity metric in CI is the rigorous version.
- The number to watch: percentage of generated code that passes the project's own checks without modification.

Commands: `audit`.

## The order matters

Build → Distribute → Verify the loop runs → Iterate. Skipping `verify` is the most common failure: teams build beautiful context files and never check whether the agent actually follows them. The `verify` command exists to close that loop.
