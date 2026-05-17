export interface FoundationMeta {
  slug: string;
  title: string;
  oneLiner: string;
}

export const foundation: FoundationMeta[] = [
  {
    slug: 'five-layer-stack',
    title: 'The five-layer stack',
    oneLiner: 'Every piece of context belongs in exactly one layer. Mixing them is the root cause of "the agent did the right thing locally and broke everything else".',
  },
  {
    slug: 'contextops-lifecycle',
    title: 'The ContextOps lifecycle',
    oneLiner: 'Build, distribute, maintain, update, measure. The DevOps-style discipline that keeps context from rotting.',
  },
  {
    slug: 'cognitive-debt',
    title: 'Cognitive debt',
    oneLiner: 'Technical debt is code you wish was cleaner. Cognitive debt is code you wish you understood. AI accelerates one and reduces the other — guess which.',
  },
  {
    slug: 'good-practices',
    title: 'Good practices',
    oneLiner: 'The moves high-performing teams have converged on. Every one of them has a command that operationalises it.',
  },
  {
    slug: 'anti-patterns',
    title: 'Anti-patterns',
    oneLiner: 'Ten things that look like good context engineering and are not. Reject every one of them — including in your own output.',
  },
  {
    slug: 'mcp-principles',
    title: 'MCP principles',
    oneLiner: 'Least-privilege binding, human-in-the-loop, centralised auditing. The non-negotiables when the agent reaches a real system.',
  },
  {
    slug: 'harness-reference',
    title: 'Harness reference',
    oneLiner: 'Where each AI coding harness expects to find its context files. Claude Code, Cursor, Codex, Copilot, Cowork — locations and formats.',
  },
];

export function getFoundation(slug: string): FoundationMeta | undefined {
  return foundation.find((f) => f.slug === slug);
}
