// Flags root Project-layer context files that have grown past their budget.
// The 2026 best-practice target is a lean canonical file (under ~400 tokens /
// ~80 lines) with stable, long-form rules moved into .claude/rules/. We
// enforce two thresholds:
//   - 80 lines: soft warning (P2). Move detail into .claude/rules/<NN>-<name>.md.
//   - 200 lines: hard ceiling (P1). The file is large enough to materially
//     dilute attention and probably contains rules that should be split.
import type { Rule, Finding } from '../types.js';

const SOFT_LIMIT = 80; // lean-root spirit (~400 tokens)
const HARD_LIMIT = 200; // attention-bloat ceiling

const TARGETS = [
  'CLAUDE.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
];

export const oversizedClaudeMd: Rule = {
  id: 'oversized-claude-md',
  description:
    'A Project-layer context file is over its line budget. Soft warning at 80 lines (lean-root spirit, ~400 tokens), hard ceiling at 200 lines.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    for (const path of TARGETS) {
      const body = await ctx.readFile(path);
      if (!body) continue;
      const lines = body.split('\n').length;

      if (lines > HARD_LIMIT) {
        findings.push({
          ruleId: 'oversized-claude-md',
          severity: 'P1',
          file: path,
          message: `${path} is ${lines} lines (hard ceiling ${HARD_LIMIT}). Attention bloat. Move stable rules into .claude/rules/<NN>-<name>.md.`,
          fix: 'Adopt the split-file architecture: lean canonical AGENTS.md + .claude/rules/ overflow. See foundation/good-practices.md § split-file.',
        });
      } else if (lines > SOFT_LIMIT) {
        findings.push({
          ruleId: 'oversized-claude-md',
          severity: 'P2',
          file: path,
          message: `${path} is ${lines} lines (soft target ${SOFT_LIMIT}, ~400 tokens). The canonical file should be a lean entry point; move stable conventions to .claude/rules/<NN>-<name>.md.`,
          fix: 'Consider splitting per the lean-canonical architecture. See foundation/good-practices.md § split-file.',
        });
      }
    }

    return findings;
  },
};
