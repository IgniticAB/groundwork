// Flags root Project-layer context files that have grown past their budget.
// The 2026 best-practice target is a lean canonical file (under ~400 tokens /
// ~80 prose lines) with stable, long-form rules moved into docs/agents/<area>.md
// (harness-agnostic overflow).
//
// Code-fenced blocks are excluded from the count: anchored examples are the
// rule itself, not bloat. We measure prose density, not raw line count.
//
// Thresholds (applied to non-code lines):
//   - 80 lines: soft warning (P2). Move detail into docs/agents/<area>.md.
//   - 200 lines: hard ceiling (P1). The file is large enough to materially
//     dilute attention and probably contains rules that should be split.
//
// When CLAUDE.md is a symlink to AGENTS.md (the default layout), readFile
// returns identical bodies for both. We dedupe by content so the finding
// fires once, not twice.
import type { Rule, Finding } from '../types.js';

const SOFT_LIMIT = 80;
const HARD_LIMIT = 200;

const TARGETS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
];

/** Count lines, excluding everything between ``` fences (the fences themselves are also excluded). */
function countProseLines(body: string): number {
  const lines = body.split('\n');
  let inFence = false;
  let count = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    count += 1;
  }
  return count;
}

export const oversizedClaudeMd: Rule = {
  id: 'oversized-claude-md',
  description:
    'A Project-layer context file is over its prose-line budget. Code examples do not count. Soft warning at 80, hard ceiling at 200.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];
    const seenBodies = new Set<string>();

    for (const path of TARGETS) {
      const body = await ctx.readFile(path);
      if (!body) continue;
      if (seenBodies.has(body)) continue;
      seenBodies.add(body);

      const lines = countProseLines(body);

      if (lines > HARD_LIMIT) {
        findings.push({
          ruleId: 'oversized-claude-md',
          severity: 'P1',
          file: path,
          message: `${path} is ${lines} prose lines (hard ceiling ${HARD_LIMIT}; code examples already excluded). Attention bloat. Move stable rules into docs/agents/<area>.md and reference them from "See also".`,
          fix: 'Adopt the split-file architecture: lean canonical AGENTS.md + docs/agents/ overflow. See foundation/good-practices.md § split-file.',
        });
      } else if (lines > SOFT_LIMIT) {
        findings.push({
          ruleId: 'oversized-claude-md',
          severity: 'P2',
          file: path,
          message: `${path} is ${lines} prose lines (soft target ${SOFT_LIMIT}, ~400 tokens; code examples already excluded). The canonical file should be a lean entry point; move stable conventions to docs/agents/<area>.md.`,
          fix: 'Consider splitting per the lean-canonical architecture. See foundation/good-practices.md § split-file.',
        });
      }
    }

    return findings;
  },
};
