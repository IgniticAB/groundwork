// Detects vague SKILL.md descriptions. The host harness routes invocations by
// matching the user's intent against each skill's description; hedge phrasing
// ("various", "general purpose", "helps with") destroys routing accuracy.
//
// No length threshold: a short concrete description like "Generates Prisma
// migrations." passes. Phase 1 (audit) and Phase 2 (this rule) use the same
// hedge-word list so the two surfaces stay consistent.
import type { Rule, Finding } from '../types.js';
import { findSkillFiles } from '../utils/skill.js';

const HEDGE_PATTERNS: Array<{ regex: RegExp; label: string }> = [
  { regex: /\bvarious\b/i, label: '"various"' },
  { regex: /\bgeneral[-\s]purpose\b/i, label: '"general purpose"' },
  { regex: /\bhelps?\s+with\b/i, label: '"helps with"' },
  { regex: /\buseful\s+for\b/i, label: '"useful for"' },
  { regex: /\bgood\s+at\b/i, label: '"good at"' },
  { regex: /\b(?:write|use|maintain|keep|prefer)\s+(?:clean|robust|high[-\s]quality|appropriate|good|nice|elegant|proper|sensible)\b/i, label: 'vague verb + adjective' },
  { regex: /\bgood\s+judg(?:e?)ment\b/i, label: '"good judgment"' },
  { regex: /\bas\s+(?:needed|appropriate|applicable|required)\b/i, label: '"as needed / appropriate / applicable"' },
  { regex: /\bwhere\s+(?:appropriate|applicable|needed|sensible|possible)\b/i, label: '"where appropriate / applicable / needed"' },
  { regex: /\bfollow\s+(?:our\s+)?(?:style|conventions?|guide|best\s+practices?|standards?)\b/i, label: '"follow our style / conventions"' },
  { regex: /\bbest\s+practices?\b/i, label: '"best practices"' },
];

export const skillVagueDescription: Rule = {
  id: 'skill-vague-description',
  description:
    'A skill\'s description uses hedge phrasing ("various", "helps with", "useful for"). The host harness cannot route by intent if the description does not say what the intent is.',
  defaultSeverity: 'P2',
  async run(ctx) {
    const findings: Finding[] = [];
    const skills = await findSkillFiles(ctx);

    for (const { path, frontmatter } of skills) {
      const desc = frontmatter.description;
      if (!desc) continue; // missing-frontmatter rule owns that case.

      for (const { regex, label } of HEDGE_PATTERNS) {
        if (regex.test(desc)) {
          findings.push({
            ruleId: 'skill-vague-description',
            severity: 'P2',
            file: path,
            message: `${path}: description contains hedge phrase (${label}). Quoted: "${desc.slice(0, 160)}"`,
            evidence: desc.slice(0, 200),
            fix: 'Rewrite the description to name the specific intent: what triggers this skill, on what input, producing what output. "Helps with various tasks" → "Generates Prisma migrations from schema diffs."',
          });
          break; // one finding per skill.
        }
      }
    }

    return findings;
  },
};
