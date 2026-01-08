/**
 * Filename sanitization utilities for export.
 */

/** Characters that are invalid in filenames across OS */
const INVALID_CHARS = /[/\\:*?"<>|]/g;

/** Maximum length for the project name part of the filename */
const MAX_NAME_LENGTH = 50;

/**
 * Sanitize a project name for use in a filename.
 * - Removes invalid characters (/ \ : * ? " < > |)
 * - Replaces whitespace with hyphens
 * - Collapses multiple hyphens into one
 * - Removes leading/trailing hyphens
 * - Truncates to 50 characters
 * - Preserves Unicode (umlauts, etc.)
 *
 * @param name - The project name to sanitize
 * @returns A safe filename string
 */
export function sanitizeFilename(name: string): string {
  if (!name || name.trim().length === 0) {
    return "untitled";
  }

  const sanitized = name
    .replace(INVALID_CHARS, "") // Remove invalid characters
    .replace(/\s+/g, "-") // Whitespace → hyphen
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .slice(0, MAX_NAME_LENGTH) // Truncate first
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens AFTER truncation

  return sanitized || "untitled"; // Ensure non-empty result
}
