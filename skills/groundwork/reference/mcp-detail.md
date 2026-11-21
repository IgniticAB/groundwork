# MCP Detail (load on demand)

Tiers, annotation fields, config paths and the host-level facts you need to emit
a working MCP configuration. `foundation/mcp-principles.md` carries the
principles; this file carries the things that must be exactly right.

**Last verified: 2026-11-21** against modelcontextprotocol.io. The current
protocol revision is **2026-07-28**. Where a claim is version-sensitive, the
revision that introduced it is named.

## Where the configuration actually goes

| Host | Path |
| --- | --- |
| Claude Code | `.mcp.json` at the repo root (project scope) |
| Cursor | `.cursor/mcp.json` |
| VS Code | `.vscode/mcp.json` |

**Do not emit `.context/mcp-config.json`.** Earlier versions of this skill did,
describing it as "standard MCP host format". No host reads that path, so the
configuration was inert — the worst failure mode available, because it looks
done.

## Tool annotations

Four optional booleans on a tool definition. The spec is explicit that they are
**hints**, not guarantees, and may not faithfully describe what the tool does.

| Annotation | Default | Meaning |
| --- | --- | --- |
| `readOnlyHint` | `false` | `true` means the tool does not modify its environment. |
| `destructiveHint` | `true` | Whether the tool may make destructive rather than purely additive changes. Only meaningful when `readOnlyHint` is false. |
| `idempotentHint` | `false` | Repeated calls with the same arguments have no additional effect. Only meaningful when `readOnlyHint` is false. |
| `openWorldHint` | `true` | The tool interacts with external entities (a web search) rather than a closed domain (a memory store). |

Note the defaults: an unannotated tool is read as *not* read-only, *possibly*
destructive and open-world. That is the safe direction, but it means "we did not
annotate" and "this is dangerous" look identical to a host.

Introduced in revision 2025-03-26. Adoption is uneven across the ecosystem, and
a value may simply be an SDK default rather than a deliberate choice — so do not
read an annotation as evidence that anyone thought about it.

## What hosts ignore

The starter template carries `_tier`, `_description`, `audit` and `alertOn`
keys. **No host reads any of them.** They are annotations for humans — they
document the policy, they do not enforce it, and the underscore prefix marks the
ones that are purely ours.

Say this out loud whenever you emit them. A team that believes `audit.alertOn`
is wiring up alerts has a policy document it mistakes for a control.

## Human-in-the-loop categories

**Always:** production deploys; database migrations and DELETE-class queries;
anything touching money; anything sending external communication; anything
touching PII columns.

**Recommended:** writes to shared internal systems other humans will read;
long-running operations (build, train, large data move).

**Excessive:** read-only queries against dev; operations on ephemeral resources
the agent owns end to end.

## The four-tier server layout

1. **Context** — read-only, low risk: repo search, docs, dashboards, ticket reads. Attached by default.
2. **Internal write** — medium risk: create tickets, update wiki, post internally. Attached on request; approval recommended.
3. **Production read** — medium risk: read prod data and metrics. Attached on request; auditing strict.
4. **Production write** — high risk: deploy, migrate, charge. Attached only for the specific task; approval required per invocation, enforced in the server.

## Auditing specifics

Log agent identity (which agent, which user, which session), tool name and full
parameters, the response or error, timestamp and duration. Alert on:

- Tools invoked outside their normal hours.
- Parameters matching sensitive patterns (e.g. `LIKE '%@%'` against user tables).
- Failure spikes that suggest probing.
- Tool combinations the agent has not used before.

## Newer protocol features worth knowing

- **Elicitation** (added 2025-06-18) lets a server ask the user for input
  mid-call instead of failing or guessing. URL mode arrived in 2025-11-25. In
  2026-07-28 the protocol moved to stateless request/response, and
  server-initiated requests such as `elicitation/create` were replaced by
  Multi Round-Trip Requests. Check which revision the host and SDK implement
  before designing around it.
- **OAuth** — MCP servers act as OAuth resource servers, so access can be bound
  to a real identity rather than a shared static token in an env var.
- **Deferred / searchable tool loading** — the real fix for tool-count bloat.
  Tool schemas load when needed rather than all at session start. Prefer this
  over pruning useful servers.

## What is not documented

- No protocol field compels a host to confirm before a tool call. Confirmation
  is host behaviour, informed by annotations.
- The spec does not define audit logging; that is entirely the server's job.
