// Output formatting: human (colored terminal) and JSON (CI).
import type { Finding, RunResult } from './types.js';

const isTTY = process.stdout.isTTY === true;

function color(code: number, s: string): string {
  if (!isTTY) return s;
  return `[${code}m${s}[0m`;
}
const red = (s: string) => color(31, s);
const yellow = (s: string) => color(33, s);
const dim = (s: string) => color(90, s);
const bold = (s: string) => color(1, s);
const green = (s: string) => color(32, s);

const SEV_COLOR: Record<Finding['severity'], (s: string) => string> = {
  P0: red,
  P1: yellow,
  P2: dim,
};

export function reportHuman(result: RunResult): void {
  const { findings, rulesRun, durationMs } = result;

  if (findings.length === 0) {
    console.log(green(`✓ context-engineer: no findings (${rulesRun.length} rules, ${durationMs}ms)`));
    return;
  }

  // Group by severity then by file.
  const bySev: Record<string, Finding[]> = { P0: [], P1: [], P2: [] };
  for (const f of findings) bySev[f.severity].push(f);

  for (const sev of ['P0', 'P1', 'P2'] as const) {
    const group = bySev[sev];
    if (group.length === 0) continue;
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
  console.log(
    dim(
      `${rulesRun.length} rules, ${durationMs}ms — ${red(`${p0} P0`)} · ${yellow(`${p1} P1`)} · ${dim(`${p2} P2`)}`
    )
  );
}

export function reportJson(result: RunResult): void {
  process.stdout.write(
    JSON.stringify(
      {
        version: 1,
        durationMs: result.durationMs,
        rulesRun: result.rulesRun,
        findings: result.findings,
      },
      null,
      2
    ) + '\n'
  );
}

export function exitCodeFor(result: RunResult, failOn: 'P0' | 'P1' | 'P2'): number {
  const ranks = { P0: 3, P1: 2, P2: 1 };
  const threshold = ranks[failOn];
  for (const f of result.findings) {
    if (ranks[f.severity] >= threshold) return 1;
  }
  return 0;
}
