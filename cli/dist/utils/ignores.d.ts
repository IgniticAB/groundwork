/** Returns true if line `oneIndexedLine` in `body` should be ignored. */
export declare function isIgnored(body: string, oneIndexedLine: number): boolean;
/** True if the whole file opts out via "ce-ignore-file" in its first 5 lines. */
export declare function isFileIgnored(body: string): boolean;
