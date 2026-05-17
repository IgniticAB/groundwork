const COPYLEFT_PATTERNS = [/GNU GENERAL PUBLIC LICENSE/i, /GNU AFFERO GENERAL PUBLIC/i, /MOZILLA PUBLIC LICENSE/i];
const SOURCE_GLOBS = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.rs', '**/*.go'];
// Limit how many files we flag to keep output manageable; report a summary if more.
const MAX_FINDINGS = 20;
export const missingLicenseHeader = {
    id: 'missing-license-header',
    description: 'Repo is copyleft-licensed but source files are missing SPDX-License-Identifier headers.',
    defaultSeverity: 'P2',
    async run(ctx) {
        const findings = [];
        const licenseBody = (await ctx.readFile('LICENSE')) ?? (await ctx.readFile('LICENSE.md')) ?? (await ctx.readFile('LICENSE.txt'));
        if (!licenseBody)
            return findings;
        const isCopyleft = COPYLEFT_PATTERNS.some((re) => re.test(licenseBody));
        if (!isCopyleft)
            return findings;
        const files = await ctx.glob(SOURCE_GLOBS);
        let count = 0;
        for (const file of files) {
            if (count >= MAX_FINDINGS) {
                findings.push({
                    ruleId: 'missing-license-header',
                    severity: 'P2',
                    message: `... and more files missing SPDX headers. Truncated at ${MAX_FINDINGS}.`,
                });
                break;
            }
            const body = await ctx.readFile(file);
            if (!body)
                continue;
            const head = body.slice(0, 500); // Only look at the top of the file.
            if (!/SPDX-License-Identifier:/i.test(head)) {
                findings.push({
                    ruleId: 'missing-license-header',
                    severity: 'P2',
                    file,
                    line: 1,
                    message: 'Source file missing SPDX-License-Identifier header (repo is copyleft).',
                    fix: 'Add a comment near the top: SPDX-License-Identifier: <id>',
                });
                count++;
            }
        }
        return findings;
    },
};
//# sourceMappingURL=missing-license-header.js.map