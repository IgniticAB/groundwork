# MCP Principles

The Model Context Protocol is how agents reach real systems: databases, deploys,
APIs, file stores, ticketing. It is also the largest attack surface in an
AI-first stack. This file is the part every command needs to know;
`reference/mcp-detail.md` carries the tiers, field names and config paths, and
`commands/mcp.md` loads it when it is actually designing a server.

**Last verified: 2026-11-21** against modelcontextprotocol.io.

## The three primitives

| Primitive | What it is | Risk |
| --- | --- | --- |
| **Resources** | Read-only data the agent can pull | Low; data exposure only |
| **Tools** | Executable actions with side effects | High; can mutate state |
| **Prompts** | Reusable templates the host renders | Indirect; can carry injection |

Resources are what the agent *sees*. Tools are what the agent *does*. Always
know which you are exposing, and why.

## 1. Least-privilege binding

An agent gets exactly the permissions its current task requires.

- **Separate read-only and mutation-capable servers physically.** The server
  that queries the database is not the server that migrates it. The read-only
  one is attached by default; the other is attached for a specific task.
- **Scope credentials to the smallest role.** One credential per server, so a
  leak costs one tier rather than the whole stack.
- **No "god" servers.** One server wrapping an entire cloud account is not a
  tool, it is a vulnerability.

## 2. Human-in-the-loop, enforced in the server

Destructive or production-affecting actions need explicit human approval. The
part teams get wrong is *where* that approval is enforced.

**There is no `requiresConfirmation` field in MCP.** Earlier versions of this
file said there was. What the protocol gives you is four optional annotations —
`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` — and the
spec states plainly that they are **hints, not guarantees**, and not certain to
describe what a tool really does. A host may use them to decide what to
auto-approve. Nothing makes it, and nothing stops a server from annotating a
destructive tool as read-only.

So: annotate every tool, because a host that honours hints cannot help you if
you never set them — then enforce the real control inside the server, which is
the only place that can refuse. HITL in an annotation is the same mistake as
HITL in a prompt, one layer down.

Which actions always need it, and which do not: `reference/mcp-detail.md`.

## 3. Centralized auditing

Every tool invocation is logged — agent identity, tool name, full parameters,
response, timestamp — to a system the security team can query in real time.

The audit trail is not optional. It is the only way to detect a compromise after
the fact, and the only way to recover trust once something has gone wrong.

## Fewer tools, not more

Every connected server puts its tool names into every session's context before
anything is called. A server attached "just in case" is a standing tax on
attention. If a system already has a CLI the agent can run, that is usually the
cheaper door — see `foundation/runtime-controls.md` §3.

Tool names should make the blast radius obvious: `read_customer_by_id` over
`get_customer`, `deploy_to_staging` over `deploy`. The qualifier tells both the
agent and the human what category of action this is before either reads a
description.

## The most common mistakes

- **Expose every tool "just in case".** Token waste, attention dilution, risk.
- **Share one credential across servers.** A leak should cost one tier.
- **Implement HITL in the prompt only.** "Ask before deleting" is not a control.
- **Treat an annotation as a control.** `destructiveHint: true` is a label the
  server chose. It asks a host for confirmation; it cannot require one.
- **Skip auditing because "it's dev".** Dev becomes prod-adjacent the first time
  someone tests with prod data.
- **Trust what the server sends.** A compromised server can put anything in a
  tool description *or in a tool result*. Results are the larger surface: they
  arrive mid-task, while the agent is already acting. See anti-pattern #12.

## What this skill emits

`mcp` does not stand up a server. It produces a configuration matching the tier
layout, an `mcp-policy.md` capturing which tiers exist and which actions require
human approval, naming guidance for the user's stack, and a starter auditing
setup. Implementation is out of scope; the goal is that when the servers get
built, they get built right.
