const isTTY = process.stdout.isTTY === true;
function color(code, s) {
    if (!isTTY)
        return s;
    return `[${code}m${s}[0m`;
}
const red = (s) => color(31, s);
const yellow = (s) => color(33, s);
const dim = (s) => color(90, s);
const bold = (s) => color(1, s);
const green = (s) => color(32, s);
const SEV_COLOR = {
    P0: red,
    P1: yellow,
    P2: dim,
};
export function reportHuman(result) {
    const { findings, rulesRun, durationMs } = result;
    if (findings.length === 0) {
        console.log(green(`✓ groundwork: no findings (${rulesRun.length} rules, ${durationMs}ms)`));
        return;
    }
    // Group by severity then by file.
    const bySev = { P0: [], P1: [], P2: [] };
    for (const f of findings)
        bySev[f.severity].push(f);
    for (const sev of ['P0', 'P1', 'P2']) {
        const group = bySev[sev];
        if (group.length === 0)
            continue;
        console.log('');
        console.log(bold(`${SEV_COLOR[sev](sev)} ${group.length} finding${group.length === 1 ? '' : 's'}`));
        for (const f of group) {
            const location = f.file ? (f.line ? `${f.file}:${f.line}` : f.file) : '(repo)';
            console.log(`  ${SEV_COLOR[sev]('●')} ${bold(f.ruleId)} ${dim(location)}`);
            console.log(`    ${f.message}`);
            if (f.evidence) {
                const ev = f.evidence.length > 100 ? f.evidence.slice(0, 97) + '...' : f.evidence;
                console.log(dim(`    > ${ev}`));
            }
            if (f.fix) {
                console.log(`    ${green('fix:')} ${f.fix}`);
            }
        }
    }
    console.log('');
    const p0 = bySev.P0.length;
    const p1 = bySev.P1.length;
    const p2 = bySev.P2.length;
    console.log(dim(`${rulesRun.length} rules, ${durationMs}ms — ${red(`${p0} P0`)} · ${yellow(`${p1} P1`)} · ${dim(`${p2} P2`)}`));
}
export function reportJson(result) {
    process.stdout.write(JSON.stringify({
        version: 1,
        durationMs: result.durationMs,
        rulesRun: result.rulesRun,
        findings: result.findings,
    }, null, 2) + '\n');
}
export function exitCodeFor(result, failOn) {
    const ranks = { P0: 3, P1: 2, P2: 1 };
    const threshold = ranks[failOn];
    for (const f of result.findings) {
        if (ranks[f.severity] >= threshold)
            return 1;
    }
    return 0;
}
//# sourceMappingURL=reporter.js.map