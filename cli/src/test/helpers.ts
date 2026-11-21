// Shared fixtures for rule tests. A rule takes a RuleContext and nothing else,
// so a test context is just an in-memory file map — no temp directories, no
// git, no I/O.
import type { RuleContext } from '../types.js';

export function contextWith(
  files: Record<string, string>,
  opts: { hasGit?: boolean; includeInstalled?: boolean } = {},
): RuleContext {
  const paths = Object.keys(files);
  return {
    repoRoot: '/fixture',
    hasGit: opts.hasGit ?? false,
    includeInstalled: opts.includeInstalled ?? false,
    readFile: async (p) => (p in files ? files[p] : null),
    glob: async (patterns) => {
      const list = Array.isArray(patterns) ? patterns : [patterns];
      return paths.filter((p) => list.some((pattern) => matches(pattern, p)));
    },
  };
}

/**
 * Minimal glob matcher: enough for the patterns the rules actually use
 * (`**` across directories, `*` within one segment). Kept deliberately small —
 * a test helper that needs its own tests is the wrong helper.
 */
function matches(pattern: string, filePath: string): boolean {
  const re = new RegExp(
    '^' +
      pattern
        .split(/(\*\*\/|\*\*|\*|\?|\.)/)
        .map((part) => {
          if (part === '**/') return '(?:[^/]+/)*';
          if (part === '**') return '.*';
          if (part === '*') return '[^/]*';
          if (part === '?') return '[^/]';
          if (part === '.') return '\\.';
          return part.replace(/[+^${}()|[\]\\]/g, '\\$&');
        })
        .join('') +
      '$',
  );
  return re.test(filePath);
}
