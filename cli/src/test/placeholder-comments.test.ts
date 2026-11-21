// ce-ignore-file: these fixtures contain the patterns the rule detects.
import test from 'node:test';
import assert from 'node:assert/strict';
import { placeholderComments } from '../rules/placeholder-comments.js';
import { contextWith } from './helpers.js';

test('fires on a placeholder left in committed source', async () => {
  const ctx = contextWith({
    'src/thing.ts': 'export function thing() {\n  // TODO: implement\n}\n',
  });

  const findings = await placeholderComments.run(ctx);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 2);
});

test('stays silent on a deliberate not-implemented throw', async () => {
  // Correct, finished code in an abstract base: the author is signalling at
  // runtime, not leaving a note.
  const ctx = contextWith({
    'src/base.ts':
      'export abstract class Base {\n  render(): string {\n    throw new Error("Not implemented");\n  }\n}\n',
  });

  assert.deepEqual(await placeholderComments.run(ctx), []);
});

test('still fires when a throw carries an actual placeholder marker', async () => {
  const ctx = contextWith({
    'src/base.ts': 'function f() {\n  throw new Error("not implemented"); // TODO: implement\n}\n',
  });

  assert.equal((await placeholderComments.run(ctx)).length, 1);
});
