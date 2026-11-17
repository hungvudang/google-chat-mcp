/**
 * String helpers used across layers.
 */

/**
 * Whether `value` is missing, empty or only whitespace.
 *
 * @param value - String to check.
 * @returns `true` when there is nothing visible.
 */
export function blank(value: string | null | undefined): boolean {
  return value === null || value === undefined || trim(value).length === 0;
}

export function trim(value: string): string {
  return value.trim();
}

export function lowercase(value: string): string {
  return value.toLowerCase();
}

/** Swaps every `search` in `value`, not only the first one. */
export function replace(value: string, search: string, replacement: string): string {
  return value.replaceAll(search, replacement);
}

export function startsWith(value: string, prefix: string): boolean {
  return value.startsWith(prefix);
}

/**
 * `value` without `prefix` at its beginning, or `value` unchanged when it does not begin with it.
 *
 * @param value - String to cut.
 * @param prefix - Beginning to remove.
 * @returns What follows the prefix.
 */
export function withoutPrefix(value: string, prefix: string): string {
  if (!startsWith(value, prefix)) {
    return value;
  }
  return value.slice(prefix.length);
}

/**
 * Size of `value` in UTF-8 bytes.
 *
 * @param value - String to measure.
 * @returns The byte count.
 */
export function byteLength(value: string): number {
  return Buffer.byteLength(value, 'utf8');
}

/**
 * `value` itself, or `undefined` when it is a blank string, so blank input counts as missing.
 *
 * @param value - Value to look at.
 * @returns The value, or `undefined` when there is nothing visible in it.
 */
export function presence<T>(value: T): T | undefined {
  if (typeof value === 'string' && blank(value)) {
    return undefined;
  }
  return value;
}
