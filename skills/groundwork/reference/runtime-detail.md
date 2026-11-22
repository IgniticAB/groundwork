# Runtime Detail (load on demand)

Paths, field names, flags and exit-code semantics for the runtime layer.
`foundation/runtime-controls.md` carries the principles and the decision; this
file carries the things you must get exactly right to emit a working file.

**Last verified: 2026-11-21** against code.claude.com/docs for the Claude Code
sections; **2026-11-22** against cursor.com/docs/hooks and
learn.chatgpt.com/docs/hooks for "Hooks in Cursor and Codex". Where the docs do
not state something, this file says so rather than inventing it.

Everything here is Claude Code-specific **except** the "Hooks in Cursor and
Codex" section. No other harness reads `.claude/settings.json` or
`.claude/agents/` — but Cursor and Codex have their own committed hook files,
and a repo targeting them is not without an enforcement layer.

## Hooks

### Where they live

A `hooks` key inside `.claude/settings.json` (project, committed) or
`~/.claude/settings.json` (personal). **There is no `.claude/hooks.json`.** A
plugin bundles its own at `hooks/hooks.json`.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npm run lint:staged 1>&2 || exit 2" }
        ]
      }
    ]
  }
}
```

### Events

Confirmed in the current reference: `Setup`, `SessionStart`, `UserPromptSubmit`,
`PreToolUse`, `PostToolUse`, `PreCompact`, `PostCompact`, `Stop`,
`SubagentStart`, `SubagentStop`, `SessionEnd`. Newer events appear over time
(`PreModelSwitch` / `PostModelSwitch` are recent additions), and the Agent SDK
exposes a smaller subset than the CLI. **Treat any list, including this one, as
a snapshot — check the reference before shipping an event name.**

Matcher support differs per event. `SessionStart`'s matcher is how the session
began (`startup`, `resume`, `clear`, `compact`, `fork`); `PreCompact`'s is
`manual` or `auto`; `UserPromptSubmit` has no matcher and fires every time.
`PreToolUse` / `PostToolUse` match on tool name.

### Exit codes

| Code | Effect |
| --- | --- |
| 0 | Success. On `PreToolUse` this does **not** approve the call — it still goes through the normal permission flow. |
| 1 | Non-blocking error. The action proceeds. A policy hook that exits 1 enforces nothing. |
| 2 | Block. On `PreToolUse` the call is denied and the hook's **stderr** is the reason shown to the model. On `PostToolUse` nothing can be blocked (the tool already ran), but stderr still reaches the model as a warning. On `UserPromptSubmit` and `PreCompact` it blocks the prompt or the compaction. |

`PermissionRequest` does not honour exit 2 — deny through its JSON decision
object instead. Exit 2 also wins over a JSON `permissionDecision` of `allow`.

Because stderr is what the model reads, write it as a sentence addressed to the
agent: `"typecheck failed; fix the errors before finishing"`, not a stack trace.

## Hooks in Cursor and Codex

Both ship a committed, per-project hooks file that can deny a tool call. A repo
that targets either is not limited to prose plus git hooks, and an audit must
not say it is.

| | Claude Code | Cursor | Codex |
| --- | --- | --- | --- |
| Project file | `hooks` key in `.claude/settings.json` | `.cursor/hooks.json` | `.codex/hooks.json` |
| Personal file | `~/.claude/settings.json` | `~/.cursor/hooks.json` | `$CODEX_HOME/hooks.json` (default `~/.codex/`) |
| Pre-tool event | `PreToolUse` | `preToolUse`, plus `beforeShellExecution` / `beforeMCPExecution` / `beforeReadFile` | `PreToolUse`, plus `PermissionRequest` |
| Deny via JSON | `permissionDecision: "deny"` | `permission: "deny"` | `permissionDecision: "deny"` (older form: `decision: "block"`) |
| Deny via exit code | 2, reason on stderr | 2 | 2, reason on stderr |

Exit 2 blocks in all three. That is the one thing that ports; nothing else does.

Per-harness notes that change what you emit:

- **Cursor.** Project hooks are version-controlled and apply in any trusted
  workspace — the docs say so explicitly, so a committed `.cursor/hooks.json`
  reaches the whole team. Event names are camelCase (`preToolUse`, not
  `PreToolUse`) and there are 21 of them, including shell- and MCP-specific
  `before*` events that have no Claude Code equivalent. Hooks **fail open** by
  default: a crashing hook lets the action through unless that script sets
  `failClosed: true`. Resolution order is Enterprise → Team → Project → User.
- **Codex.** Project hooks load **only from trusted project layers**, so a
  committed `.codex/hooks.json` does nothing until the user trusts it via
  `/hooks` in the CLI — tell them that, or the file looks broken. Hooks are on
  by default (`[features] hooks = false` in `config.toml` disables them; the
  `codex_hooks` key is a deprecated alias). Codex's own docs call tool hooks
  "a useful guardrail, not a complete enforcement boundary"; quote that rather
  than overselling them.

Neither vendor marks hooks beta or experimental, and neither states a minimum
version. Do not claim one.

## Subagents

`.claude/agents/<name>.md`, a Markdown body with YAML frontmatter.

| Field | Effect |
| --- | --- |
| `name`, `description` | Identity and when to use it. The description is what the parent matches on. |
| `tools` / `disallowedTools` | Restrict the tool set. A reviewer with no edit tools cannot edit. |
| `model` | Run cheap work on a cheaper model. |
| `skills` | Preload skill content into the subagent at startup. |
| `omitClaudeMd: true` | Start without the user / project / local `CLAUDE.md`. For subagents that take everything from the delegation prompt. Managed policy files still load. |
| `isolation: worktree` | Run in a temporary git worktree, branched from the default branch (not the parent's HEAD), auto-cleaned if nothing changed. Note: it takes its instruction files from the main conversation, not from the worktree. |

Context semantics: a fresh context window, no parent history, no files the
parent read; only the final message returns to the parent.

## Permissions and sandboxing

`permissions` in `.claude/settings.json`:

- `allow` / `ask` / `deny` arrays of scoped rules, e.g. `Bash(git push *)`.
- `deny` is consulted before anything else and cannot be overridden.
- `ask` forces a confirmation even in a permission mode that would otherwise
  approve silently.
- `.claude/settings.json` is the project file; `~/.claude/settings.json` is
  personal; `.claude/settings.local.json` is where "don't ask again" approvals
  are saved — gitignore it.

Known limits, worth saying in any file you emit about this:

- Bash rules match the command text **as written**. `Bash(curl *)` does not
  match `sh -c 'curl …'` or `/usr/bin/curl`.
- `Read` / `Edit` deny rules do not cover every subprocess.
- Denying `WebFetch` does not stop `curl` if Bash is allowed.

The `sandbox` block (`enabled`, `filesystem`, `network.allowedDomains`) is the
OS-level enforcement that closes those gaps, and it picks up `Read` deny rules
and `WebFetch(domain:…)` rules too. For anything security-relevant, use both.

## Plugins, validation and evals

- `claude plugin validate <path>` — static check of a plugin manifest, a
  marketplace manifest, or the skills / agents / commands in a directory.
  `--strict` fails on warnings. Free and fast; put it in CI.
- `claude plugin eval` — behavioural. Suites live in an `evals/` directory
  inside the plugin; each case is a realistic prompt plus graders (regex,
  tool-use, or a rubric judged by a second model). `claude plugin eval init`
  interviews you and scaffolds the files.
- Each case also runs **without** the plugin, giving a baseline. A case scoring
  1.0 both with and without it means the plugin is not what made it pass.
- `--threshold` makes the command exit non-zero below a score, so it gates CI.
  The documented default is 1.0.
- Every run, and every rubric grader, is a real model call billed to the
  account. Say so before you put it in someone's CI.
- Requires Claude Code v2.1.269 or later.

## What is not documented

Say so rather than guessing:

- There is no documented way for a hook to *modify* a tool call's arguments;
  hooks allow, block, or add context.
- Hook timeouts and concurrency behaviour are not stated in the pages consulted
  for this file.
