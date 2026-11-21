// Shared helpers for the skill-* CLI rules. Discovers SKILL.md files across
// the standard harness install paths, parses the YAML frontmatter (just enough
// to extract `name` and `description`; no full YAML dep needed), and exposes
// the body separately so per-rule scans operate on prose only.
import type { RuleContext } from '../types.js';

/**
 * Skills this repo authors and ships. A finding here names a file the developer
 * owns and can fix, so these are always scanned. The detector used to miss them
 * entirely, which is why it reported clean on its own repository.
 */
export const AUTHORED_SKILL_GLOBS = [
  'skills/*/SKILL.md',
  'skills/*/*/SKILL.md',
  '.claude-plugin/skills/*/SKILL.md',
  'plugins/*/skills/*/SKILL.md',
];

/**
 * Harness install paths. `npx skills add` and the equivalents put *other
 * people's* skills here, and plenty of teams commit them. Telling a developer
 * their vendored copy of someone else's skill is oversized is noise they cannot
 * act on, so these are skipped unless --include-installed is passed.
 */
export const INSTALLED_SKILL_GLOBS = [
  '.claude/skills/*/SKILL.md',
  '.cursor/skills/*/SKILL.md',
  '.agents/skills/*/SKILL.md',
  '.windsurf/skills/*/SKILL.md',
];

export const SKILL_GLOBS = [...AUTHORED_SKILL_GLOBS, ...INSTALLED_SKILL_GLOBS];

export interface SkillFile {
  /** Repo-relative path to SKILL.md. */
  path: string;
  /** Raw file content. */
  raw: string;
  /** Parsed frontmatter. Values are extracted for `name` and `description` only. */
  frontmatter: {
    /** True if the file opens with `---` and a closing `---` line. */
    present: boolean;
    name: string | null;
    description: string | null;
    /** Every top-level key, in file order, with the 1-indexed line it sits on. */
    keys: { key: string; line: number }[];
  };
  /** Body content after the frontmatter, with leading blank lines trimmed. */
  body: string;
}

/**
 * Every SKILL.md worth reporting on: the ones this repo authors, plus — when
 * --include-installed is passed — the ones installed under a harness path.
 */
export async function findSkillFiles(ctx: RuleContext): Promise<SkillFile[]> {
  const globs = ctx.includeInstalled ? SKILL_GLOBS : AUTHORED_SKILL_GLOBS;
  const paths = await ctx.glob(globs);
  const out: SkillFile[] = [];
  for (const p of paths) {
    const raw = await ctx.readFile(p);
    if (raw === null) continue;
    out.push({ path: p, raw, ...splitFrontmatter(raw) });
  }
  return out;
}

interface SplitResult {
  frontmatter: SkillFile['frontmatter'];
  body: string;
}

/** Parse the leading `---` block. Returns name + description; body is everything after the closing fence. */
function splitFrontmatter(raw: string): SplitResult {
  const lines = raw.split('\n');
  if (lines[0]?.trim() !== '---') {
    return {
      frontmatter: { present: false, name: null, description: null, keys: [] },
      body: raw,
    };
  }
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) {
    return {
      frontmatter: { present: false, name: null, description: null, keys: [] },
      body: raw,
    };
  }

  const fmLines = lines.slice(1, closeIdx);
  const name = extractField(fmLines, 'name');
  const description = extractField(fmLines, 'description');
  const keys = extractTopLevelKeys(fmLines);
  const body = lines.slice(closeIdx + 1).join('\n').replace(/^\n+/, '');

  return {
    frontmatter: { present: true, name, description, keys },
    body,
  };
}

/**
 * Extract a YAML scalar value by key. Supports single-line strings (quoted or unquoted)
 * and folded multi-line values (`>` or `|` block scalars). Returns the trimmed string or null.
 */
function extractField(fmLines: string[], key: string): string | null {
  const headerRe = new RegExp(`^${key}\\s*:\\s*(.*)$`);
  for (let i = 0; i < fmLines.length; i++) {
    const m = headerRe.exec(fmLines[i]);
    if (!m) continue;
    const inline = m[1].trim();
    if (inline === '' || inline === '>' || inline === '|') {
      // Block scalar: collect indented continuation lines until next top-level key.
      const collected: string[] = [];
      for (let j = i + 1; j < fmLines.length; j++) {
        const line = fmLines[j];
        if (/^\S/.test(line) && line.includes(':')) break;
        collected.push(line.trim());
      }
      const joined = collected.filter(Boolean).join(' ').trim();
      return joined || null;
    }
    return stripQuotes(inline);
  }
  return null;
}

/**
 * Top-level keys only: a line that starts in column zero and carries a colon.
 * Nested keys under `metadata:` are indented and are deliberately not returned,
 * because the host validates the top level.
 */
function extractTopLevelKeys(fmLines: string[]): { key: string; line: number }[] {
  const out: { key: string; line: number }[] = [];
  for (let i = 0; i < fmLines.length; i++) {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:/.exec(fmLines[i]);
    // +2: one for the opening `---`, one to make the index 1-based.
    if (m) out.push({ key: m[1], line: i + 2 });
  }
  return out;
}

function stripQuotes(s: string): string {
  const trimmed = s.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Count prose lines in a SKILL.md body: blank-line-tolerant, excludes fenced code blocks. */
export function countProseLines(body: string): number {
  const lines = body.split('\n');
  let inFence = false;
  let count = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    count += 1;
  }
  return count;
}
