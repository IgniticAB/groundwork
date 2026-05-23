// Detects relative-path links in SKILL.md that do not resolve to a real file.
// A reference to `commands/init.md` or `./foundation/X.md` that points at
// nothing means the agent reads nothing where it expects content. External
// links (http, https, mailto) and pure anchors (#section) are skipped.
import type { Rule, Finding } from '../types.js';
import { findSkillFiles } from '../utils/skill.js';

// Matches markdown link syntax [text](target) and capture the target.
const LINK_RE = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function isExternal(target: string): boolean {
  return /^(?:https?:|mailto:|tel:|#)/i.test(target);
}

function isRelative(target: string): boolean {
  if (isExternal(target)) return false;
  if (target.startsWith('/')) return false; // absolute repo path: out of scope for the skill's local resolution check
  return true;
}

/** Strip the trailing `#anchor` from a link target, if any. */
function stripAnchor(target: string): string {
  const i = target.indexOf('#');
  return i === -1 ? target : target.slice(0, i);
}

/** Join skill SKILL.md's directory with a relative target. */
function resolveSkillRelative(skillPath: string, target: string): string {
  // skillPath is e.g. ".claude/skills/foo/SKILL.md"; dir = ".claude/skills/foo".
  const lastSlash = skillPath.lastIndexOf('/');
  const dir = lastSlash === -1 ? '' : skillPath.slice(0, lastSlash);
  // Normalise "./X" and "../X" segments lightly.
  const segments = `${dir}/${target}`.split('/');
  const out: string[] = [];
  for (const seg of segments) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

export const skillBrokenLink: Rule = {
  id: 'skill-broken-link',
  description:
    'A relative-path link in SKILL.md does not resolve to a real file. The agent reads nothing where it expects content.',
  defaultSeverity: 'P1',
  async run(ctx) {
    const findings: Finding[] = [];
    const skills = await findSkillFiles(ctx);

    for (const { path, body } of skills) {
      const seen = new Set<string>();
      let match: RegExpExecArray | null;
      LINK_RE.lastIndex = 0;
      while ((match = LINK_RE.exec(body)) !== null) {
        const target = match[1];
        if (!isRelative(target)) continue;
        const normalised = stripAnchor(target);
        if (!normalised) continue;
        if (seen.has(normalised)) continue;
        seen.add(normalised);

        const isDirRef = normalised.endsWith('/');
        const resolved = resolveSkillRelative(path, normalised);

        let exists: boolean;
        if (isDirRef) {
          const children = await ctx.glob([`${resolved}/**/*`]);
          exists = children.length > 0;
        } else {
          exists = (await ctx.readFile(resolved)) !== null;
        }

        if (!exists) {
          findings.push({
            ruleId: 'skill-broken-link',
            severity: 'P1',
            file: path,
            message: `${path}: relative link \`${target}\` does not resolve. Expected at \`${resolved}${isDirRef ? '/' : ''}\`.`,
            evidence: target,
            fix: isDirRef
              ? `Create the missing directory \`${resolved}/\` (and at least one file inside it), or update the link in SKILL.md.`
              : `Create the missing file at \`${resolved}\`, or update the link in SKILL.md to point at the correct path.`,
          });
        }
      }
    }

    return findings;
  },
};
