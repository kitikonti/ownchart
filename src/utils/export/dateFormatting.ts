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
 * @returns ISO-formatted date string, or "" if date is undefined.
 */
export function formatDate(date: Date | undefined): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a date range as "YYYY-MM-DD – YYYY-MM-DD".
 * Uses an en-dash (–) separator, matching standard date range typography.
 */
export function formatDateRange(range: { start: Date; end: Date }): string {
  return `${formatDate(range.start)} – ${formatDate(range.end)}`;
}
