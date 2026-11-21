// Every other rule in this detector finds bad content. None of them find
// missing content, which means the worst case in the set — a large repo with no
// agent context whatsoever — scores a clean run.
//
// That is the finding most worth reporting, and reporting it is the difference
// between "no findings" meaning "this repo is in good shape" and meaning
// "this repo gave the detector nothing to read".
import type { Rule, Finding } from '../types.js';

/** Any one of these means the repo has made a start. */
const CONTEXT_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
];

const CONTEXT_GLOBS = [
  '.cursor/rules/*.mdc',
  '.windsurf/rules/*.md',
  '.claude/rules/*.md',
  '.github/instructions/*.instructions.md',
  'docs/agents/*.md',
  '*/AGENTS.md',
  '*/*/AGENTS.md',
];

/** Below this, the repo is too small for the finding to be worth making. */
const MIN_SOURCE_FILES = 20;

const SOURCE_GLOBS = [
  '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.rs',
  '**/*.go', '**/*.java', '**/*.kt', '**/*.rb', '**/*.swift', '**/*.cs',
  '**/*.php', '**/*.scala', '**/*.c', '**/*.cc', '**/*.cpp', '**/*.h',
];

export const noAgentContext: Rule = {
  id: 'no-agent-context',
  description:
    'The repo has no agent context file at all. Every other rule checks the quality of context that exists; this one checks that any exists.',
  defaultSeverity: 'P1',
  async run(ctx) {
    for (const file of CONTEXT_FILES) {
      if ((await ctx.readFile(file)) !== null) return [];
    }
    const scoped = await ctx.glob(CONTEXT_GLOBS);
    if (scoped.length > 0) return [];

    // A repo with no source files is a docs repo, a fresh init, or a scratch
    // directory. Telling it to write AGENTS.md is not useful.
    const sources = await ctx.glob(SOURCE_GLOBS);
    if (sources.length < MIN_SOURCE_FILES) return [];

    const findings: Finding[] = [
      {
        ruleId: 'no-agent-context',
        severity: 'P1',
        message: `No agent context file found (AGENTS.md, CLAUDE.md, .cursor/rules/, .github/copilot-instructions.md, …) in a repo with ${sources.length} source files. Every agent working here starts from nothing and infers the conventions from whatever it happens to read first.`,
        fix: 'Write an AGENTS.md at the repo root naming the stack, the verification commands, and the handful of rules that apply everywhere. Every harness reads it. The groundwork skill\'s `init` command does this interactively.',
      },
    ];
    return findings;
  },
};
