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

export interface ContextOptions {
  /**
   * Scan files the repo did not author: skills installed under a harness path,
   * vendored copies, anything .gitignore excludes. Off by default — a finding
   * about a file the developer did not write and cannot fix is noise, and
   * noise is how a detector stops being read.
   */
  includeInstalled?: boolean;
}

export async function buildContext(
  repoRoot: string,
  opts: ContextOptions = {},
): Promise<RuleContext> {
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

  // Resolved lazily and once: the set of paths git does not track. Without git,
  // or when the user opts in, this stays empty and nothing is filtered.
  let untracked: Set<string> | null = null;
  const loadUntracked = (): Set<string> => {
    if (untracked) return untracked;
    untracked = new Set<string>();
    if (!hasGit || opts.includeInstalled) return untracked;
    // --others: files git does not track. --ignored with --exclude-standard:
    // also the ones .gitignore excludes. Together these are "not the repo's".
    const listed = git(absRoot, [
      'ls-files',
      '--others',
      '--ignored',
      '--exclude-standard',
    ]);
    const plain = git(absRoot, ['ls-files', '--others', '--exclude-standard']);
    for (const chunk of [listed, plain]) {
      if (!chunk) continue;
      for (const line of chunk.split('\n')) {
        const p = line.trim();
        if (p) untracked.add(p);
      }
    }
    return untracked;
  };

  const glob: RuleContext['glob'] = async (patterns, options) => {
    const ignore = [...DEFAULT_IGNORES, ...(options?.ignore ?? [])];
    const found = await fg(patterns, {
      cwd: absRoot,
      ignore,
      dot: false,
      followSymbolicLinks: false,
      onlyFiles: true,
    });
    if (opts.includeInstalled || !hasGit) return found;
    const skip = loadUntracked();
    if (skip.size === 0) return found;
    return found.filter((p) => !skip.has(p));
  };

  return {
    repoRoot: absRoot,
    readFile,
    glob,
    hasGit,
    includeInstalled: opts.includeInstalled === true,
  };
}

/** Run a git command in the repo. Returns stdout, or null on failure. */
export function git(repoRoot: string, args: string[]): string | null {
  try {
    return execSync(`git ${args.map(shellEscape).join(' ')}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
}

function shellEscape(s: string): string {
  if (/^[A-Za-z0-9_\-./=:@]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
