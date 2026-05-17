const rawBase = import.meta.env.BASE_URL;
const base = rawBase.endsWith('/') ? rawBase : rawBase + '/';

export function url(path: string = ''): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('#')) return path;
  const trimmed = path.replace(/^\/+/, '');
  return base + trimmed;
}

export function isActive(currentPath: string, target: string): boolean {
  const a = currentPath.replace(/\/+$/, '');
  const b = url(target).replace(/\/+$/, '');
  if (b === base.replace(/\/+$/, '')) return a === b;
  return a === b || a.startsWith(b + '/');
}

export { base };
