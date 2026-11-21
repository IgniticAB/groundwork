// Smoke tests for the rule registry and the runner.
//
// These are deliberately structural: they catch the failure modes that have
// actually bitten this repo (a rule registered twice, a rule that crashes on a
// clean tree, a registry that drifts from the rule files on disk). Per-rule
// fixtures with should-fire / should-not-fire cases live alongside each rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rules } from '../rules/index.js';
import { run } from '../runner.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

test('every rule has a unique id', () => {
  const ids = rules.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, `duplicate rule id in: ${ids.join(', ')}`);
});

test('every rule declares a description and a valid severity', () => {
  for (const rule of rules) {
    assert.ok(rule.description.length > 0, `${rule.id} has no description`);
    assert.ok(['P0', 'P1', 'P2'].includes(rule.defaultSeverity), `${rule.id} has a bad severity`);
  }
});

test('the registry matches the rule files on disk', async () => {
  const dir = path.resolve(here, '../rules');
  const onDisk = (await readdir(dir))
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .map((f) => f.replace(/\.js$/, ''))
    .sort();
  const registered = rules.map((r) => r.id).sort();
  assert.deepEqual(registered, onDisk, 'a rule file exists that index.ts does not register, or vice versa');
});

test('no rule crashes when run against this repo', async () => {
  const result = await run({ repoRoot, rules });
  const crashes = result.findings.filter((f) => f.message.includes('crashed:'));
  assert.deepEqual(crashes, [], 'a rule threw while scanning the repo');
  assert.equal(result.rulesRun.length, rules.length);
});

test('--only and --skip filter the rule set', async () => {
  const only = await run({ repoRoot, rules, only: ['todo-comments'] });
  assert.deepEqual(only.rulesRun, ['todo-comments']);

  const skip = await run({ repoRoot, rules, skip: ['todo-comments'] });
  assert.ok(!skip.rulesRun.includes('todo-comments'));
  assert.equal(skip.rulesRun.length, rules.length - 1);
});
