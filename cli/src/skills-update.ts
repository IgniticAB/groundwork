// Wrapper around `npx skills update` scoped to the groundwork skill.
// Friendly alias modeled on impeccable.style's `npx impeccable skills update`.
import { spawn } from 'node:child_process';

export async function runSkillsUpdate(extraArgs: string[]): Promise<number> {
  return new Promise((resolve) => {
    const args = ['skills', 'update', 'groundwork', ...extraArgs];
    const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error('groundwork: failed to run skills updater. Is npx installed?');
      console.error(err);
      resolve(2);
    });
  });
}

export function printSkillsHelp(): void {
  console.log(`groundwork skills — manage the installed groundwork skill

Usage:
  groundwork skills update [options]

Description:
  Update the installed groundwork skill to the latest version from GitHub.
  Wraps \`npx skills update groundwork\` so you don't have to remember the
  source path. Any extra flags are forwarded to the underlying updater.

Common options (forwarded):
  -g, --global        Only update the global install (~/.<harness>/skills/)
  -p, --project       Only update the project install (./.<harness>/skills/)
  -y, --yes           Skip the interactive scope prompt

Examples:
  groundwork skills update
  groundwork skills update -g
  groundwork skills update -y
`);
}
