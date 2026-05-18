const SOFT_LIMIT = 80; // lean-root spirit (~400 tokens)
const HARD_LIMIT = 200; // attention-bloat ceiling
const TARGETS = [
    'CLAUDE.md',
    'AGENTS.md',
    '.github/copilot-instructions.md',
];
export const oversizedClaudeMd = {
    id: 'oversized-claude-md',
    description: 'A Project-layer context file is over its line budget. Soft warning at 80 lines (lean-root spirit, ~400 tokens), hard ceiling at 200 lines.',
    defaultSeverity: 'P1',
    async run(ctx) {
        const findings = [];
        for (const path of TARGETS) {
            const body = await ctx.readFile(path);
            if (!body)
                continue;
            const lines = body.split('\n').length;
            if (lines > HARD_LIMIT) {
                findings.push({
                    ruleId: 'oversized-claude-md',
                    severity: 'P1',
                    file: path,
                    message: `${path} is ${lines} lines (hard ceiling ${HARD_LIMIT}). Attention bloat. Move stable rules into .claude/rules/<NN>-<name>.md and long detail into .context/conventions.md.`,
                    fix: 'Adopt the split-file architecture: lean root + .claude/rules/ directory. Run `groundwork document` after splitting.',
                });
            }
            else if (lines > SOFT_LIMIT) {
                findings.push({
                    ruleId: 'oversized-claude-md',
                    severity: 'P2',
                    file: path,
                    message: `${path} is ${lines} lines (soft target ${SOFT_LIMIT}, ~400 tokens). The root file should be a lean entry point; move stable conventions to .claude/rules/<NN>-<name>.md.`,
                    fix: 'Consider splitting per the lean-root architecture. See foundation/good-practices.md § split-file.',
                });
            }
        }
        return findings;
    },
};
//# sourceMappingURL=oversized-claude-md.js.map