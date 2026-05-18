// Detects when AGENTS.md and CLAUDE.md exist as separate files with diverging content.
// AGENTS.md is the canonical cross-tool source; CLAUDE.md is recommended to be a symlink.
// When both are regular files and content diverges, the agent reads stale rules.
import type { Rule, Finding } from '../types.js';

export const agentsClaudeSync: Rule = {
  id: 'agents-claude-sync',
  description:
    'AGENTS.md and CLAUDE.md exist as separate files with diverging content. Symlink CLAUDE.md to AGENTS.md, or re-emit both from .context/conventions.md.',
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
        fix: 'Symlink CLAUDE.md to AGENTS.md (`ln -sf AGENTS.md CLAUDE.md`), or re-run `groundwork document` to regenerate both from .context/conventions.md.',
      });
    }

    return findings;
  },
};

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}
