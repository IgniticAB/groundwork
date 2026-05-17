// ce-ignore-file: this rule contains the patterns it detects.
// Detects placeholder comments left in committed source files such as task markers and fill-this-in tags.
// Per anti-pattern #3: every function is fully implemented or not in the file.
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
  '**/*.java',
  '**/*.kt',
  '**/*.rb',
  '**/*.swift',
];

const PATTERNS: { pattern: RegExp; severity: 'P0' | 'P1' | 'P2' }[] = [
  { pattern: /\b(TODO|FIXME)\s*:\s*implement\b/i, severity: 'P0' },
  { pattern: /\[\s*fill\s+(this|in)\s*\]/i, severity: 'P0' },
  { pattern: /\bcome\s+back\s+(later|to\s+this)\b/i, severity: 'P1' },
  { pattern: /\bnot\s+implemented\b/i, severity: 'P1' },
];

export const placeholderComments: Rule = {
  id: 'placeholder-comments',
  description: 'Source files contain placeholder comments (TODO: implement, [fill this in], not implemented).',
  defaultSeverity: 'P0',
  async run(ctx) {
    const findings: Finding[] = [];
    const files = await ctx.glob(SOURCE_GLOBS);

    for (const file of files) {
      const body = await ctx.readFile(file);
      if (!body) continue;
      if (isFileIgnored(body)) continue;
      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const { pattern, severity } of PATTERNS) {
          if (pattern.test(line)) {
            if (isIgnored(body, i + 1)) break;
            findings.push({
              ruleId: 'placeholder-comments',
              severity,
              file,
              line: i + 1,
              message: 'Placeholder comment in committed source.',
              evidence: line.trim(),
              fix: 'Implement the function or remove the placeholder.',
            });
            break;
          }
        }
      }
    }

    return findings;
  },
};
