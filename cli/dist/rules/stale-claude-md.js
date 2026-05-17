const FRAMEWORKS = ['next', 'remix', 'svelte', 'sveltekit', 'astro', 'nuxt', 'vue', 'react', 'angular'];
const PKG_MGRS = ['npm', 'pnpm', 'yarn', 'bun'];
export const staleClaudeMd = {
    id: 'stale-claude-md',
    description: 'CLAUDE.md/AGENTS.md mentions a package manager or framework not present in package.json.',
    defaultSeverity: 'P0',
    async run(ctx) {
        const findings = [];
        const pkgRaw = await ctx.readFile('package.json');
        if (!pkgRaw)
            return findings; // Not a Node project; skip.
        let pkg;
        try {
            pkg = JSON.parse(pkgRaw);
        }
        catch {
            return findings;
        }
        const declaredPkgMgr = (pkg.packageManager ?? '').split('@')[0].toLowerCase();
        const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
        const presentFrameworks = FRAMEWORKS.filter((f) => deps[f] || deps[`@${f}/core`]);
        for (const target of ['CLAUDE.md', 'AGENTS.md', '.github/copilot-instructions.md']) {
            const body = await ctx.readFile(target);
            if (!body)
                continue;
            const lower = body.toLowerCase();
            // Package manager mismatch: file names a pkg manager other than the declared one.
            if (declaredPkgMgr) {
                for (const mgr of PKG_MGRS) {
                    if (mgr === declaredPkgMgr)
                        continue;
                    const pattern = new RegExp(`\\b${mgr}\\b`, 'g');
                    if (pattern.test(lower) && !lower.includes(declaredPkgMgr)) {
                        findings.push({
                            ruleId: 'stale-claude-md',
                            severity: 'P0',
                            file: target,
                            message: `${target} mentions "${mgr}" but package.json declares packageManager: ${declaredPkgMgr}.`,
                            fix: 'Run: groundwork document',
                        });
                        break;
                    }
                }
            }
            // Framework mismatch: file mentions a framework not in dependencies.
            for (const fw of FRAMEWORKS) {
                const inFile = new RegExp(`\\b${fw}(?:\\.js)?\\b`, 'i').test(body);
                const inDeps = presentFrameworks.includes(fw);
                if (inFile && !inDeps && presentFrameworks.length > 0) {
                    // Only flag if a *different* framework is actually present; otherwise it's prose.
                    const otherPresent = presentFrameworks.find((p) => p !== fw);
                    if (otherPresent) {
                        findings.push({
                            ruleId: 'stale-claude-md',
                            severity: 'P0',
                            file: target,
                            message: `${target} mentions "${fw}" but package.json shows "${otherPresent}".`,
                            fix: 'Run: groundwork document',
                        });
                        break;
                    }
                }
            }
        }
        return findings;
    },
};
//# sourceMappingURL=stale-claude-md.js.map