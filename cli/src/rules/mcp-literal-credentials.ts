// ce-ignore-file: this rule contains credential field names by design.
// Detects literal credentials in MCP config files. Credentials must be env-var references.
import type { Rule, Finding } from '../types.js';
import { isFileIgnored, isIgnored } from '../utils/ignores.js';

// Match common credential key names. We use a single regex with alternation
// (case-insensitive) so the same field never fires twice.
const CREDENTIAL_KEY_RE = /"(api[_-]?key|token|password|secret|access[_-]?token|private[_-]?key|auth[_-]?token)"\s*:\s*"([^"]+)"/i;

// A literal-looking value: not all-uppercase (env vars), not "<placeholder>", not "ENV:...".
function looksLikeLiteral(value: string): boolean {
  if (!value) return false;
  if (/^[A-Z_][A-Z0-9_]*$/.test(value)) return false; // ENV_VAR_STYLE
  if (/^<.*>$/.test(value)) return false; // <placeholder>
  if (/^\$\{?[A-Z_][A-Z0-9_]*\}?$/.test(value)) return false; // ${ENV_VAR}
  if (/^env:/i.test(value)) return false;
  if (value === 'changeme' || value === 'your-key-here') return false;
  if (value.length < 8) return false;
  return true;
}

export const mcpLiteralCredentials: Rule = {
  id: 'mcp-literal-credentials',
  description: 'MCP config files contain literal credentials. Credentials must reference env vars.',
  defaultSeverity: 'P0',
  async run(ctx) {
    const findings: Finding[] = [];

    const candidates = await ctx.glob([
      '.context/mcp-config*.json',
      '.context/mcp-server-*.json',
      'mcp.config.json',
      '.mcp/*.json',
    ]);

    for (const file of candidates) {
      const body = await ctx.readFile(file);
      if (!body) continue;
      if (isFileIgnored(body)) continue;

      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = CREDENTIAL_KEY_RE.exec(line);
        if (m && looksLikeLiteral(m[2])) {
          if (isIgnored(body, i + 1)) continue;
          const matchedKey = m[1];
          findings.push({
            ruleId: 'mcp-literal-credentials',
            severity: 'P0',
            file,
            line: i + 1,
            message: `MCP config field "${matchedKey}" contains a literal value. Use an env var reference.`,
            evidence: line.trim(),
            fix: `Change to: "${matchedKey}": "ENV_VAR_NAME" or "$\{ENV_VAR_NAME}"`,
          });
        }
      }
    }

    return findings;
  },
};
