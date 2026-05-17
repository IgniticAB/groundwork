const TARGETS = [
    { path: 'CLAUDE.md', limit: 200 },
    { path: 'AGENTS.md', limit: 200 },
    { path: '.github/copilot-instructions.md', limit: 200 },
];
export const oversizedClaudeMd = {
    id: 'oversized-claude-md',
    description: 'A Project-layer context file is over its line budget (default 200).',
    defaultSeverity: 'P1',
    async run(ctx) {
        const findings = [];
        for (const t of TARGETS) {
            const body = await ctx.readFile(t.path);
            if (!body)
                continue;
            const lines = body.split('\n').length;
            if (lines > t.limit) {
                findings.push({
                    ruleId: 'oversized-claude-md',
                    severity: 'P1',
                    file: t.path,
                    message: `${t.path} is ${lines} lines (limit ${t.limit}). Move detail to dedicated docs and reference them.`,
                    fix: 'Split content into docs/ files and reference from this one.',
                });
            }
        }
        return findings;
    },
};
//# sourceMappingURL=oversized-claude-md.js.map