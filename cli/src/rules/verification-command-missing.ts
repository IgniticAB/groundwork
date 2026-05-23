// Detects verification commands in AGENTS.md / CLAUDE.md that do not resolve
// to a real script in the repo's manifest. If the Verification section says
// "pnpm test" but package.json has no "test" script, the agent will run
// something that fails immediately. P0: the agent will actively do the wrong
// thing on the next change.
//
// Scope: only the Verification H2 section is scanned, only inside fenced code
// blocks. Conservative validators:
//   - `npm | pnpm | yarn | bun [run] <script>` → check package.json#scripts.
//   - `make <target>` → check Makefile has the target.
//   - `pytest | ruff | mypy | ...` → require pyproject.toml or setup.cfg.
//   - `cargo <subcmd>` → require Cargo.toml.
//   - `go <subcmd>` → require go.mod.
// Anything we cannot classify is skipped (no false positives on bare shell
// commands, custom scripts, or non-package-manager tooling).
import type { Rule, Finding } from '../types.js';

const TARGETS = ['AGENTS.md', 'CLAUDE.md'];

interface Section {
  heading: string;
  body: string;
  startLine: number;
}

function parseSections(body: string): Section[] {
  const lines = body.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      current = { heading: m[1].trim(), body: '', startLine: i + 1 };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

function isVerification(heading: string): boolean {
  return /^verification$/i.test(heading);
}

/** Extract command lines from fenced code blocks inside the section body. */
function extractCommandLines(sectionBody: string, sectionStartLine: number): Array<{ line: string; lineNumber: number }> {
  const out: Array<{ line: string; lineNumber: number }> = [];
  const lines = sectionBody.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    out.push({ line: trimmed, lineNumber: sectionStartLine + i + 1 });
  }
  return out;
}

interface CommandSpec {
  validator: 'npm-script' | 'make-target' | 'manifest-exists' | 'skip';
  detail: string;
  manifest?: string;
}

/** Classify a single shell command into a validator + detail, or skip. */
function classifyCommand(cmd: string): CommandSpec {
  const trimmed = cmd.trim();
  if (!trimmed) return { validator: 'skip', detail: '' };
  // Placeholder syntax from the template.
  if (/[<>]/.test(trimmed)) return { validator: 'skip', detail: '' };

  // npm / pnpm / yarn / bun (with or without `run`) <script>
  const npmRun = /^(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?([a-z][\w:-]*)/i.exec(trimmed);
  if (npmRun) {
    const script = npmRun[1].toLowerCase();
    // bun has built-ins like `bun install` that aren't scripts. Skip common built-ins.
    if (['install', 'add', 'remove', 'i'].includes(script)) return { validator: 'skip', detail: '' };
    return { validator: 'npm-script', detail: script, manifest: 'package.json' };
  }

  // make <target>
  const makeTarget = /^make\s+([a-zA-Z][\w-]*)/.exec(trimmed);
  if (makeTarget) return { validator: 'make-target', detail: makeTarget[1], manifest: 'Makefile' };

  // Python tools that conventionally require pyproject.toml or setup.cfg.
  if (/^(?:pytest|ruff|mypy|black|isort|flake8|pyright|poetry)\b/.test(trimmed)) {
    return { validator: 'manifest-exists', detail: trimmed.split(/\s+/)[0], manifest: 'pyproject.toml' };
  }

  // cargo <subcmd>
  if (/^cargo\s+/.test(trimmed)) {
    return { validator: 'manifest-exists', detail: trimmed.split(/\s+/).slice(0, 2).join(' '), manifest: 'Cargo.toml' };
  }

  // go <subcmd>
  if (/^go\s+/.test(trimmed)) {
    return { validator: 'manifest-exists', detail: trimmed.split(/\s+/).slice(0, 2).join(' '), manifest: 'go.mod' };
  }

  return { validator: 'skip', detail: '' };
}

/** Split a shell pipeline / chain into individual commands. */
function splitCommands(line: string): string[] {
  // Split on &&, ||, ;, | but keep simple; ignore quoted strings (rare in these contexts).
  return line.split(/&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean);
}

async function findScriptsInPackageJson(ctx: { readFile: (p: string) => Promise<string | null> }): Promise<Set<string> | null> {
  const raw = await ctx.readFile('package.json');
  if (!raw) return null;
  try {
    const pkg = JSON.parse(raw) as { scripts?: Record<string, unknown> };
    const scripts = pkg.scripts ?? {};
    return new Set(Object.keys(scripts));
  } catch {
    return new Set(); // malformed package.json: treat as no scripts known
  }
}

async function findTargetsInMakefile(ctx: { readFile: (p: string) => Promise<string | null> }): Promise<Set<string> | null> {
  const raw = await ctx.readFile('Makefile');
  if (!raw) return null;
  const targets = new Set<string>();
  for (const line of raw.split('\n')) {
    // Target line: starts in column 0, name followed by colon.
    const m = /^([A-Za-z][\w.-]*)\s*:/.exec(line);
    if (m) targets.add(m[1]);
  }
  return targets;
}

export const verificationCommandMissing: Rule = {
  id: 'verification-command-missing',
  description:
    'The Verification section in AGENTS.md / CLAUDE.md names a command that does not resolve to a real script (e.g. `pnpm test` but package.json has no `test` script).',
  defaultSeverity: 'P0',
  async run(ctx) {
    const findings: Finding[] = [];

    // Cache manifest lookups across both target files.
    let npmScripts: Set<string> | null | undefined;
    let makeTargets: Set<string> | null | undefined;
    const manifestCache = new Map<string, boolean>();
    const checkManifest = async (path: string): Promise<boolean> => {
      if (manifestCache.has(path)) return manifestCache.get(path)!;
      const exists = (await ctx.readFile(path)) !== null;
      manifestCache.set(path, exists);
      return exists;
    };

    for (const target of TARGETS) {
      const body = await ctx.readFile(target);
      if (!body) continue;
      const sections = parseSections(body);
      const verification = sections.find((s) => isVerification(s.heading));
      if (!verification) continue;

      const commandLines = extractCommandLines(verification.body, verification.startLine);
      for (const { line, lineNumber } of commandLines) {
        for (const cmd of splitCommands(line)) {
          const spec = classifyCommand(cmd);
          if (spec.validator === 'skip') continue;

          if (spec.validator === 'npm-script') {
            if (npmScripts === undefined) npmScripts = await findScriptsInPackageJson(ctx);
            if (npmScripts === null) continue; // no package.json: out of scope here
            if (!npmScripts.has(spec.detail)) {
              findings.push({
                ruleId: 'verification-command-missing',
                severity: 'P0',
                file: target,
                line: lineNumber,
                message: `${target}: verification names \`${cmd}\` but package.json has no "${spec.detail}" script.`,
                evidence: cmd,
                fix: `Add a "${spec.detail}" entry under "scripts" in package.json, or remove "${cmd}" from the Verification section.`,
              });
            }
          } else if (spec.validator === 'make-target') {
            if (makeTargets === undefined) makeTargets = await findTargetsInMakefile(ctx);
            if (makeTargets === null) {
              findings.push({
                ruleId: 'verification-command-missing',
                severity: 'P0',
                file: target,
                line: lineNumber,
                message: `${target}: verification names \`${cmd}\` but no Makefile is present in the repo root.`,
                evidence: cmd,
                fix: `Add a Makefile with a "${spec.detail}" target, or remove "${cmd}" from the Verification section.`,
              });
            } else if (!makeTargets.has(spec.detail)) {
              findings.push({
                ruleId: 'verification-command-missing',
                severity: 'P0',
                file: target,
                line: lineNumber,
                message: `${target}: verification names \`${cmd}\` but Makefile has no "${spec.detail}" target.`,
                evidence: cmd,
                fix: `Add a "${spec.detail}:" target to the Makefile, or remove "${cmd}" from the Verification section.`,
              });
            }
          } else if (spec.validator === 'manifest-exists' && spec.manifest) {
            const exists = await checkManifest(spec.manifest);
            if (!exists) {
              findings.push({
                ruleId: 'verification-command-missing',
                severity: 'P0',
                file: target,
                line: lineNumber,
                message: `${target}: verification names \`${cmd}\` but ${spec.manifest} is not present in the repo root.`,
                evidence: cmd,
                fix: `Set up the project's ${spec.manifest}, or remove "${cmd}" from the Verification section.`,
              });
            }
          }
        }
      }
    }

    return findings;
  },
};
