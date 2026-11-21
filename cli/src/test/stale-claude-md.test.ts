import test from 'node:test';
import assert from 'node:assert/strict';
import { staleClaudeMd } from '../rules/stale-claude-md.js';
import { contextWith } from './helpers.js';

const VUE_PKG = JSON.stringify({
  packageManager: 'pnpm@9.0.0',
  dependencies: { vue: '^3.4.0' },
});

test('fires when a context file prescribes the wrong package manager', async () => {
  const ctx = contextWith({
    'package.json': VUE_PKG,
    'AGENTS.md': '# Demo\n\n## Non-negotiables\n- Install dependencies with yarn.\n',
  });

  const findings = await staleClaudeMd.run(ctx);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 4);
  assert.match(findings[0].evidence ?? '', /yarn/);
});

test('stays silent when the line prohibits the other tool rather than prescribing it', async () => {
  // The false positive this rule used to produce at P0, which fails CI on a
  // correctly written file.
  const ctx = contextWith({
    'package.json': VUE_PKG,
    'AGENTS.md': '# Demo\n\n## Style\n- Do not use React patterns here; this is Vue.\n',
  });

  assert.deepEqual(await staleClaudeMd.run(ctx), []);
});

test('stays silent on a delta-update history entry', async () => {
  const ctx = contextWith({
    'package.json': VUE_PKG,
    'AGENTS.md':
      '# Demo\n\n## Package manager\n- 2026-04 — pnpm.\n- 2024-08 (deprecated 2026-04) — yarn. Dropped for workspace support.\n',
  });

  assert.deepEqual(await staleClaudeMd.run(ctx), []);
});

test('stays silent when one line names both tools as a comparison', async () => {
  const ctx = contextWith({
    'package.json': VUE_PKG,
    'AGENTS.md': '# Demo\n\n## Non-negotiables\n- Use pnpm, never npm.\n',
  });

  assert.deepEqual(await staleClaudeMd.run(ctx), []);
});

test('fires on a framework the project does not depend on', async () => {
  const ctx = contextWith({
    'package.json': VUE_PKG,
    'AGENTS.md': '# Demo\n\n## Style\n- Components are React function components.\n',
  });

  const findings = await staleClaudeMd.run(ctx);

  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /react/i);
  assert.match(findings[0].message, /vue/i);
});

test('says nothing at all when there is no package.json to compare against', async () => {
  const ctx = contextWith({ 'AGENTS.md': '# Demo\n\n- Use yarn.\n' });
  assert.deepEqual(await staleClaudeMd.run(ctx), []);
});
