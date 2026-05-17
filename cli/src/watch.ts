// Watch mode: re-run the detector as files change.
import path from 'node:path';
import chokidar from 'chokidar';
import { run } from './runner.js';
import { rules } from './rules/index.js';
import { reportHuman } from './reporter.js';

export async function watch(opts: { repoRoot: string; only?: string[]; skip?: string[] }): Promise<void> {
  const repoRoot = path.resolve(opts.repoRoot);

  // Initial run.
  await runOnce(repoRoot, opts.only, opts.skip);

  // Files that, when changed, are most likely to invalidate findings.
  // Conservative pattern set: source, context files, configs.
  const watchPatterns = [
    'CLAUDE.md',
    'AGENTS.md',
    'package.json',
    '.context/**/*',
    'docs/decisions/**/*',
    '.cursor/rules/**/*',
    '.github/copilot-instructions.md',
    '.github/instructions/**/*',
    'src/**/*',
    'app/**/*',
    'lib/**/*',
  ];

  const watcher = chokidar.watch(watchPatterns, {
    cwd: repoRoot,
    ignored: [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /coverage/,
    ],
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
    await runOnce(repoRoot, opts.only, opts.skip);
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

async function runOnce(repoRoot: string, only?: string[], skip?: string[]): Promise<void> {
  const result = await run({ repoRoot, rules, only, skip });
  reportHuman(result);
}
