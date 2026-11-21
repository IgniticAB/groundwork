// Detects a context file that names a package manager or framework the project
// does not actually use.
//
// This rule is P0, which makes a false positive expensive: it fails commits and
// CI. Two guards keep it honest.
//
//   1. It matches per line, not against the whole body, so a finding can name
//      the line and quote it. A rule that cannot say where it fired is a rule
//      nobody can act on.
//   2. It skips lines that are talking *about* the other tool rather than
//      telling the agent to use it. "Do not use React patterns here" in a Vue
//      repo is correct documentation, and firing a P0 on it trains the team to
//      ignore the detector.
import type { Rule, Finding } from '../types.js';
import { isFileIgnored, isIgnored } from '../utils/ignores.js';

const FRAMEWORKS = ['next', 'remix', 'svelte', 'sveltekit', 'astro', 'nuxt', 'vue', 'react', 'angular'];
const PKG_MGRS = ['npm', 'pnpm', 'yarn', 'bun'];

const TARGETS = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  '.cursor/rules/main.mdc',
  '.windsurf/rules/main.md',
];

/**
 * True when the line is discussing the tool rather than prescribing it:
 * a prohibition, a migration note, or a historical record. These are exactly
 * the lines good context files are supposed to contain.
 */
const DISCUSSES_RATHER_THAN_PRESCRIBES =
  /\b(not|never|avoid|instead of|rather than|migrated|migrating|moved (?:away|off)|away from|no longer|formerly|previously|used to|deprecated|until|dropped|replaced|legacy|was)\b/i;

/** Heading lines and list items describing history are context, not instruction. */
function isDiscussion(line: string): boolean {
  if (DISCUSSES_RATHER_THAN_PRESCRIBES.test(line)) return true;
  // "- 2024-08 (deprecated 2026-04) — Jest." style delta-update entries.
  if (/^\s*[-*]\s*\d{4}-\d{2}/.test(line)) return true;
  return false;
}

export const staleClaudeMd: Rule = {
  id: 'stale-claude-md',
  description: 'A context file names a package manager or framework the project does not use.',
  defaultSeverity: 'P0',
  async run(ctx) {
    const findings: Finding[] = [];
    const pkgRaw = await ctx.readFile('package.json');
    if (!pkgRaw) return findings; // Not a Node project; this rule has nothing to say.

    let pkg: {
      packageManager?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    try {
      pkg = JSON.parse(pkgRaw);
    } catch {
      return findings;
    }

    const declaredPkgMgr = (pkg.packageManager ?? '').split('@')[0].toLowerCase();
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const presentFrameworks = FRAMEWORKS.filter((f) => deps[f] || deps[`@${f}/core`]);

    const seenBodies = new Set<string>();

    for (const target of TARGETS) {
      const body = await ctx.readFile(target);
      if (!body) continue;
      if (isFileIgnored(body)) continue;
      // A CLAUDE.md mirroring AGENTS.md should not double every finding.
      if (seenBodies.has(body)) continue;
      seenBodies.add(body);

      const lines = body.split('\n');
      let reportedPkgMgr = false;
      let reportedFramework = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isDiscussion(line)) continue;
        if (isIgnored(body, i + 1)) continue;

        if (declaredPkgMgr && !reportedPkgMgr) {
          const wrong = PKG_MGRS.find(
            (mgr) => mgr !== declaredPkgMgr && new RegExp(`\\b${mgr}\\b`, 'i').test(line),
          );
          // A line naming both ("use pnpm, not npm") is a comparison, not a stale rule.
          const namesDeclared = new RegExp(`\\b${declaredPkgMgr}\\b`, 'i').test(line);
          if (wrong && !namesDeclared) {
            findings.push({
              ruleId: 'stale-claude-md',
              severity: 'P0',
              file: target,
              line: i + 1,
              message: `${target} tells the agent to use "${wrong}", but package.json declares packageManager: ${declaredPkgMgr}.`,
              evidence: line.trim(),
              fix: `Change "${wrong}" to "${declaredPkgMgr}" on this line, or run the groundwork skill's \`document\` command to refresh the file.`,
            });
            reportedPkgMgr = true;
          }
        }

        if (presentFrameworks.length > 0 && !reportedFramework) {
          const wrong = FRAMEWORKS.find(
            (fw) =>
              !presentFrameworks.includes(fw) &&
              new RegExp(`\\b${fw}(?:\\.js)?\\b`, 'i').test(line),
          );
          if (wrong) {
            const otherPresent = presentFrameworks[0];
            findings.push({
              ruleId: 'stale-claude-md',
              severity: 'P0',
              file: target,
              line: i + 1,
              message: `${target} names "${wrong}", but package.json depends on "${otherPresent}" and not on "${wrong}".`,
              evidence: line.trim(),
              fix: `Update this line to "${otherPresent}", or run the groundwork skill's \`document\` command. If the mention is deliberate (a rule about what *not* to use), rephrase it so it reads as a prohibition.`,
            });
            reportedFramework = true;
          }
        }

        if (reportedPkgMgr && reportedFramework) break;
      }
    }

    return findings;
  },
};
