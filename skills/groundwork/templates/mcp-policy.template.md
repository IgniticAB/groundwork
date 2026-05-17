# MCP policy — <project name>

This document is the human-readable policy for agent access to real systems. It is paired with `.context/mcp-config.json`, which is the machine-readable configuration. When the two diverge, this policy is the intent and the config is the implementation.

Last reviewed: <YYYY-MM-DD>
Next review: <YYYY-MM-DD>
Owner: <name or role>

## Tiers

| Tier | Description | Default attached | HITL required |
| --- | --- | --- | --- |
| 1 | Read-only context (repo, docs, dashboards) | Yes | No |
| 2 | Internal writes (tickets, wiki, internal channels) | No, attach on request | Recommended |
| 3 | Production reads (data, metrics) | No, attach on request | No, but strict audit |
| 4 | Production writes (deploy, mutate, charge, external comms) | No, attach for specific task | Yes, every invocation |

## Servers

| Server | Tier | Read/Write | HITL | Credential source | Audit destination |
| --- | --- | --- | --- | --- | --- |
| repo-search | 1 | R | No | none | <destination> |
| docs-search | 1 | R | No | none | <destination> |
| tickets-write | 2 | W | Recommended | <secret manager: path> | <destination> |
| prod-db-read | 3 | R | No | <secret manager: path> | <destination> |
| prod-deploy | 4 | W | **Yes** | <secret manager: path> | <destination> |

## Attachment rules

- Tier 1: attached automatically to every agent session.
- Tier 2: attached on user request. Agent cannot attach itself.
- Tier 3: attached on user request. Session-bounded; detaches at end of session.
- Tier 4: attached for the specific task. Detaches on task completion. Re-attaching requires fresh approval.

## HITL procedure

- **Where the prompt appears**: <name the host UI; e.g. "Claude Code confirmation modal in the IDE">.
- **Who can approve**: <list of roles or named individuals>.
- **What the approver sees**: tool name, parameters, the calling agent's recent context, and the audit trail of the past three invocations.
- **Approval duration**: per-invocation. No "approve all". (Exception: low-risk repeatable actions can have approve-for-session, but never for Tier 4.)

## Audit destination

- **Where logs go**: <specific system, e.g. "CloudWatch log group `agent-mcp-audit`">.
- **Who has access**: <list>.
- **Retention**: <duration>.

### Alerting rules

- Tools invoked outside <business hours, e.g. 06:00-22:00 CET>.
- Parameters matching patterns: <list, e.g. queries matching email/phone columns on user tables>.
- Failure rate exceeding <threshold> per hour.
- New tool combinations (an agent invokes two tools it has never combined before, against production).

Alerts go to <destination, e.g. Slack #security-alerts and PagerDuty rotation `oncall-platform`>.

## Credential management

- Secrets live in <named secret manager>.
- Credentials are scoped to the minimum role needed for the server's purpose.
- Rotation: <cadence, e.g. quarterly for human-shared, annually for service accounts>.
- No credential ever appears in the repo, in `.env` files committed to git, or in chat logs.

## Review cadence

This policy is reviewed:
- Every <cadence, e.g. quarter>.
- Whenever a new server is added to a higher tier.
- After any incident involving agent access.

## Incident response

If an agent does something destructive that should have been blocked:
1. Disable the relevant server in `.context/mcp-config.json` immediately.
2. Audit the past <window> of invocations against the affected systems.
3. File a post-incident ADR (see `docs/decisions/`).
4. Adjust this policy based on the ADR's findings.
