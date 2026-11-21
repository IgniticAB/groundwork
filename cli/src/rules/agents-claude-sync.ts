// Detects when AGENTS.md and CLAUDE.md both carry full, diverging rule sets.
//
// AGENTS.md is the canonical file and every harness this skill targets reads
// it. CLAUDE.md only needs to exist when Claude Code would otherwise prefer it
// — and then it should be a one-line `@AGENTS.md` import, not a second copy.
// Three shapes reach this rule:
//
//   1. CLAUDE.md is a symlink to AGENTS.md. readFile follows it, the bodies
//      match, nothing fires.
//   2. CLAUDE.md is an `@AGENTS.md` import. The recommended shape; nothing
//      fires. Detecting this is what keeps the rule from punishing the
//      practice it is meant to encourage.
//   3. CLAUDE.md is a full second copy that has drifted. The agent reads
//      different rules depending on which file it opened. This fires.
import type { Rule, Finding } from '../types.js';

/**
 * True when the body is a pointer to AGENTS.md rather than a rule set of its
 * own: it carries an `@AGENTS.md` import and no content beyond a heading and
 * comments. Deliberately strict — a file with real rules *plus* an import is
 * still a second copy, and still drifts.
 */
function isAgentsPointer(body: string): boolean {
  const withoutComments = body.replace(/<!--[\s\S]*?-->/g, '');
  const lines = withoutComments
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (!lines.some((l) => /^@AGENTS\.md$/i.test(l))) return false;

  return lines.every((l) => /^@AGENTS\.md$/i.test(l) || l.startsWith('#'));
}

export const agentsClaudeSync: Rule = {
  id: 'agents-claude-sync',
  description:
    'AGENTS.md and CLAUDE.md both carry full, diverging rule sets. Reduce CLAUDE.md to a single `@AGENTS.md` import.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    const agents = await ctx.readFile('AGENTS.md');
    const claude = await ctx.readFile('CLAUDE.md');

    if (agents === null || claude === null) {
      return findings;
    }

    if (isAgentsPointer(claude)) {
      return findings;
    }

    if (normalize(agents) !== normalize(claude)) {
      findings.push({
        ruleId: 'agents-claude-sync',
        severity: 'P1',
        file: 'CLAUDE.md',
        message:
          'AGENTS.md and CLAUDE.md are separate files with diverging content. Claude Code reads CLAUDE.md and skips AGENTS.md when both exist, so the two halves of your team are working from different rules.',
        fix: 'Replace the body of CLAUDE.md with a single line: `@AGENTS.md`. Claude Code resolves the import, and there is only one file left to keep current.',
      });
    }

    return findings;
  },
};

function normalize(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\s+$/g, '');
}
