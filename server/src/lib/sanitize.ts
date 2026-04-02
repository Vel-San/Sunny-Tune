/**
 * Strips C0 and C1 control characters from a string.
 *
 * Removed ranges:
 *   \x00–\x08  — NUL, SOH … BS  (keeps \x09 tab)
 *   \x0B–\x0C  — VT, FF         (keeps \x0A LF, \x0D CR)
 *   \x0E–\x1F  — SO … US
 *   \x7F       — DEL
 *   \x80–\x9F  — C1 controls
 *
 * Safe for all UTF-8 input — does not touch printable ASCII,
 * accented characters, or emoji.
 */
export function stripControlChars(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}
