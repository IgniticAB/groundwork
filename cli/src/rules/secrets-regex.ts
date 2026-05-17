// ce-ignore-file: this rule contains pattern definitions for secret detection.
// Minimal secrets regex scan. NOT a replacement for gitleaks; covers the most common high-confidence patterns.
// For production use, layer gitleaks on top.
import type { Rule, Finding } from '../types.js';
import { isFileIgnored, isIgnored } from '../utils/ignores.js';

type SecretPattern = {
  id: string;
  description: string;
  pattern: RegExp;
};

const PATTERNS: SecretPattern[] = [
  { id: 'aws-access-key', description: 'AWS access key ID', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'aws-secret-key', description: 'AWS secret access key candidate', pattern: /\b(?:aws_?secret_?access_?key|aws_?secret)["'\s:=]+["']?([A-Za-z0-9/+=]{40})\b/i },
  { id: 'github-token', description: 'GitHub personal access token', pattern: /\bghp_[A-Za-z0-9]{36}\b/ },
  { id: 'github-fine-grained', description: 'GitHub fine-grained PAT', pattern: /\bgithub_pat_[A-Za-z0-9_]{82}\b/ },
  { id: 'openai-key', description: 'OpenAI API key', pattern: /\bsk-[A-Za-z0-9]{48}\b/ },
  { id: 'anthropic-key', description: 'Anthropic API key', pattern: /\bsk-ant-[A-Za-z0-9\-_]{90,}\b/ },
  { id: 'slack-token', description: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { id: 'private-key-pem', description: 'PEM private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { id: 'jwt', description: 'JWT', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { id: 'google-api-key', description: 'Google API key', pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
];

// Exclude files that are explicitly examples or test fixtures of secrets.
const EXCLUDE_FILE_PATTERNS = [
  /\bnode_modules\b/,
  /\bdist\b/,
  /\bbuild\b/,
  /\.lock$/,
  /\.lockb$/,
  /\b__fixtures__\b/,
  /\bfixtures?\b/,
  /\.example$/,
  /\bexamples?\b/,
];

const TEXT_GLOBS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.mjs',
  '**/*.cjs',
  '**/*.py',
  '**/*.rs',
  '**/*.go',
  '**/*.java',
  '**/*.rb',
  '**/*.md',
  '**/*.yml',
  '**/*.yaml',
  '**/*.json',
  '**/*.env',
  '**/*.envrc',
  '**/.env.*',
];

export const secretsRegex: Rule = {
  id: 'secrets-regex',
  description: 'High-confidence secret patterns (AWS, GitHub, OpenAI, Anthropic, Slack, PEM, JWT, Google).',
  defaultSeverity: 'P0',
  async run(ctx) {
    const findings: Finding[] = [];
    const files = await ctx.glob(TEXT_GLOBS);

    for (const file of files) {
      if (EXCLUDE_FILE_PATTERNS.some((re) => re.test(file))) continue;
      const body = await ctx.readFile(file);
      if (!body) continue;
      if (isFileIgnored(body)) continue;

      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const sp of PATTERNS) {
          if (sp.pattern.test(line)) {
            if (isIgnored(body, i + 1)) break;
            findings.push({
              ruleId: 'secrets-regex',
              severity: 'P0',
              file,
              line: i + 1,
              message: `Possible ${sp.description} in committed file.`,
              evidence: redact(line),
              fix: 'Rotate the credential and remove from history (BFG / git-filter-repo).',
            });
            // Only flag once per line.
            break;
          }
        }
      }
    }

    return findings;
  },
};

function redact(line: string): string {
  // Mask the middle of anything that looks like a secret to avoid logging it in findings output.
  return line.replace(/[A-Za-z0-9_\-\/+=]{16,}/g, (m) => {
    if (m.length <= 8) return m;
    return m.slice(0, 4) + '*'.repeat(Math.min(m.length - 8, 12)) + m.slice(-4);
  });
}
