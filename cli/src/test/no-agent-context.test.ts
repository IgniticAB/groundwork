import test from 'node:test';
import assert from 'node:assert/strict';
import { noAgentContext } from '../rules/no-agent-context.js';
import { contextWith } from './helpers.js';

function sourceFiles(count: number): Record<string, string> {
  const files: Record<string, string> = {};
  for (let i = 0; i < count; i++) files[`src/mod${i}.ts`] = 'export const x = 1;\n';
  return files;
}

test('fires on a real codebase with no agent context at all', async () => {
  const findings = await noAgentContext.run(contextWith(sourceFiles(40)));

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'P1');
  assert.match(findings[0].message, /40 source files/);
});

test('stays silent once an AGENTS.md exists', async () => {
  const ctx = contextWith({ ...sourceFiles(40), 'AGENTS.md': '# Demo\n' });
  assert.deepEqual(await noAgentContext.run(ctx), []);
});

test('stays silent when only scoped rule files exist', async () => {
  const ctx = contextWith({ ...sourceFiles(40), '.cursor/rules/main.mdc': '---\n---\n' });
  assert.deepEqual(await noAgentContext.run(ctx), []);
});

test('stays silent on a repo too small for the advice to be worth giving', async () => {
  assert.deepEqual(await noAgentContext.run(contextWith(sourceFiles(5))), []);
});
