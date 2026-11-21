// Detects when AGENTS.md or CLAUDE.md states a decision but does not link an ADR.
// Heuristic: phrases like "we chose", "we use X (not Y)", "decided to" should be
// cross-linked to docs/decisions/.
//
// A line that points *at* the decision log is not a decision missing its link —
// it is the link. Both the window check and the per-line check below allow a
// bare `docs/decisions/` reference, not just a numbered ADR.
import type { Rule, Finding } from '../types.js';

const DECISION_PHRASES = [
  /\bwe (?:chose|use|picked|switched to|migrated to|decided to)\b/i,
  /\binstead of\b/i,
  /\brejected\b/i,
  /\bnon-?obvious\b/i,
];

/**
 * A satisfied cross-link: a numbered ADR, or a pointer to the decision log
 * itself. The second form matters because a "See also" line naming
 * `docs/decisions/` is doing exactly the job this rule asks for.
 */
const CROSS_LINK = /ADR-?\d{4}|docs\/decisions\b/i;

export const missingAdrXref: Rule = {
  id: 'missing-adr-xref',
  description: 'Context file mentions a decision but does not link to an ADR.',
  defaultSeverity: 'P2',
  async run(ctx) {
    const findings: Finding[] = [];
    const targets = ['AGENTS.md', 'CLAUDE.md'];

    for (const target of targets) {
      const body = await ctx.readFile(target);
      if (!body) continue;

      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (DECISION_PHRASES.some((re) => re.test(line))) {
          // Check the surrounding 3 lines for an ADR reference.
          const window = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n');
          if (!CROSS_LINK.test(window)) {
            findings.push({
              ruleId: 'missing-adr-xref',
              severity: 'P2',
              file: target,
              line: i + 1,
              message: `Decision-like statement with no ADR cross-link nearby.`,
              evidence: line.trim(),
              fix: 'Add: see docs/decisions/NNNN-<slug>.md',
            });
            // Only flag the first occurrence per file to avoid noise.
            break;
          }
        }
      }
    }

    return findings;
  },
};
