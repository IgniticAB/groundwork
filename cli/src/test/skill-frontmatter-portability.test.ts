import test from 'node:test';
import assert from 'node:assert/strict';
import { skillFrontmatterPortability } from '../rules/skill-frontmatter-portability.js';
import { contextWith } from './helpers.js';

test('fires on a Claude Code-only frontmatter field', async () => {
  const ctx = contextWith({
    'skills/demo/SKILL.md':
      '---\nname: demo\ndescription: Does a specific thing.\nargument-hint: <path>\n---\n\n# Demo\n',
  });

  const findings = await skillFrontmatterPortability.run(ctx);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].line, 4);
  assert.match(findings[0].message, /Claude Code-only/);
});

test('stays silent on frontmatter using only the portable fields', async () => {
  const ctx = contextWith({
    'skills/demo/SKILL.md':
      '---\nname: demo\ndescription: Does a specific thing.\nlicense: MIT\nmetadata:\n  version: "1.0.0"\n---\n\n# Demo\n',
  });

  assert.deepEqual(await skillFrontmatterPortability.run(ctx), []);
});

test('does not mistake a nested metadata key for a top-level field', async () => {
  const ctx = contextWith({
    'skills/demo/SKILL.md':
      '---\nname: demo\ndescription: Does a specific thing.\nmetadata:\n  model: opus\n---\n\n# Demo\n',
  });

  assert.deepEqual(await skillFrontmatterPortability.run(ctx), []);
});

test('leaves installed skills alone unless --include-installed is passed', async () => {
  const files = {
    '.agents/skills/someone-elses/SKILL.md':
      '---\nname: theirs\ndescription: Not ours to fix.\nargument-hint: <path>\n---\n\n# Theirs\n',
  };

  assert.deepEqual(await skillFrontmatterPortability.run(contextWith(files)), []);

  const optedIn = await skillFrontmatterPortability.run(
    contextWith(files, { includeInstalled: true }),
  );
  assert.equal(optedIn.length, 1);
});
