import test from 'node:test';
import assert from 'node:assert/strict';
import { missingAdrXref } from '../rules/missing-adr-xref.js';
import { contextWith } from './helpers.js';

test('fires on a decision stated with no ADR anywhere near it', async () => {
  const ctx = contextWith({
    'AGENTS.md': '# Demo\n\n## Stack\n- We chose Postgres over DynamoDB.\n',
  });

  const findings = await missingAdrXref.run(ctx);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 4);
});

test('stays silent when a numbered ADR is cited nearby', async () => {
  const ctx = contextWith({
    'AGENTS.md': '# Demo\n\n## Stack\n- We chose Postgres over DynamoDB (ADR-0004).\n',
  });

  assert.deepEqual(await missingAdrXref.run(ctx), []);
});

test('stays silent on a line that points at the decision log itself', async () => {
  // A "See also" entry naming docs/decisions/ is the cross-link, not a
  // decision missing one.
  const ctx = contextWith({
    'AGENTS.md':
      '# Demo\n\n## See also\n- `docs/decisions/` — ADRs, and negative-space.md for what was rejected\n',
  });

  assert.deepEqual(await missingAdrXref.run(ctx), []);
});
