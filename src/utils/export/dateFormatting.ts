/**
 * Date formatting utilities for the export UI.
 * These are pure functions with no side effects — used to display
 * date ranges in export option dialogs.
 */

/**
 * Format a Date as YYYY-MM-DD using local date parts.
 * Deliberately uses local time (not UTC) so the displayed date matches
 * what the user sees in the app, regardless of their timezone offset.
 *
 * @returns ISO-formatted date string, or "" if date is undefined or invalid
 *   (e.g. `new Date("not-a-date")`).
 */
export function formatDate(date: Date | undefined): string {
  if (!date || isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a date range as "YYYY-MM-DD – YYYY-MM-DD".
 * Uses an en-dash (–) separator, matching standard date range typography.
 *
 * @param range - The date range to format. `range.start` must be ≤ `range.end`
 *   (see @remarks for precondition details).
 * @returns Formatted date range string, e.g. `"2025-01-01 – 2025-12-31"`.
 *
 * @remarks **Precondition**: `range.start` must be ≤ `range.end`. No validation
 * is performed; an inverted range will produce an inverted string without error.
 * A `console.warn` is emitted in development builds (`import.meta.env.DEV`) when
 * the precondition is violated, but no warning is issued in production.
 */
export function formatDateRange(range: { start: Date; end: Date }): string {
  if (import.meta.env.DEV && range.start > range.end) {
    console.warn(
      `formatDateRange: range.start is after range.end — inverted range: ${formatDate(range.start)} – ${formatDate(range.end)}`
    );
  }
  return `${formatDate(range.start)} – ${formatDate(range.end)}`;
}
