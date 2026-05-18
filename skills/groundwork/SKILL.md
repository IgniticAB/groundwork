---
name: groundwork
description: Set up and maintain state of the art context engineering for a new or existing project. Use this skill whenever the user wants to bootstrap a repo for AI-first development, write or improve a CLAUDE.md / AGENTS.md / .cursor/rules/ file, audit a project's "AI readiness", plan a non-trivial change before coding, author an ADR, scope rules to specific file patterns, design an MCP server with least-privilege access, or bake verification loops (tests, linters) into the AI's context. Also trigger when the user says "context engineering", "ContextOps", "AI-first repo", "cognitive debt", "plan mode", "negative space", or asks how to make a codebase work well with Claude Code, Cursor, Codex, or Copilot. Prefer this skill over ad-hoc prompting whenever the artifact being produced is something an AI agent will read on future runs.
---

# Groundwork

A single skill that teaches an AI agent how to set up and govern the information environment around a codebase, then exposes eight commands for the highest-leverage ContextOps moves.

The premise: in 2026, the bottleneck on AI-assisted engineering is no longer model capability, it is the quality of the context the model sees. Code that ships fast but nobody understands accumulates *cognitive debt*: the gap between a system's structure and the team's shared theory of how it works. The job of this skill is to make that context an engineered artifact, not a vibe.

## When this skill runs, you (Claude) should

1. **Read every file in `foundation/` before acting.** These are the principles every command relies on. They are intentionally short. If a command references one, that file is already loaded.
2. **Dispatch on the user's intent.** If the user named a command (`init`, `audit`, `plan`, etc.), open the matching file in `commands/`. If they described the outcome instead, pick the right command yourself and tell them which one you picked and why.
3. **Treat the artifacts you emit as code, not chat output.** Files like `CLAUDE.md`, `AGENTS.md`, ADRs, and plan contracts are versioned, reviewed, and live in the repo. They are not throwaway prompts.
4. **Never bloat.** A common failure is dumping every principle into every output file. The five-layer stack exists so each piece of context lives in the layer where it belongs.

## Foundation (read these first)

These seven files are the shared vocabulary every command uses. Read them once at the start of the session; commands assume you know them.

- `foundation/five-layer-stack.md` — System, Project, Codebase, Session, Tooling. What goes in each layer and why mixing them causes drift.
- `foundation/contextops-lifecycle.md` — Build, Distribute, Maintain, Update, Measure. The DevOps-style discipline that keeps context from rotting.
- `foundation/cognitive-debt.md` — What cognitive debt is, how AI accelerates it, the Context Rot taxonomy (Poisoning / Distraction / Confusion / Clash), and the four repayment practices.
- `foundation/anti-patterns.md` — The things never to do. Monolithic prompt bloat, vague principles (with the anchored-vs-vague comparison table), placeholder comments, implicit assumptions, tool over-exposure.
- `foundation/good-practices.md` — Negative space, defensive commits, interface-first, verification-driven logic, plan mode, split-file architecture (AGENTS.md canonical + CLAUDE.md symlink + `.claude/rules/`), three-tier boundaries, HTML preservation tags.
- `foundation/harness-reference.md` — Where files live for Claude Code, Cursor, Codex, Copilot, Windsurf, Cowork. Naming, scoping, frontmatter formats, numeric-prefix convention for `.claude/rules/`.
- `foundation/mcp-principles.md` — Least-privilege binding, human-in-the-loop, centralized auditing. The non-negotiables for any MCP server you design.

## The nine commands

Each command lives in `commands/<name>.md`. Open the file when invoked; do not try to remember the procedure from this menu.

| Command | One-liner | When to reach for it |
| --- | --- | --- |
| `init` | Bootstrap a repo with the full context-engineering scaffolding | New repo, or an existing repo that has nothing yet |
| `audit` | Score the repo's context engineering maturity across the five layers | "How good is our AI setup?" or before a major change |
| `document` | Scan code and produce or refresh CLAUDE.md, conventions, build/test commands | After a stack change, or first-pass discovery on an existing repo |
| `plan` | Produce a Plan Mode contract for a specific task before any code is written | Any non-trivial change, especially refactors and migrations |
| `adr` | Author an Architecture Decision Record that future agents will read as context | A choice was made and the *why* needs to outlive the conversation |
| `scope` | Generate file-pattern-scoped rules so the right context loads for the right files | The repo has multiple stacks, or rules keep firing where they shouldn't |
| `mcp` | Design an MCP server configuration with least-privilege and HITL boundaries | Connecting an agent to a real system (DB, deploy, API) |
| `verify` | Bake test / lint / typecheck commands into context so the agent self-corrects | Every repo, every time. The single highest leverage move. |
| `onboard` | Produce a task-specific orientation brief for a fresh agent or engineer | Starting a new session, handing off work, compacting a noisy session |

If the user just says `groundwork` with no command, list the nine options and ask which one they want, or what they are trying to accomplish if they cannot name it.

## How to invoke a command

Users invoke commands three ways:

- **Natural language.** "Set up this repo for AI-first development" → triggers `init`. "How good is our AI setup?" → triggers `audit`. The skill's description is pushy enough that the agent picks the right command.
- **Explicit invocation.** `groundwork init`, `groundwork audit`, etc. Works in every harness.
- **Slash shortcut (Claude Code only, optional).** `/gw init`, `/gw audit`, etc. Requires the user to have installed `slash-commands/gw.md` into `.claude/commands/`. Without that file, `/gw` still works as a trigger phrase but is not a true slash command.

When the user invokes a command:

1. Confirm you are about to run the right command. One line. If you picked it yourself (the user described the outcome instead of naming the command), tell them which one and offer a different one if they push back.
2. Open the matching file in `commands/`. Follow its procedure literally.
3. Most commands ask the user a small number of questions before generating anything. Use the `AskUserQuestion` tool if available; otherwise ask in plain prose with numbered options. **Do not skip the questions** — generating the wrong scaffolding is more expensive than asking three questions.
4. Emit the files the command specifies. Always show file paths the user can click or copy.
5. End with the one or two next moves the user should take. No long postamble.

## What "good output" looks like

Across every command, hold the line on these:

- **No placeholders.** Never write `// TODO: implement` or `[fill this in]` into a file that will live in the repo. Either fill it or do not include it.
- **No abstract principles without examples.** "Use good judgment" is useless. Pair every guideline with a concrete "Preferred vs. Avoid" pair.
- **No monolithic prompt bloat.** A `CLAUDE.md` that reads like a product spec has failed. It belongs in the Project layer; product docs belong in their own files referenced from the Codebase layer.
- **No implicit local assumptions.** The agent does not know the user's timezone, OS, default package manager, or which Node version is installed. Either state it in the Session layer or have the agent ask.
- **Verification baked in.** Every file you emit that tells the agent to do something should also tell it how to check the result. If `npm test` is the verification command, name it.

## A note on harness choice

This skill is harness-agnostic. The `init`, `document`, `scope`, and `verify` commands all ask the user which harnesses they want to target (Claude Code, Cursor, Codex, Copilot, Windsurf, or several) and emit the right files for each. `foundation/harness-reference.md` is the source of truth for where each harness expects files.

Default to asking. Do not assume Claude Code just because this skill ships with Claude Code conventions internally.

## A note on memory vs. context

Memory (the agent's long-term notes about the user) and context (the files in the repo the agent reads to do its job) are different. This skill governs the *context*. Anything user-specific or session-specific belongs in memory, not in the repo files this skill emits. If the user asks you to put their preferences into `CLAUDE.md`, push back: those go in memory.
