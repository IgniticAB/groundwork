// One case that fires, one that must not.
import test from 'node:test';
import assert from 'node:assert/strict';
import { agentsClaudeSync } from '../rules/agents-claude-sync.js';
import type { RuleContext } from '../types.js';

function contextWith(files: Record<string, string>): RuleContext {
  return {
    repoRoot: '/fixture',
    hasGit: false,
    readFile: async (p) => (p in files ? files[p] : null),
    glob: async () => [],
  };
}

const AGENTS = `# Demo — agent context

## Verification
\`\`\`bash
npm test
\`\`\`

## Non-negotiables
- Use npm. Do not introduce another package manager.
`;

test('fires when CLAUDE.md is a second copy that has drifted', async () => {
  const ctx = contextWith({
    'AGENTS.md': AGENTS,
    'CLAUDE.md': AGENTS.replace('Use npm.', 'Use pnpm.'),
  });

  const findings = await agentsClaudeSync.run(ctx);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'CLAUDE.md');
  assert.match(findings[0].fix ?? '', /@AGENTS\.md/);
});

test('stays silent when CLAUDE.md is an @AGENTS.md import', async () => {
  const pointer = `# Demo — Claude Code context

<!-- AGENTS.md is canonical. This file is one import line on purpose;
     see the groundwork skill's good-practices section 11. -->

@AGENTS.md
`;

  const ctx = contextWith({ 'AGENTS.md': AGENTS, 'CLAUDE.md': pointer });

  assert.deepEqual(await agentsClaudeSync.run(ctx), []);
});

test('still fires when a pointer line is bolted onto a full rule set', async () => {
  const ctx = contextWith({
    'AGENTS.md': AGENTS,
    'CLAUDE.md': `@AGENTS.md\n\n${AGENTS.replace('Use npm.', 'Use pnpm.')}`,
  });

  assert.equal((await agentsClaudeSync.run(ctx)).length, 1);
});

test('stays silent when CLAUDE.md is a symlink (identical bodies)', async () => {
  const ctx = contextWith({ 'AGENTS.md': AGENTS, 'CLAUDE.md': AGENTS });

  assert.deepEqual(await agentsClaudeSync.run(ctx), []);
});
