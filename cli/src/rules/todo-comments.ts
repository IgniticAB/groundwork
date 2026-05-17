// ce-ignore-file: this rule contains the patterns it detects.
// Counts task markers in source. Not necessarily wrong, but if there are dozens, surface as P2.
// Distinct from placeholder-comments which catches the worst implementation-stub patterns.
import type { Rule, Finding } from '../types.js';
import { isFileIgnored, isIgnored } from '../utils/ignores.js';

const SOURCE_GLOBS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.py',
  '**/*.rs',
  '**/*.go',
];

const PATTERN = /\b(TODO|FIXME|HACK|XXX)\b/;

// If more than this many, surface as a single P2 finding instead of one per location.
const NOISE_THRESHOLD = 25;

export const todoComments: Rule = {
  id: 'todo-comments',
  description: 'TODO/FIXME/HACK markers in source. Tracked for hygiene; not always wrong.',
  defaultSeverity: 'P2',
  async run(ctx) {
    const findings: Finding[] = [];
    const files = await ctx.glob(SOURCE_GLOBS);

    const hits: { file: string; line: number; text: string }[] = [];
    for (const file of files) {
      const body = await ctx.readFile(file);
      if (!body) continue;
      if (isFileIgnored(body)) continue;
      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (PATTERN.test(lines[i])) {
          if (isIgnored(body, i + 1)) continue;
          hits.push({ file, line: i + 1, text: lines[i].trim() });
        }
      }
    }

    if (hits.length === 0) return findings;

    if (hits.length > NOISE_THRESHOLD) {
      findings.push({
        ruleId: 'todo-comments',
        severity: 'P2',
        message: `${hits.length} TODO/FIXME/HACK markers across the repo. Consider triaging.`,
      });
    } else {
      for (const h of hits) {
        findings.push({
          ruleId: 'todo-comments',
          severity: 'P2',
          file: h.file,
          line: h.line,
          message: 'TODO/FIXME/HACK marker.',
          evidence: h.text,
        });
      }
    }

    return findings;
  },
};
