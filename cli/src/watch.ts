// Watch mode: re-run the detector as files change.
import path from 'node:path';
import chokidar from 'chokidar';
import { run } from './runner.js';
import { rules } from './rules/index.js';
import { reportHuman } from './reporter.js';

/** Directories never worth re-running for. Checked before anything else. */
const WATCH_IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', 'coverage',
  '.cache', 'target', '__pycache__', 'vendor',
]);

/** Exact files whose change can invalidate a finding. */
const WATCH_FILES = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'package.json',
  '.mcp.json',
  '.github/copilot-instructions.md',
]);

/** Directory prefixes whose contents are worth re-running for. */
const WATCH_PREFIXES = [
  '.context/',
  '.cursor/',
  '.windsurf/',
  '.claude/',
  '.github/instructions/',
  'docs/decisions/',
  'docs/agents/',
  'skills/',
  'src/',
  'app/',
  'lib/',
];

/**
 * True when a change at this repo-relative path could change the findings.
 * Chokidar walks the whole tree, so this also has to be cheap: a directory on
 * the ignore list short-circuits before any prefix matching.
 */
export function isInteresting(relativePath: string): boolean {
  if (relativePath === '') return true; // the root itself, so the walk can start
  const segments = relativePath.split(path.sep);
  if (segments.some((s) => WATCH_IGNORED_DIRS.has(s))) return false;

  const posix = segments.join('/');
  if (WATCH_FILES.has(posix)) return true;
  if (WATCH_PREFIXES.some((prefix) => posix.startsWith(prefix))) return true;

  // A directory on the way to something we care about must stay walkable.
  return WATCH_PREFIXES.some((prefix) => prefix.startsWith(posix + '/'));
}

export async function watch(opts: {
  repoRoot: string;
  only?: string[];
  skip?: string[];
  includeInstalled?: boolean;
}): Promise<void> {
  const repoRoot = path.resolve(opts.repoRoot);

  // Initial run.
  await runOnce(repoRoot, opts.only, opts.skip, opts.includeInstalled);

  // chokidar 4 dropped glob support, so the pattern set moved from globs into
  // an explicit predicate: watch the repo root, decide per path. Same intent,
  // and it is now readable without knowing how chokidar expands a glob.
  const watcher = chokidar.watch(repoRoot, {
    ignored: (absolutePath: string) => !isInteresting(path.relative(repoRoot, absolutePath)),
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  console.log('\nwatching for changes. Ctrl+C to stop.');

  let pending = false;
  let running = false;
  const trigger = async (path: string) => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    console.log(`\n[change] ${path}`);
    await runOnce(repoRoot, opts.only, opts.skip, opts.includeInstalled);
    running = false;
    if (pending) {
      pending = false;
      await trigger('(coalesced)');
    }
  };

  watcher.on('change', (p) => void trigger(p));
  watcher.on('add', (p) => void trigger(p));
  watcher.on('unlink', (p) => void trigger(p));

  // Keep alive until interrupted.
  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      console.log('\nstopping watcher.');
      watcher.close().then(() => resolve());
    });
  });
}

async function runOnce(
  repoRoot: string,
  only?: string[],
  skip?: string[],
  includeInstalled?: boolean,
): Promise<void> {
  const result = await run({ repoRoot, rules, only, skip, includeInstalled });
  reportHuman(result);
}
