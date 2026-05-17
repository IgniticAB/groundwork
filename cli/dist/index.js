// Entry point. Parses argv, dispatches to detect.
import path from 'node:path';
import { run } from './runner.js';
import { reportHuman, reportJson, exitCodeFor } from './reporter.js';
import { rules } from './rules/index.js';
function parseArgs(argv) {
    let command = 'detect';
    let repoRoot = process.cwd();
    let format = 'human';
    let failOn = 'P0';
    let only = [];
    let skip = [];
    let watchMode = false;
    let help = false;
    let version = false;
    const args = argv.slice(2);
    if (args[0] && !args[0].startsWith('-')) {
        command = args[0];
        args.shift();
    }
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--help' || a === '-h')
            help = true;
        else if (a === '--version' || a === '-v')
            version = true;
        else if (a === '--json')
            format = 'json';
        else if (a === '--watch' || a === '-w')
            watchMode = true;
        else if (a === '--format')
            format = args[++i] ?? 'human';
        else if (a === '--fail-on')
            failOn = args[++i] ?? 'P0';
        else if (a === '--only')
            only = (args[++i] ?? '').split(',').filter(Boolean);
        else if (a === '--skip')
            skip = (args[++i] ?? '').split(',').filter(Boolean);
        else if (!a.startsWith('-'))
            repoRoot = a;
        else {
            console.error(`Unknown flag: ${a}`);
            process.exit(2);
        }
    }
    return { command, repoRoot: path.resolve(repoRoot), format, failOn, only, skip, watchMode, help, version };
}
function printHelp() {
    console.log(`groundwork — deterministic context-engineering detector

Usage:
  groundwork detect [path] [options]
  groundwork watch [path]
  groundwork list-rules
  groundwork skills update [options]
  groundwork --version
  groundwork --help

Commands:
  detect [path]       Scan a repo for context-engineering anti-patterns. Default: current directory.
  watch [path]        Watch the repo and re-detect on changes. Equivalent to: detect --watch.
  list-rules          List all detector rules with their IDs and descriptions.
  skills update       Update the installed groundwork skill to the latest version. See: groundwork skills --help.

Options:
  --json              Output JSON (default: human-readable).
  --format <fmt>      Output format: human | json.
  --fail-on <sev>     Exit code 1 if any finding at or above this severity. P0 (default) | P1 | P2.
  --only <ids>        Comma-separated list of rule IDs to run.
  --skip <ids>        Comma-separated list of rule IDs to skip.
  -w, --watch         Watch mode: re-run on changes.
  -h, --help          Show this help.
  -v, --version       Show version.

Examples:
  groundwork detect
  groundwork detect /path/to/repo --fail-on P1
  groundwork detect --json > findings.json
  groundwork detect --only stale-claude-md,secrets-regex
  groundwork watch
  groundwork skills update
`);
}
async function main() {
    // Special-case the `skills` namespace before generic flag parsing.
    // Lets `groundwork skills update [flags]` work without colliding with detect flags.
    if (process.argv[2] === 'skills') {
        const sub = process.argv[3];
        const rest = process.argv.slice(4);
        const { runSkillsUpdate, printSkillsHelp } = await import('./skills-update.js');
        if (!sub || sub === '--help' || sub === '-h') {
            printSkillsHelp();
            return;
        }
        if (sub === 'update') {
            process.exit(await runSkillsUpdate(rest));
        }
        console.error(`Unknown skills subcommand: ${sub}`);
        printSkillsHelp();
        process.exit(2);
    }
    const opts = parseArgs(process.argv);
    if (opts.help) {
        printHelp();
        return;
    }
    if (opts.version) {
        // Read version from package.json at runtime (avoids embedding).
        const fs = await import('node:fs/promises');
        const url = await import('node:url');
        const here = path.dirname(url.fileURLToPath(import.meta.url));
        try {
            const pkg = JSON.parse(await fs.readFile(path.join(here, '..', 'package.json'), 'utf8'));
            console.log(pkg.version);
        }
        catch {
            console.log('unknown');
        }
        return;
    }
    if (opts.command === 'list-rules') {
        for (const r of rules) {
            console.log(`${r.id.padEnd(32)} ${r.defaultSeverity}  ${r.description}`);
        }
        return;
    }
    if (opts.command === 'watch' || (opts.command === 'detect' && opts.watchMode)) {
        const { watch } = await import('./watch.js');
        await watch({ repoRoot: opts.repoRoot, only: opts.only, skip: opts.skip });
        return;
    }
    if (opts.command !== 'detect') {
        console.error(`Unknown command: ${opts.command}`);
        printHelp();
        process.exit(2);
    }
    const result = await run({
        repoRoot: opts.repoRoot,
        rules,
        only: opts.only,
        skip: opts.skip,
    });
    if (opts.format === 'json') {
        reportJson(result);
    }
    else {
        reportHuman(result);
    }
    process.exit(exitCodeFor(result, opts.failOn));
}
main().catch((err) => {
    console.error(err);
    process.exit(2);
});
//# sourceMappingURL=index.js.map