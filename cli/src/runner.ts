// Orchestrates rule runs.
import type { Finding, Rule, RunResult } from './types.js';
import { buildContext } from './utils/repo.js';

export async function run(opts: {
  repoRoot: string;
  rules: Rule[];
  only?: string[];
  skip?: string[];
}): Promise<RunResult> {
  const start = Date.now();
  const ctx = await buildContext(opts.repoRoot);

  const filtered = opts.rules.filter((r) => {
    if (opts.only && opts.only.length > 0 && !opts.only.includes(r.id)) return false;
    if (opts.skip && opts.skip.includes(r.id)) return false;
    return true;
  });

  const allFindings: Finding[] = [];
  const rulesRun: string[] = [];

  for (const rule of filtered) {
    rulesRun.push(rule.id);
    try {
      const findings = await rule.run(ctx);
      for (const f of findings) {
        // Ensure ruleId is set; rules may forget.
        if (!f.ruleId) f.ruleId = rule.id;
        if (!f.severity) f.severity = rule.defaultSeverity;
        allFindings.push(f);
      }
    } catch (err) {
      allFindings.push({
        ruleId: rule.id,
        severity: 'P2',
        message: `Rule ${rule.id} crashed: ${(err as Error).message}`,
      });
    }
  }

  return {
    findings: allFindings,
    rulesRun,
    durationMs: Date.now() - start,
  };
}
