const TARGETS = ['CLAUDE.md', 'AGENTS.md'];
export const missingVerification = {
    id: 'missing-verification',
    description: 'Project-layer context file does not include a Verification section.',
    defaultSeverity: 'P1',
    async run(ctx) {
        const findings = [];
        for (const target of TARGETS) {
            const body = await ctx.readFile(target);
            if (!body)
                continue;
            const lower = body.toLowerCase();
            const hasSection = /^#+\s*verification\b/im.test(body);
            const hasCommand = /\b(npm|pnpm|yarn|bun)\s+(test|lint|typecheck|check)\b/.test(lower)
                || /\bpytest\b/.test(lower)
                || /\bcargo\s+(test|check|clippy)\b/.test(lower)
                || /\bgo\s+test\b/.test(lower);
            if (!hasSection || !hasCommand) {
                findings.push({
                    ruleId: 'missing-verification',
                    severity: 'P1',
                    file: target,
                    message: hasSection
                        ? `${target} has a Verification section but no recognizable verification command in it.`
                        : `${target} has no Verification section.`,
                    fix: 'Run: groundwork verify',
                });
            }
        }
        return findings;
    },
};
//# sourceMappingURL=missing-verification.js.map