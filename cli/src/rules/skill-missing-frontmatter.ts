// Detects skill packages whose SKILL.md is missing or has malformed YAML
// frontmatter. The host harness reads `name` and `description` to route
// invocations; without either, the skill will not load correctly. P0 because
// the agent cannot act on a skill it cannot route.
import type { Rule, Finding } from '../types.js';
import { findSkillFiles } from '../utils/skill.js';

export const skillMissingFrontmatter: Rule = {
  id: 'skill-missing-frontmatter',
  description:
    'A SKILL.md is missing YAML frontmatter, or `name` / `description` is missing or empty. The host harness cannot route invocations.',
  defaultSeverity: 'P0',
  async run(ctx) {
    const findings: Finding[] = [];
    const skills = await findSkillFiles(ctx);

    for (const skill of skills) {
      const { frontmatter, path } = skill;
      if (!frontmatter.present) {
        findings.push({
          ruleId: 'skill-missing-frontmatter',
          severity: 'P0',
          file: path,
          message: `${path}: SKILL.md is missing YAML frontmatter (the opening \`---\` block with \`name\` and \`description\`).`,
          fix: 'Add a frontmatter block at the top of SKILL.md with at minimum `name:` and `description:` fields.',
        });
        continue;
      }
      const issues: string[] = [];
      if (!frontmatter.name) issues.push('`name`');
      if (!frontmatter.description) issues.push('`description`');
      if (issues.length > 0) {
        findings.push({
          ruleId: 'skill-missing-frontmatter',
          severity: 'P0',
          file: path,
          message: `${path}: SKILL.md frontmatter is missing or empty: ${issues.join(' and ')}.`,
          fix: `Set ${issues.join(' and ')} in the frontmatter block. Without these the host cannot route invocations to this skill.`,
        });
      }
    }

    return findings;
  },
};
