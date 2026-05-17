export type Severity = 'P0' | 'P1' | 'P2';
export interface Finding {
    /** Stable identifier for this finding kind, e.g. "stale-claude-md". */
    ruleId: string;
    severity: Severity;
    /** One-line human description of what is wrong. */
    message: string;
    /** Absolute or repo-relative path of the file the finding is about. Optional for repo-wide findings. */
    file?: string;
    /** Line number, 1-indexed. Optional. */
    line?: number;
    /** Specific code or text snippet that triggered the finding. Optional. */
    evidence?: string;
    /** Short hint to fix this, ideally a command. */
    fix?: string;
}
export interface RuleContext {
    /** Absolute path to the repo root. */
    repoRoot: string;
    /** Function that reads a file relative to repo root. Returns null if missing. */
    readFile: (relativePath: string) => Promise<string | null>;
    /** Function that lists files matching glob(s) relative to repo root. */
    glob: (patterns: string | string[], options?: {
        ignore?: string[];
    }) => Promise<string[]>;
    /** True if .git exists and we can shell out for git commands. */
    hasGit: boolean;
}
export interface Rule {
    id: string;
    description: string;
    /** Default severity if the rule fires. Some rules may override per-finding. */
    defaultSeverity: Severity;
    run: (ctx: RuleContext) => Promise<Finding[]>;
}
export interface RunResult {
    findings: Finding[];
    rulesRun: string[];
    durationMs: number;
}
