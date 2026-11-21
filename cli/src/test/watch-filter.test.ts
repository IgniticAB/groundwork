import test from 'node:test';
import assert from 'node:assert/strict';
import { isInteresting } from '../watch.js';

test('watches the files whose change can invalidate a finding', () => {
  for (const p of [
    'AGENTS.md',
    'package.json',
    '.mcp.json',
    'src/index.ts',
    'skills/groundwork/SKILL.md',
    '.cursor/rules/main.mdc',
    'docs/decisions/0001-thing.md',
  ]) {
    assert.equal(isInteresting(p), true, p);
  }
});

test('ignores build output and dependencies', () => {
  for (const p of [
    'node_modules/left-pad/index.js',
    'dist/index.js',
    'src/../node_modules/x/y.ts',
    'coverage/lcov.info',
    'README.md',
  ]) {
    assert.equal(isInteresting(p), false, p);
  }
});

test('keeps parent directories walkable so nested matches are reachable', () => {
  // chokidar prunes a directory it is told to ignore, so ".github" has to stay
  // walkable or ".github/instructions/" is never reached.
  assert.equal(isInteresting('.github'), true);
  assert.equal(isInteresting('docs'), true);
});
