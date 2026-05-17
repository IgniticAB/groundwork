---
name: context-engineer-mcp
description: Design a Model Context Protocol (MCP) configuration with least-privilege, human-in-the-loop, and auditing baked in. Use this before connecting an agent to a real system (database, deploy pipeline, API, file store). Triggers on "set up MCP for...", "give the agent access to...", "design an MCP server", "least privilege agent access", "/ce mcp".
---

# `mcp` — Design an MCP configuration

Before any agent is given write access to a real system, the access pattern needs to be designed. This command does not implement the MCP servers — it produces the *configuration* and *policy* that tells the team how to implement them safely.

Read `foundation/mcp-principles.md` first. This command is the operationalization of those three non-negotiables: least-privilege, HITL, auditing.

## What this command produces

Two files:

1. `.context/mcp-config.json` — a starter configuration in standard MCP host format, scoped to the four tiers from the principles doc.
2. `docs/mcp-policy.md` — the human-readable policy: which tiers exist, which actions require HITL, who can attach which servers, where audit logs live.

Plus, optionally, individual `mcp-server-<name>.config.json` stubs for each server tier.

## Procedure

### Step 1. Inventory the systems

Ask the user (multi-select where applicable):

1. **Which systems does the agent need to interact with?** Common options: production database, staging database, deploy pipeline, ticket system (Jira/Linear), wiki (Notion/Confluence), error tracking (Sentry), monitoring (Grafana/Datadog), file store (S3/GCS), email/Slack, payment system. Include any others the user names.
2. **Which of these involve writes vs reads?** For each, mark read-only, internal-write, prod-read, prod-write.
3. **Who is the agent identity?** A service account? A user impersonation? This shapes how credentials are scoped.

If the user is vague ("just hook it up to everything"), refuse politely and ask them to name the actual systems. "Hook it up to everything" is the failure mode this command exists to prevent.

### Step 2. Sort into tiers

From `foundation/mcp-principles.md`:

- **Tier 1 — Context (read-only, low-risk)**: anything the agent should always be able to read. Repo search, docs, observability, ticket reads.
- **Tier 2 — Internal write (medium-risk)**: create tickets, update wiki, post to internal channels.
- **Tier 3 — Production read (medium-risk)**: read prod data, query prod metrics.
- **Tier 4 — Production write (high-risk)**: deploy, migrate, charge, communicate externally.

Place every system from step 1 into a tier. Show the user the placement before generating anything.

### Step 3. Name the tools

For each system × action, propose a tool name following the verb + qualifier pattern from the principles. Example for a payments system:

- Tier 3: `read_payment_by_id`, `list_payments_for_customer`, `read_subscription_status`.
- Tier 4: `refund_payment_to_customer` (requires HITL), `cancel_subscription` (requires HITL).

Show the proposed names. Let the user adjust.

### Step 4. Configure HITL

For every Tier 4 tool, mark `requiresConfirmation: true` in the config. For Tier 2 and Tier 3 tools that are particularly sensitive (PII reads, anything sending external messages even from a "staging" context), also mark them.

State the HITL UX in `mcp-policy.md`: who approves, on what surface, with what audit trail. "The host shows a confirmation modal" is not a policy. Name the modal and the people who can click it.

### Step 5. Configure auditing

In `.context/mcp-config.json`, set up a log destination for every server. In `docs/mcp-policy.md`, name:
- Where the logs go (a specific system, not "we'll figure it out").
- Who has access to them.
- The alerting rules from the principles doc, with thresholds:
  - Tools invoked outside business hours
  - Parameter patterns matching sensitive data
  - Failure spikes
  - New tool combinations

If the user does not have an audit destination yet, recommend a specific simple one (e.g. "JSON Lines to stdout, scraped into your existing log pipeline") and write that into the policy.

### Step 6. Configure credentials

Per server tier: state the credential type, the role/scope, and where it lives (a secret manager, not the repo). The config file references env var names, never literal secrets.

If the user is on a specific cloud, name the specific service (AWS Secrets Manager, GCP Secret Manager, Vault). If they are not sure, recommend the obvious one for their cloud and let them adjust.

### Step 7. Write the config and policy

Use `templates/mcp-config.template.json` and `templates/mcp-policy.template.md` as starting points. Fill them in with the user's answers.

The policy file is human-readable. It includes:

```markdown
# MCP policy

## Tiers and servers

| Tier | Server | Read/Write | HITL | Credentials | Audit |
| --- | --- | --- | --- | --- | --- |
| 1 | repo-search | R | No | none | none |
| 1 | docs | R | No | none | none |
| 3 | prod-db-read | R | No | AWS SM: prod-db-readonly | CloudWatch |
| 4 | prod-deploy | W | Yes | AWS SM: deploy-role | CloudWatch + Slack alert |
| ... | | | | | |

## Attachment rules

[Who can attach which servers; default attachment per session]

## HITL procedure

[Who approves Tier 4 actions; what they see; how long approvals last]

## Audit destination

[Where logs go; who has access; alerting rules]

## Review cadence

[How often this policy is reviewed; trigger for review]
```

### Step 8. Cross-link

Reference `docs/mcp-policy.md` from `.context/conventions.md` so the agent knows where to find the policy when it asks "can I do X?"

### Step 9. Report

Files emitted, tier summary, the two or three highest-risk actions (which are now HITL). Two or three lines.

## Quality bar

- Every server is in exactly one tier.
- Every Tier 4 tool has `requiresConfirmation: true`.
- Every server has an audit destination named.
- No credentials in the config file (only env var references).
- The policy file is something an auditor would accept, not a vibe.

## Failure modes

- **One server, all tiers.** Hard no. Split.
- **HITL via prompt instruction.** "Tell the agent to ask first" is not a control. Enforce in the config.
- **Audit "TBD".** If you cannot name the audit destination, the system is not ready for the agent. Push back.
- **Credentials in the repo.** Never. Even "for testing". The config references env vars; the secrets live elsewhere.
