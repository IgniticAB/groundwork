# Cognitive Debt

Technical debt is code you wish was cleaner. Cognitive debt is code you wish you *understood*. AI accelerates both, but it pays down technical debt and accelerates cognitive debt at the same time.

## The mechanism

When an agent produces code faster than the team can internalize it, two things happen:

1. **Cognitive surrender.** Developers accept the diff because it passes tests, without forming a mental model of *why* it works. This is fine for one PR. It is fatal across a quarter.
2. **Knowledge erosion.** The team's collective theory of the system drifts away from the system itself. When something breaks in production, no one knows where to look.

Cognitive debt is invisible to linters and tests. It only surfaces during incidents.

## Three kinds of debt

| Type | Indicator | What AI does to it | Repayment |
| --- | --- | --- | --- |
| Technical | Duplication, poor structure, dead code | Reduces (it refactors well) | Automated linting, refactor passes |
| Cognitive | Slow onboarding, loss of confidence, "no one understands X anymore" | Accelerates (it generates faster than humans read) | Active design participation, plan reviews |
| Intent | "Why was this built this way?" has no answer | Accelerates (the agent makes choices from training patterns, not from your context) | ADRs, negative-space docs, rationale in PRs |

Intent debt is the most subtle. It looks like nothing went wrong. The code works. But the next time someone needs to change it, they have to reverse-engineer the choices from scratch.

## Context Rot: four failure modes in long sessions

Even with good context files in place, long-running agent sessions degrade. The session's conversation history accumulates, the agent runtime compacts it, and the original rules get summarized into vague generalizations. The same agent that wrote pristine, type-safe code in hour one starts writing unannotated functions in hour four.

The 2026 playbook taxonomy names four distinct rot patterns. Each has a different mitigation.

| Rot | What it looks like | Mitigation |
| --- | --- | --- |
| **Poisoning** | The agent uses deprecated APIs, outdated parameters, or stale syntax. The model's training data contradicts the current code. | Version-controlled deprecation logs; explicit "do not use X, use Y" rules; the `audit` command's stale-context check. |
| **Distraction** | Irrelevant rules fire while the agent is editing in an unrelated area. SQL conventions distract while editing a React component. | Scoped rules (`scope` command); strict token budgets in always-apply rules; split-file architecture. |
| **Confusion** | The agent conflates two similar-but-distinct objects. `User` and `UserAccount`, `Order` and `Invoice`. | Precise namespace mapping in conventions; before/after code examples; ADRs for the distinction. |
| **Clash** | Two rules in active memory contradict. Output paralysis or whichever rule the agent saw last "wins" silently. | Cross-file consistency check in `audit`; one canonical source (`AGENTS.md`) plus thin pointer files; centralized governance. |

The most common rot at hour two of a session is Distraction; at hour four it's Poisoning (the original rules have been summarized away). The `verify` hook plus the `audit` command catch most cases. Frequent session clears (`/clear` in Claude Code, equivalent elsewhere) force the agent to reload fresh configurations from disk rather than relying on compacted history.

## The four repayment practices

These are the moves that high-performing teams have converged on. Every command in this skill is built to support at least one of them.

### 1. Atomic interaction and review

Large features get broken into small, atomic changes. Each change is reviewed individually. The human stays the architect of the logic; the agent is the implementer.

How this skill helps: `plan` produces a contract that names the smallest reasonable unit of change. `verify` ensures each unit has its own check.

### 2. Externalize intent

Capture the *why* in files the agent will read on future runs. Two flavors:

- **ADRs** (Architecture Decision Records): "We chose X over Y because Z."
- **Negative-space docs**: "We considered W and rejected it because V."

Without negative-space docs, the agent will eventually suggest W again, because W is in its training data and your "we don't do W here" never made it into the repo.

How this skill helps: `adr` writes ADRs. `init` scaffolds a `docs/decisions/` directory. The `negative-space.md` section of every ADR template prompts the rejection rationale explicitly.

### 3. Plan Mode discipline

Before any non-trivial implementation, the agent produces a plan: files to be touched, approach, verification steps, rollback plan. The human reviews the plan as a contract before the agent writes any code.

How this skill helps: `plan` is exactly this. It produces a plan-contract file that lives in the repo until the change ships.

### 4. Verification-first workflows

The most reliable way to manage AI output is to give the agent rock-solid verification. Tests, linters, typecheckers, build commands. The agent can iterate until verification passes; you only review the final state.

How this skill helps: `verify` makes the verification commands first-class in the context files. Every command emits artifacts that reference the verification command, not just the do-this command.

## What success looks like

A team has repaid cognitive debt when:

- A new engineer joins, reads the context files, and is productive in hours not weeks.
- An incident happens and the on-call can pinpoint the relevant ADR within five minutes.
- The agent's first-pass output matches the team's conventions without correction more than 80% of the time.
- Refactors do not require a synchronous meeting to explain the original intent.

If any of those is not true, there is debt to repay. Run `audit` to find which kind.
