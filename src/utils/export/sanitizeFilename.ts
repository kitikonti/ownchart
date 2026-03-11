/**
 * Filename sanitization utilities for export.
 */

/**
 * Characters that are invalid in filenames across OS.
 *
 * SAFETY NOTE: This regex carries the `g` flag (required so `.replace()` removes
 * ALL occurrences in a single pass).  The `g` flag makes the RegExp stateful —
 * `lastIndex` advances after each `.test()` or `.exec()` call.  This constant
 * is ONLY used with `.replace()`, which always resets `lastIndex` before the
 * substitution and is therefore safe.  Do NOT use this constant with `.test()`
 * or `.exec()` — create a new non-`g` regex or use `.replace()` instead.
 */
const INVALID_CHARS = /[/\\:*?"<>|]/g;

/**
 * Non-whitespace control characters (Unicode Cc, excluding \t \n \r \v \f) —
 * invalid in filenames on all major OSes.
 * Whitespace control characters (\t, \n, \r, etc.) are intentionally excluded
 * here because they are handled by the `\s+` → `-` step that runs first;
 * stripping them here would suppress the hyphen conversion.
 * Using \p{Cc} with the /u flag avoids the no-control-regex ESLint rule.
 *
 * Same `g`-flag safety note as INVALID_CHARS above: use only with `.replace()`.
 */
const CONTROL_CHARS = /(?!\s)\p{Cc}/gu;

/**
 * Windows reserved device names that cannot be used as filenames (with or
 * without an extension) on Windows, even when the application runs on macOS
 * or Linux but the file is later opened on Windows.
 * See: https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
 *
 * No `g` flag — this regex is used exclusively with `.test()`, which is safe
 * for non-global regexes (no `lastIndex` drift).
 */
const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

/**
 * Maximum length for the project name part of the filename.
 * 50 characters keeps filenames short and readable while staying
 * well within OS path-length limits (Windows MAX_PATH = 260).
 * Exported so UI input fields can enforce the same limit.
 */
export const MAX_NAME_LENGTH = 50;

/**
 * Sanitize a project name for use in a filename.
 * - Replaces whitespace (including \t, \n) with hyphens
 * - Removes non-whitespace control characters (U+0000–U+001F minus whitespace)
 * - Removes invalid characters (/ \ : * ? " < > |)
 * - Collapses multiple hyphens into one
 * - Removes leading/trailing hyphens
 * - Truncates to {@link MAX_NAME_LENGTH} characters
 * - Rejects dot-only names (".", "..") — reserved on UNIX/Windows
 * - Rejects Windows reserved device names (CON, NUL, COM1, …)
 * - Preserves Unicode (umlauts, etc.)
 *
 * @param name - The project name to sanitize
 * @returns A safe filename string (never empty; falls back to "untitled")
 */
export function sanitizeFilename(name: string): string {
  if (!name || name.trim().length === 0) {
    return "untitled";
  }

  const sanitized = name
    .replace(/\s+/g, "-") // Whitespace (incl. \t, \n) → hyphen (before control-char strip)
    .replace(CONTROL_CHARS, "") // Remove remaining non-whitespace control characters
    .replace(INVALID_CHARS, "") // Remove invalid characters
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .slice(0, MAX_NAME_LENGTH) // Truncate first
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens AFTER truncation

  // Reject dot-only results (e.g. ".", "..") — reserved names on UNIX/Windows.
  if (!sanitized || /^\.+$/.test(sanitized)) {
    return "untitled";
  }

  // Reject Windows reserved device names (CON, NUL, COM1, LPT1, …).
  // These are invalid as filenames on Windows even with an extension appended.
  if (WINDOWS_RESERVED_NAMES.test(sanitized)) {
    return "untitled";
  }

  return sanitized;
}
