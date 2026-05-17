import type { RunResult } from './types.js';
export declare function reportHuman(result: RunResult): void;
export declare function reportJson(result: RunResult): void;
export declare function exitCodeFor(result: RunResult, failOn: 'P0' | 'P1' | 'P2'): number;
