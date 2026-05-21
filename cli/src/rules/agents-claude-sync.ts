// Detects when AGENTS.md and CLAUDE.md exist as separate files with diverging
// content. AGENTS.md is the canonical source; CLAUDE.md is recommended to be a
// symlink. When CLAUDE.md is a symlink to AGENTS.md, readFile follows the
// symlink and the two contents match, so this rule does not fire. When both
// are regular files and content diverges, the agent reads stale rules.
import type { Rule, Finding } from '../types.js';

export const agentsClaudeSync: Rule = {
  id: 'agents-claude-sync',
  description:
    'AGENTS.md and CLAUDE.md exist as separate files with diverging content. Symlink CLAUDE.md to AGENTS.md, or hand-mirror it.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    const agents = await ctx.readFile('AGENTS.md');
    const claude = await ctx.readFile('CLAUDE.md');

    if (agents === null || claude === null) {
      return findings;
    }

    if (normalize(agents) !== normalize(claude)) {
      findings.push({
        ruleId: 'agents-claude-sync',
        severity: 'P1',
        file: 'CLAUDE.md',
        message:
          'AGENTS.md and CLAUDE.md exist as separate files with diverging content. Agents reading one will see different rules from agents reading the other.',
        fix: 'Symlink CLAUDE.md to AGENTS.md (`rm CLAUDE.md && ln -sf AGENTS.md CLAUDE.md`), or hand-mirror AGENTS.md into CLAUDE.md.',
      });
    }

    return findings;
  },
};

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}
