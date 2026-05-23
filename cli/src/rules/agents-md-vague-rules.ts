// Detects vague Style rules in AGENTS.md / CLAUDE.md. A Style rule that says
// "write clean code" or "use good judgment" gives the agent nothing to act on;
// it is decorative, not enforceable. Anti-pattern #2 (foundation/anti-patterns.md)
// says every rule must be behaviourally anchored: a verb plus a specific
// technology, command, or pattern.
//
// Scope: only the Style H2 section is scanned. Other sections (Non-negotiables,
// Boundaries) use abstract phrasing on purpose. Code blocks inside Style are
// skipped so "// Avoid: write clean code" examples are not flagged.
import type { Rule, Finding } from '../types.js';

const TARGETS = ['AGENTS.md', 'CLAUDE.md'];

const VAGUE_PATTERNS: Array<{ regex: RegExp; hint: string }> = [
  {
    regex: /\b(?:write|use|maintain|keep|prefer)\s+(?:clean|robust|high[-\s]quality|appropriate|good|nice|elegant|proper|sensible)\b/i,
    hint: 'Name the technology, command, or pattern. "Write robust error handling" → "Wrap external calls in try/catch; log via Logger; never swallow."',
  },
  {
    regex: /\bgood\s+judg(?:e?)ment\b/i,
    hint: '"Good judgment" is not a rule. Name the explicit condition that triggers the behaviour.',
  },
  {
    regex: /\bas\s+(?:needed|appropriate|applicable|required)\b/i,
    hint: 'Conditional language without a named trigger. State the condition explicitly.',
  },
  {
    regex: /\bwhere\s+(?:appropriate|applicable|needed|sensible|possible)\b/i,
    hint: 'Conditional language without a named trigger. State the condition explicitly.',
  },
  {
    regex: /\bfollow\s+(?:our\s+)?(?:style|conventions?|guide|best\s+practices?|standards?)\b/i,
    hint: 'Inline the convention or link to the file that defines it. "Follow our style guide" is a vibe.',
  },
  {
    regex: /\bbest\s+practices?\b/i,
    hint: 'Whose best practices? Name the specific practice the team enforces.',
  },
  {
    regex: /\b(?:high|low|good|reasonable)\s+(?:\w+\s+){0,2}(?:quality|coverage|standards?|maintainability)\b/i,
    hint: 'Quantify or name. "High test coverage" → "Vitest; assert on user actions; run pnpm test:coverage before staging."',
  },
  {
    regex: /\b(?:maintain|ensure|achieve)\s+(?:\w+\s+){0,3}(?:coverage|quality|standards?)\b/i,
    hint: 'Anchor the metric. "Maintain high coverage" → name the tool, threshold, and verification command.',
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

function isStyle(heading: string): boolean {
  return /^style$/i.test(heading);
}

function scanStyleSection(section: Section, target: string): Finding[] {
  const findings: Finding[] = [];
  const lines = section.body.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // Skip blank lines and HTML comments.
    if (!/[A-Za-z]/.test(line)) continue;
    if (/^\s*<!--/.test(line)) continue;

    for (const { regex, hint } of VAGUE_PATTERNS) {
      if (regex.test(line)) {
        const quoted = line.trim().replace(/^[-*]\s+/, '').replace(/^#+\s+/, '');
        findings.push({
          ruleId: 'agents-md-vague-rules',
          severity: 'P1',
          file: target,
          line: section.startLine + i + 1,
          message: `Vague Style rule in ${target}: "${quoted.slice(0, 120)}"`,
          evidence: quoted.slice(0, 200),
          fix: hint,
        });
        break;
      }
    }
  }
  return findings;
}

export const agentsMdVagueRules: Rule = {
  id: 'agents-md-vague-rules',
  description:
    'A Style rule in AGENTS.md / CLAUDE.md uses vague phrasing ("write clean code", "use good judgment", "follow best practices"). Rules must be behaviourally anchored: verb + named technology, command, or pattern.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    for (const target of TARGETS) {
      const body = await ctx.readFile(target);
      if (!body) continue;
      const sections = parseSections(body);
      const styleSection = sections.find((s) => isStyle(s.heading));
      if (!styleSection) continue;
      findings.push(...scanStyleSection(styleSection, target));
    }

    return findings;
  },
};
