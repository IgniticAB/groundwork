// Inline ignore directive support.
// A finding on line N is suppressed if line N OR line N-1 (1-indexed) contains "ce-ignore"
// in any comment style. Case-insensitive. Designed to behave like eslint-disable-next-line.
/** Returns true if line `oneIndexedLine` in `body` should be ignored. */
export function isIgnored(body, oneIndexedLine) {
    const lines = body.split('\n');
    if (oneIndexedLine < 1 || oneIndexedLine > lines.length)
        return false;
    const current = lines[oneIndexedLine - 1] ?? '';
    const above = lines[oneIndexedLine - 2] ?? '';
    return /\bce-ignore\b/i.test(current) || /\bce-ignore\b/i.test(above);
}
/** True if the whole file opts out via "ce-ignore-file" in its first 5 lines. */
export function isFileIgnored(body) {
    const head = body.split('\n').slice(0, 5).join('\n');
    return /\bce-ignore-file\b/i.test(head);
}
//# sourceMappingURL=ignores.js.map