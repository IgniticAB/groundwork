# The Five-Layer Context Stack

Every piece of information an AI agent reads belongs in exactly one of these layers. Mixing layers is the single most common cause of "the agent did the right thing locally but broke conventions globally".

| Layer | What lives here | Persistence | Examples |
| --- | --- | --- | --- |
| **System** | Role, persona, hard guardrails, output format constraints | High (static) | "You are a senior backend engineer", refusal rules, format directives |
| **Project** | Repo-level rules and conventions everyone shares | Medium (versioned) | `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/*.mdc`, tech stack definitions |
| **Codebase** | Deep awareness of the actual code | Medium (dynamic) | Semantic indices, repo maps, `@docs` references, file content the agent reads on demand |
| **Session** | The state of the task right now | Low (transient) | Chat history, recent tool output, error logs, the file the user just opened |
| **Tooling** | What the agent can do and how | Medium (infra) | MCP servers, CLI permissions, API definitions, sandbox boundaries |

## Why mixing layers breaks things

- A naming convention in the **Session** layer ("call this variable `userId` here") gets forgotten the moment the session ends. Put it in **Project** and every future agent inherits it.
- A timezone assumption in the **Project** layer (`"server is UTC"`) is wrong for the user running locally in CET. Put it in **Session** so the agent asks instead.
- Product docs in the **System** layer waste tokens on every call and push real instructions out of the model's immediate attention. Reference them from the **Codebase** layer; load them on demand.
- Database credentials in the **Project** layer get committed to git. They belong in **Tooling**, scoped to an MCP server that the agent can call but cannot read.

## The decision tree

When you (or a user) are about to write a rule somewhere, ask:

1. **Does it apply to every interaction in every repo?** → System.
2. **Does it apply to every task in this repo, no matter who is doing it?** → Project.
3. **Is it something the agent needs to look up about the actual code?** → Codebase (don't write it down statically; reference where to find it).
4. **Is it only true for the current task or the current user's machine?** → Session.
5. **Is it about what the agent is allowed to do, or how it talks to other systems?** → Tooling.

If a rule fits two layers, it almost always means the rule is too big and should be split.

## What good looks like

A `CLAUDE.md` (Project layer) that says:

```
We use pnpm, not npm. Tests run with `pnpm test`. Lint with `pnpm lint`.
For Python tooling see `pyproject.toml`. For deploy steps see `docs/deploy.md`.
```

That is three sentences and it tells the agent: the static facts, where to look up the dynamic facts, and the verification commands. Everything else lives in its layer.

A `CLAUDE.md` that runs to 800 lines describing the product, the customer personas, and every architectural decision ever made has failed. Those belong in dedicated docs that the Codebase layer points to.
