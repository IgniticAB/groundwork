// Repo helpers: file IO, glob, git presence.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import fg from 'fast-glob';
import type { RuleContext } from '../types.js';

const DEFAULT_IGNORES = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/.cache/**',
  '**/target/**',
  '**/__pycache__/**',
  '**/vendor/**',
];

export async function buildContext(repoRoot: string): Promise<RuleContext> {
  const absRoot = path.resolve(repoRoot);

  const hasGit = await fs
    .access(path.join(absRoot, '.git'))
    .then(() => true)
    .catch(() => false);

  const readFile: RuleContext['readFile'] = async (relativePath) => {
    try {
      return await fs.readFile(path.join(absRoot, relativePath), 'utf8');
    } catch {
      return null;
    }
  };

  const glob: RuleContext['glob'] = async (patterns, options) => {
    const ignore = [...DEFAULT_IGNORES, ...(options?.ignore ?? [])];
    return fg(patterns, {
      cwd: absRoot,
      ignore,
      dot: false,
      followSymbolicLinks: false,
      onlyFiles: true,
    });
  };

  return { repoRoot: absRoot, readFile, glob, hasGit };
}

/** Run a git command in the repo. Returns stdout, or null on failure. */
export function git(repoRoot: string, args: string[]): string | null {
  try {
    return execSync(`git ${args.map(shellEscape).join(' ')}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function shellEscape(s: string): string {
  if (/^[A-Za-z0-9_\-./=:@]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
