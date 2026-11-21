// A SKILL.md carrying host-specific frontmatter works where it was written and
// fails everywhere else.
//
// The Agent Skills spec defines six portable fields. Claude Code accepts around
// twenty, and the extras are a hard error on claude.ai and the Skills API
// rather than an ignored key — so a skill with `argument-hint:` in its
// frontmatter loads locally, passes review, and breaks the moment a teammate
// uploads it. Nothing else in this ecosystem checks for it.
import type { Rule, Finding } from '../types.js';
import { findSkillFiles } from '../utils/skill.js';
import { isIgnored } from '../utils/ignores.js';

/** The fields every host accepts. Anything else is host-specific by definition. */
const PORTABLE = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

/**
 * Fields known to be Claude Code-only, named so the message can be specific.
 * A field outside both lists is still reported — the allowlist is what decides,
 * so this stays correct as hosts add fields.
 */
const KNOWN_CLAUDE_CODE_ONLY = new Set([
  'argument-hint',
  'context',
  'model',
  'effort',
  'paths',
  'disable-model-invocation',
  'user-facing-name',
  'tools',
  'disallowed-tools',
  'isolation',
  'skills',
  'hooks',
]);

export const skillFrontmatterPortability: Rule = {
  id: 'skill-frontmatter-portability',
  description:
    'SKILL.md frontmatter carries a field outside the six portable Agent Skills fields. Host-specific fields are a hard error on claude.ai and the Skills API.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];

    for (const skill of await findSkillFiles(ctx)) {
      if (!skill.frontmatter.present) continue; // skill-missing-frontmatter owns that case.

      for (const { key, line } of skill.frontmatter.keys) {
        if (PORTABLE.has(key)) continue;
        if (isIgnored(skill.raw, line)) continue;

        const known = KNOWN_CLAUDE_CODE_ONLY.has(key);
        findings.push({
          ruleId: 'skill-frontmatter-portability',
          severity: 'P1',
          file: skill.path,
          line,
          message: known
            ? `"${key}" is a Claude Code-only frontmatter field. This skill will fail to load on claude.ai and the Skills API.`
            : `"${key}" is not one of the six portable frontmatter fields (name, description, license, compatibility, metadata, allowed-tools). Hosts other than the one it was written for reject unknown fields rather than ignoring them.`,
          evidence: `${key}:`,
          fix: `Remove "${key}" from the frontmatter, or move it under "metadata:", which is portable and free-form. If the field is load-bearing for Claude Code, keep the skill Claude Code-only on purpose and say so in its description.`,
        });
      }
    }

    return findings;
  },
};
