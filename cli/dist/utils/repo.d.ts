import type { RuleContext } from '../types.js';
export declare function buildContext(repoRoot: string): Promise<RuleContext>;
/** Run a git command in the repo. Returns stdout, or null on failure. */
export declare function git(repoRoot: string, args: string[]): string | null;
