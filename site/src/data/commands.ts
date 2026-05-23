export interface CommandMeta {
  slug: string;
  name: string;
  oneLiner: string;
  reachFor: string;
  blurb: string;
}

export const commands: CommandMeta[] = [
  {
    slug: 'init',
    name: 'init',
    oneLiner: 'Bootstrap a repo with the full context engineering scaffolding.',
    reachFor: 'A new repo, or an existing repo with no CLAUDE.md / AGENTS.md / .cursor/rules yet.',
    blurb: 'The single most leveraged move. Runs once per repo and sets up every artifact the other commands assume exists.',
  },
  {
    slug: 'audit',
    name: 'audit',
    oneLiner: 'Score the repo across the five context layers and name the gaps.',
    reachFor: '"How good is our AI setup?" Or before a migration, a new-hire, or a handoff.',
    blurb: 'Maturity score, prioritised findings, and the next two or three commands worth running. Defensible numbers, not vibes.',
  },
  {
    slug: 'document',
    name: 'document',
    oneLiner: 'Delta-refresh stale context files without nuking history.',
    reachFor: 'The repo already has CLAUDE.md / AGENTS.md / rules, but they no longer match the code.',
    blurb: 'Keeps the why. Marks the old rule deprecated with a date and reason, layers the new rule on top, never silently rewrites.',
  },
  {
    slug: 'plan',
    name: 'plan',
    oneLiner: 'Author a Plan Mode contract before any non-trivial change.',
    reachFor: 'Refactors, migrations, anything touching more than three files or a public API.',
    blurb: 'The human stays the architect. The agent is the implementer. The plan is reviewed and approved as a contract before code is written.',
  },
  {
    slug: 'adr',
    name: 'adr',
    oneLiner: 'Capture an Architecture Decision Record, including the alternatives you rejected.',
    reachFor: 'A choice was made and the why needs to outlive the conversation.',
    blurb: 'MADR-lite with a non-negotiable negative-space section and a "Reconsider if" trigger. Ingests live decisions, merged PRs, or commit ranges.',
  },
  {
    slug: 'scope',
    name: 'scope',
    oneLiner: 'Scope rules to file patterns so the right context loads in the right files.',
    reachFor: 'Multiple stacks in one repo, or rules that keep firing where they should not.',
    blurb: 'Frontend rules in frontend files. SQL rules in migrations. Nothing global unless it really is global.',
  },
  {
    slug: 'mcp',
    name: 'mcp',
    oneLiner: 'Design an MCP setup with least-privilege, human-in-the-loop, and real auditing.',
    reachFor: 'Before connecting an agent to anything that can touch production.',
    blurb: 'Four tiers, named credentials, HITL flags enforced in config, not in the prompt. The policy file an auditor would actually accept.',
  },
  {
    slug: 'verify',
    name: 'verify',
    oneLiner: 'Bake test, lint, and typecheck commands into context so the agent self-corrects.',
    reachFor: 'Every repo. Every time. The single highest-leverage move in this skill.',
    blurb: 'Detected, run, then written into every harness file with a fast/full split. A pre-commit hook keeps the context honest as the code drifts.',
  },
  {
    slug: 'onboard',
    name: 'onboard',
    oneLiner: 'Produce a task-specific orientation brief for a fresh agent or engineer.',
    reachFor: 'New chat session, handoff to a teammate, or compacting a noisy session into a clean restart.',
    blurb: 'A 600-word slice of the context. The 3 to 5 ADRs that actually apply, the conventions for this area, the verification commands, the out-of-scope. Nothing else.',
  },
  {
    slug: 'apply',
    name: 'apply',
    oneLiner: 'Apply a remediation plan produced by `audit --html` to the repo.',
    reachFor: 'Right after an interactive audit, to enact the chosen fixes without copy-pasting them by hand.',
    blurb: 'Reads the structured remediation file, validates it, dry-runs the changes, applies them on confirmation, runs the fast verification, offers rollback on failure. Closes the loop between audit and action.',
  },
];

export function getCommand(slug: string): CommandMeta | undefined {
  return commands.find((c) => c.slug === slug);
}

export function getCommandNeighbors(slug: string): {
  prev: CommandMeta | null;
  next: CommandMeta | null;
} {
  const i = commands.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? commands[i - 1] : null,
    next: i < commands.length - 1 ? commands[i + 1] : null,
  };
}
