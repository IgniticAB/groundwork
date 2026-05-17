import type { Rule, RunResult } from './types.js';
export declare function run(opts: {
    repoRoot: string;
    rules: Rule[];
    only?: string[];
    skip?: string[];
}): Promise<RunResult>;
