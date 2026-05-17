// Detects when .context/conventions.md is newer than CLAUDE.md / AGENTS.md / Cursor rules.
// If conventions changed but per-harness files were not regenerated, the agent reads stale rules.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Rule, Finding } from '../types.js';

const HARNESS_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
];

export const conventionsDrift: Rule = {
  id: 'conventions-drift',
  description: '.context/conventions.md is newer than per-harness files (CLAUDE.md, AGENTS.md, etc).',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];
    const conventionsPath = path.join(ctx.repoRoot, '.context/conventions.md');

    let convStat;
    try {
      convStat = await fs.stat(conventionsPath);
    } catch {
      return findings; // No conventions.md to compare against.
    }

    const conventionsMtime = convStat.mtimeMs;

    for (const target of HARNESS_FILES) {
      const targetPath = path.join(ctx.repoRoot, target);
      try {
        const s = await fs.stat(targetPath);
        if (s.mtimeMs < conventionsMtime) {
          findings.push({
            ruleId: 'conventions-drift',
            severity: 'P1',
            file: target,
            message: `${target} is older than .context/conventions.md by ${formatDelta(conventionsMtime - s.mtimeMs)}.`,
            fix: 'Run: groundwork document',
          });
        }
      } catch {
        // File missing; not this rule's problem.
      }
    }

    // Also check .cursor/rules/*.mdc.
    const cursorRules = await ctx.glob('.cursor/rules/*.mdc');
    for (const f of cursorRules) {
      try {
        const s = await fs.stat(path.join(ctx.repoRoot, f));
        if (s.mtimeMs < conventionsMtime) {
          findings.push({
            ruleId: 'conventions-drift',
            severity: 'P1',
            file: f,
            message: `${f} is older than .context/conventions.md by ${formatDelta(conventionsMtime - s.mtimeMs)}.`,
            fix: 'Run: groundwork document',
          });
        }
      } catch {
        // Skip.
      }
    }

    return findings;
  },
};

function formatDelta(ms: number): string {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days}d`;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(ms / (1000 * 60));
  return `${mins}m`;
}
