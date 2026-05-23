// Shared helpers for the skill-* CLI rules. Discovers SKILL.md files across
// the standard harness install paths, parses the YAML frontmatter (just enough
// to extract `name` and `description`; no full YAML dep needed), and exposes
// the body separately so per-rule scans operate on prose only.
import type { RuleContext } from '../types.js';

export const SKILL_GLOBS = [
  '.claude/skills/*/SKILL.md',
  '.cursor/skills/*/SKILL.md',
  '.agents/skills/*/SKILL.md',
];

export interface SkillFile {
  /** Repo-relative path to SKILL.md. */
  path: string;
  /** Raw file content. */
  raw: string;
  /** Parsed frontmatter (only `name` and `description` are extracted). */
  frontmatter: {
    /** True if the file opens with `---` and a closing `---` line. */
    present: boolean;
    name: string | null;
    description: string | null;
  };
  /** Body content after the frontmatter, with leading blank lines trimmed. */
  body: string;
}

/** Glob and read every SKILL.md under the standard harness skill paths. */
export async function findSkillFiles(ctx: RuleContext): Promise<SkillFile[]> {
  const paths = await ctx.glob(SKILL_GLOBS);
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
      frontmatter: { present: false, name: null, description: null },
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
      frontmatter: { present: false, name: null, description: null },
      body: raw,
    };
  }

  const fmLines = lines.slice(1, closeIdx);
  const name = extractField(fmLines, 'name');
  const description = extractField(fmLines, 'description');
  const body = lines.slice(closeIdx + 1).join('\n').replace(/^\n+/, '');

  return {
    frontmatter: { present: true, name, description },
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
