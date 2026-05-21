// Detects the same rule appearing in two H2 sections of AGENTS.md / CLAUDE.md.
// The common failure (seen in the wild): "plan mode required for >N files" appears
// in both Non-negotiables and Boundaries → Ask first; "run fast verification" appears
// in both Non-negotiables and Boundaries → Always. The agent reads the union, so
// duplication burns attention and creates near-miss paraphrases that drift apart.
//
// Strict scope per section:
//   - Non-negotiables: universal procedural rules, stated abstractly.
//   - Boundaries → Always: path/area-scoped automatic actions.
//   - Boundaries → Ask first: owns the trigger list (>N files, public APIs, migrations).
//   - Boundaries → Never: forbidden paths or destructive actions.
import type { Rule, Finding } from '../types.js';

const TARGETS = ['AGENTS.md', 'CLAUDE.md'];

// Patterns that should appear in exactly one section if present at all.
// Each entry: a regex, a human label, and the section that owns it.
const PATTERNS: Array<{ regex: RegExp; label: string; ownedBy: string }> = [
  {
    regex: /(?:>\s*\d+\s*files?|more than \d+ files?|>\d+\s*source files?)/i,
    label: '">N files" plan-mode trigger',
    ownedBy: 'Boundaries → Ask first',
  },
  {
    regex: /\bpublic\s+API(?:s|\b)/i,
    label: '"public API" plan-mode trigger',
    ownedBy: 'Boundaries → Ask first',
  },
  {
    regex: /\bmigrations?\b/i,
    label: '"migrations" plan-mode trigger',
    ownedBy: 'Boundaries → Ask first',
  },
  {
    regex: /\brefactors?\b/i,
    label: '"refactor" plan-mode trigger',
    ownedBy: 'Boundaries → Ask first',
  },
  {
    regex: /\bfast\s+verification\b/i,
    label: '"run fast verification" rule',
    ownedBy: 'Non-negotiables',
  },
];

interface Section {
  heading: string;
  body: string;
  startLine: number;
}

function parseSections(body: string): Section[] {
  const lines = body.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      current = { heading: m[1].trim(), body: '', startLine: i + 1 };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

function isNonNegotiables(heading: string): boolean {
  return /^non[-\s]?negotiables?$/i.test(heading);
}

function isBoundaries(heading: string): boolean {
  return /^boundaries$/i.test(heading);
}

export const agentsMdDuplication: Rule = {
  id: 'agents-md-duplication',
  description:
    'Same rule restated under two H2 sections in AGENTS.md / CLAUDE.md. Plan-mode triggers, verification rules, and path-scopes each belong in exactly one section.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    for (const target of TARGETS) {
      const body = await ctx.readFile(target);
      if (!body) continue;

      const sections = parseSections(body);
      const nonNegotiables = sections.find((s) => isNonNegotiables(s.heading));
      const boundaries = sections.find((s) => isBoundaries(s.heading));

      if (!nonNegotiables || !boundaries) continue;

      for (const { regex, label, ownedBy } of PATTERNS) {
        const inNonNegotiables = regex.test(nonNegotiables.body);
        const inBoundaries = regex.test(boundaries.body);

        if (inNonNegotiables && inBoundaries) {
          const offendingSection =
            ownedBy === 'Non-negotiables' ? 'Boundaries' : 'Non-negotiables';
          findings.push({
            ruleId: 'agents-md-duplication',
            severity: 'P1',
            file: target,
            line:
              offendingSection === 'Non-negotiables'
                ? nonNegotiables.startLine
                : boundaries.startLine,
            message: `${target}: ${label} appears in both Non-negotiables and Boundaries. Belongs in ${ownedBy} only.`,
            fix: `Delete the ${label} from the ${offendingSection} section. Keep it only in ${ownedBy}.`,
          });
        }
      }
    }

    return findings;
  },
};
