# Negative space

Approaches we considered and rejected that did not warrant a full ADR. Each entry is short, dated, and names the specific reason for the rejection.

The purpose: prevent future agents (and engineers) from re-suggesting these. The agent does not know the team's history; this file is how the team writes it down.

## Format

Each entry:

```markdown
### <approach>
**Considered**: <YYYY-MM-DD>
**Rejected because**: <one or two sentences>
**Reconsider if**: <specific trigger, or "no foreseeable trigger">
```

## Entries

<!-- Add entries below. Most recent at the top. -->

### Example entry: <approach>
**Considered**: <YYYY-MM-DD>
**Rejected because**: <reason>
**Reconsider if**: <trigger>

### Competing with the other context linters on rule count
**Considered**: 2026-11-21
**Rejected because**: The niche filled up while this sat idle — ctxlint, AgentLint, AgentLinter, johnpapa/ai-ready. Chasing their rule counts would mean shipping rules that cannot tell a real hit from a plausible one, which is the opposite of the argument this tool makes. The rules that are here are the ones that name a file and a line.
**Reconsider if**: A rule is proposed that is both precise and absent from every other tool, as `verification-command-missing` and `skill-frontmatter-portability` were.

### Marketing: SEO, launch posts, a push for stars
**Considered**: 2026-11-21
**Rejected because**: The job this repo does is to be correct and current for someone who clones it after clicking through from a profile. Reach is a different job with different work, and spending on it while the clone was broken would have been worse than spending on neither.
**Reconsider if**: The repo is picked up by people who did not arrive from that link, and the questions they ask suggest it is solving something for them.

### Adding an eleventh command
**Considered**: 2026-11-21
**Rejected because**: Ten is already more than the README kept straight — the count was stated as eight, nine and ten in four different places. The skill's `description` carries trigger text for every command and is at ~1,280 of the 1,536 characters a host accepts; an eleventh starts costing discoverability for the ten that exist.
**Reconsider if**: Two existing commands merge, freeing both the slot and the description budget.

### A model-graded check inside the detector CLI
**Considered**: 2026-05-20
**Rejected because**: See ADR-0003. It would need a key and a network in CI, cost money per run, and return different answers for the same commit. The model-graded job belongs to the skill's `audit` command and to `claude plugin eval`, neither of which blocks a commit.
**Reconsider if**: A local model is cheap and fast enough to run in a pre-commit hook with a reproducible result.

### npm workspaces at the repo root
**Considered**: 2026-11-21
**Rejected because**: Workspaces want one lockfile at the root, which breaks `cache-dependency-path` in the site's deploy workflow and conflates two independently published artifacts. The root `package.json` delegates with `--prefix` instead, and each sub-project keeps its own lockfile.
**Reconsider if**: The CLI and the site start sharing code, which they currently do not.
