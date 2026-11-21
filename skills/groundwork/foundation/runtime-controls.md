# Runtime Controls

Context files tell the agent what to do. The runtime decides what it *can* do.
Everything in the other foundation files is prose the model may or may not
follow; everything here is machinery that holds whether it follows or not.

**Last verified: 2026-11-21** against Claude Code's own docs. Exact event names,
frontmatter fields and flags live in `reference/runtime-detail.md` — load that
when you are about to emit a file, not before. Re-verify both before a release.

This layer is Claude Code-specific today. Other harnesses are adding their own
equivalents; the principles transfer, the file paths do not.

## The dividing line

> Deterministic scaffolding, probabilistic intelligence.

A rule the agent must follow *every* time is not a rule, it is a check. Prose
asks; a hook enforces. The test to apply to any line in `AGENTS.md`:

| If the line… | It belongs in |
| --- | --- |
| Describes a judgement call ("prefer composition over inheritance") | `AGENTS.md`. Only a reader can apply it. |
| Names a command that must run after a class of edits | A hook. `PostToolUse` on the edit tools. |
| Forbids touching a path | A `deny` permission rule, not a Never bullet alone. |
| Must hold before the agent says it is done | A `Stop` hook that runs the verification. |

Writing a rule in prose is not free: it spends attention on every turn, and it
still fails silently. If the thing can be checked by a script, check it.

## 1. Hooks are the enforcement layer

Hooks are shell commands Claude Code runs at fixed points in its own loop. They
go under a `hooks` key in `.claude/settings.json` — committed, reviewed,
versioned like any other project config.

The points worth knowing: `PreToolUse` (before a tool runs, can block),
`PostToolUse` (after, cannot block — the tool already ran), `UserPromptSubmit`
(before the model sees the prompt), `Stop` (before the agent finishes its turn),
and `SessionStart`. The full list is longer and still growing; read the
reference rather than guessing an event name.

The mechanism is exit codes, not prose. **Exit 2 is the blocking signal**: on
`PreToolUse` it denies the call and the hook's *stderr* becomes the reason the
agent sees — so the stderr line is a message to the model, and should read like
one. Exit 1 is a non-blocking error; the action proceeds. A hook that means to
enforce a policy and exits 1 enforces nothing.

The highest-leverage two:

- **`Stop` running the full verification.** The agent cannot declare done on a
  red build. This is `foundation/good-practices.md` §4 made unskippable.
- **`PostToolUse` running the formatter or linter on edited files.** Removes an
  entire category of prose rule from `AGENTS.md`.

Git pre-commit hooks still matter — they catch what the human does too — but
they fire long after the agent has moved on. Agent-runtime hooks fire while the
agent can still act on them.

## 2. Subagents are the context-isolation layer

A subagent (`.claude/agents/<name>.md`) starts in a **fresh context window**. It
does not see the parent conversation or the files the parent has read, and only
its final message comes back — every intermediate tool call and file dump stays
inside it.

That makes it the answer to Context Distraction (`foundation/cognitive-debt.md`):
read-heavy work — searching a large codebase, reviewing a diff, scanning logs —
returns a conclusion instead of fifty file excerpts. The cost is real: the
subagent knows only what its prompt says, so a vague delegation gets a confident
wrong answer back. Brief it like a new colleague.

Subagents are also where tool restriction becomes cheap: a reviewing subagent
with no edit tools cannot edit, whatever it concludes.

## 3. Skills, MCP and hooks answer different questions

A recurring and expensive confusion. The deciding question is *what kind of
thing is missing*:

| Missing | Use | Why |
| --- | --- | --- |
| Know-how — a procedure, checklist or convention | A **skill** | It is instructions. Loads on relevance, costs a description line until used. |
| Access to a system outside the terminal | **MCP** (or that system's CLI, if it has one) | It is a connection. See `foundation/mcp-principles.md` before designing one. |
| A guarantee that something happens every time | A **hook** | Neither of the above decides; both leave it to the model. |

If a system already has a CLI, prefer the CLI. An MCP server adds tool names to
every session's context; a CLI the agent already knows how to run adds nothing.

## 4. Permissions are a context concern, not only a security one

`permissions` in `.claude/settings.json` takes `allow`, `ask` and `deny` lists.
`deny` blocks before anything else is consulted. `ask` forces a confirmation
even in a permission mode that would otherwise approve silently — which is the
right shape for the "Ask first" tier in `AGENTS.md`'s Boundaries.

The limit worth stating out loud: **Bash rules match the command text as the
agent writes it.** `Bash(curl *)` does not catch `sh -c 'curl …'`. For anything
that genuinely must not happen, the OS-level sandbox is the enforcement and the
permission rule is the hint.

A Boundaries → Never bullet with no matching `deny` rule is a wish. Write both.

## 5. Evals are how you find out whether any of it worked

Conformity (`foundation/contextops-lifecycle.md` step 5) is measurable rather
than felt:

- **`claude plugin validate`** — static. Manifests, skills, agents and commands
  checked for syntax and schema errors. Free, fast, belongs in CI.
- **`claude plugin eval`** — behavioural. Test cases, each a realistic prompt
  plus graders, scored. Crucially it also runs each case *without* the context,
  so a case that scores the same either way tells you the context did nothing.
  Real model calls, so it costs money; `--threshold` makes it a CI gate.

That baseline comparison is the honest version of "is our context working?".
Everything else is a guess about a file nobody re-read.
