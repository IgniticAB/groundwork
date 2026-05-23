const SOFT_LIMIT = 80;
const HARD_LIMIT = 200;
const TARGETS = [
    'AGENTS.md',
    'CLAUDE.md',
    '.github/copilot-instructions.md',
];
/** Count lines, excluding everything between ``` fences (the fences themselves are also excluded). */
function countProseLines(body) {
    const lines = body.split('\n');
    let inFence = false;
    let count = 0;
    for (const line of lines) {
        if (/^\s*```/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence)
            continue;
        count += 1;
    }
    return count;
}
export const oversizedClaudeMd = {
    id: 'oversized-claude-md',
    description: 'A Project-layer context file is over its prose-line budget. Code examples do not count. Soft warning at 80, hard ceiling at 200.',
    defaultSeverity: 'P1',
    async run(ctx) {
        const findings = [];
        const seenBodies = new Set();
        for (const path of TARGETS) {
            const body = await ctx.readFile(path);
            if (!body)
                continue;
            if (seenBodies.has(body))
                continue;
            seenBodies.add(body);
            const lines = countProseLines(body);
            if (lines > HARD_LIMIT) {
                findings.push({
                    ruleId: 'oversized-claude-md',
                    severity: 'P1',
                    file: path,
                    message: `${path} is ${lines} prose lines (hard ceiling ${HARD_LIMIT}; code examples already excluded). Attention bloat. Move stable rules into docs/agents/<area>.md and reference them from "See also".`,
                    fix: 'Adopt the split-file architecture: lean canonical AGENTS.md + docs/agents/ overflow. See foundation/good-practices.md § split-file.',
                });
            }
            else if (lines > SOFT_LIMIT) {
                findings.push({
                    ruleId: 'oversized-claude-md',
                    severity: 'P2',
                    file: path,
                    message: `${path} is ${lines} prose lines (soft target ${SOFT_LIMIT}, ~400 tokens; code examples already excluded). The canonical file should be a lean entry point; move stable conventions to docs/agents/<area>.md.`,
                    fix: 'Consider splitting per the lean-canonical architecture. See foundation/good-practices.md § split-file.',
                });
            }
        }
        return findings;
    },
};
//# sourceMappingURL=oversized-claude-md.js.map