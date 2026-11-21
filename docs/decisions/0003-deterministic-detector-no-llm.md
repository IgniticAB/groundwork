# ADR-0003: The detector is deterministic and runs no model

- **Status**: accepted
- **Date**: 2026-05-20
- **Deciders**: Magnus Nord

## Context

The skill is probabilistic: it asks an agent to read a repo and write good
context files, and the quality of that output varies. Something has to check
the result. The obvious options were a model-graded check (ask an LLM whether
the `AGENTS.md` is any good) and a rule-based check.

The constraint is where the check runs. For this to matter it has to run in a
pre-commit hook and in CI, on every change, in under a second, with no API key,
no network, and a stable exit code. A model-graded check fails every one of
those: it costs money per run, it needs a credential in CI, it is slow enough
that people disable it, and it returns a different answer on Tuesday than it
did on Monday for the same input.

## Decision

`@ignitic/groundwork` is a deterministic detector. Twenty rules, each one a
pure function from a repo context to a list of findings. No model call, no
network, no key. A rule either names a file and a line or it does not fire.

## Considered alternatives

### Option A: Model-graded audit

**Pros**:
- Can judge things a regex cannot: is this rule actually useful, is this prose
  clear, does the file describe the code.
- Much less code.

**Cons**:
- Needs a key and a network in CI.
- Non-reproducible: the same commit can pass and then fail.
- Costs money per run, so it gets disabled.

**Why not chosen**:
Not rejected, relocated. This is what the skill's `audit` command does, and
what `claude plugin eval` does properly. The split is deliberate: the model
judges quality, the detector enforces invariants, and only the second one can
block a commit.

### Option B: Lean on an existing linter's plugin API

**Pros**:
- Inherits config, caching, editor integration.
- Less to build and maintain.

**Cons**:
- Ties a tool about Markdown and JSON to a JavaScript linter.
- Python and Rust repos have agent context too.

**Why not chosen**:
The files this checks are not source code, and the repos that need checking are
not all JavaScript.

## Consequences

**Positive**:
- Runs in ~150ms on this repo. Fast enough that nobody turns it off.
- `--fail-on P0` is a real gate, because the answer is stable.
- The rules are testable, and each one ships a should-fire and a
  should-not-fire case.

**Negative**:
- A rule can only catch what a regex and a file read can see. "This rule is
  vague" is caught by a hedge-word list, which is a crude proxy.
- Rules that cannot distinguish a real hit from a plausible one get skipped
  rather than softened, so the set stays deliberately narrow —
  `agents-md-duplication` only fires on documents using this skill's own
  headings, and says so.

**Reconsider if**:
A local model becomes cheap and fast enough to run in a pre-commit hook with a
reproducible result. The determinism is the requirement, not the absence of a
model.

## References

- `cli/src/rules/` — one file per rule, plus its tests in `cli/src/test/`
- `skills/groundwork/foundation/runtime-controls.md` §5 — validate vs eval
