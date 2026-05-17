# MCP Principles

The Model Context Protocol (MCP) is how agents reach real systems: databases, deploys, APIs, file stores, ticketing. It is also the largest attack surface and the largest source of operational risk in an AI-first stack. Get it right.

## The three primitives

| Primitive | What it is | Risk profile |
| --- | --- | --- |
| **Resources** | Read-only data the agent can pull (e.g. a Postgres URI it can `SELECT` from) | Low; data exposure only |
| **Tools** | Executable actions with side effects (e.g. `deploy_to_prod`, `delete_user`) | High; can mutate state |
| **Prompts** | Reusable templates the host renders | None directly; can leak via injection |

The mental model: Resources are "what the agent sees". Tools are "what the agent does". Always know which kind you are exposing and why.

## The three non-negotiables

### 1. Least-privilege binding

An agent should have exactly the permissions its current task requires, no more.

- **Physically separate read-only and mutation-capable servers.** The MCP server that lets the agent query the database is a different server from the one that lets it run migrations. The agent gets the read-only one by default. The migration server is only attached when the user explicitly needs it.
- **Scope credentials to the smallest possible role.** The read-only Postgres role has SELECT on the schemas the agent needs and nothing else. No DROP, no DELETE, no access to PII columns unless the task requires it.
- **No "god" servers.** A single MCP server that wraps the entire AWS account is not a tool, it is a vulnerability. Break it up: one server for S3 reads, one for deploys, one for IAM. Each has its own credentials.

### 2. Human-in-the-loop (HITL) for high-stakes actions

Destructive or production-affecting actions require explicit human approval, surfaced through a consent UI before execution.

The categories that always need HITL:
- Production deploys
- Database migrations and DELETE-class queries
- Anything that touches money (charges, refunds, transfers)
- Anything that sends external communication (email, SMS, Slack to non-internal channels)
- Anything that touches customer data in PII columns

The categories where HITL is optional but recommended:
- Writes to shared internal systems (Notion pages, Jira tickets that other humans will read)
- Long-running operations (build, train, large data move)

The categories where HITL is excessive:
- Read-only queries against dev environments
- Operations against ephemeral resources the agent owns end-to-end (a sandbox it spun up)

The MCP server itself should encode this: high-stakes tools have a `requiresConfirmation: true` flag that the host honors. Do not rely on the prompt to remember to ask.

### 3. Centralized auditing

Every tool invocation is logged, including:
- The agent identity (which agent, which user, which session)
- The tool name and full parameters
- The response (or error)
- Timestamp and duration

Logs go to a system the security team can query in real time. Alert on:
- Tools invoked outside their normal hours
- Parameters that match known sensitive patterns (e.g. `LIKE '%@%'` on user tables)
- Failure spikes that suggest probing
- New tool combinations the agent has not used before

The audit trail is not optional. It is the only way to detect an MCP compromise after the fact and the only way to recover trust if something goes wrong.

## Design patterns

### The four-tier server layout

For most stacks, MCP servers fall into four tiers:

1. **Context** (read-only, low-risk): repo search, docs, observability dashboards, ticket reads. Attached by default.
2. **Internal write** (medium-risk): create tickets, update wiki, post to internal channels. Attached on request; HITL recommended.
3. **Production read** (medium-risk): read prod data, query prod metrics. Attached on request; auditing strict.
4. **Production write** (high-risk): deploy, migrate, charge. Attached only for the specific task; HITL required for every invocation.

### Tool naming

Tool names should make the blast radius obvious. Prefer:

- `read_customer_by_id` over `get_customer`
- `delete_draft_invoice` over `delete_invoice`
- `deploy_to_staging` over `deploy`
- `send_test_email` over `send_email`

The verb plus the qualifier ("draft", "staging", "test") tells the agent and the human what category of action this is before they read the description.

### Configuration as code

The MCP configuration lives in the repo, not in the host's UI. This means:

- It is reviewed in pull requests.
- Changes are auditable in git.
- New team members get the same setup.
- The `mcp` command can emit a starter configuration the team iterates on.

## The most common mistakes

- **Expose every tool "just in case".** Token waste, attention dilution, security risk. Route tools by intent.
- **One credential per server.** A single leaked credential should give an attacker access to one tier, not the whole stack.
- **HITL implemented in the prompt only.** "Ask before deleting" is not a security control. The MCP server must enforce it.
- **Skip auditing because "it's dev".** Dev becomes prod-adjacent the first time someone uses prod data to test. Audit everything.
- **Trust tool descriptions.** A malicious MCP server can put anything in a tool description. Treat them as untrusted input. Pin server versions, review them like dependencies.

## What this skill emits

The `mcp` command does not stand up a server for you. It produces:

1. A configuration file matching the four-tier layout, tailored to the systems the user names.
2. An `mcp-policy.md` in the repo that captures which tiers exist and which actions require HITL.
3. Tool naming guidance specific to the user's stack.
4. A starter auditing setup (log destination, alert rules).

Implementation of the servers themselves is out of scope; the goal is to make sure when they get built, they are built right.
