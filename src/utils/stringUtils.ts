/**
 * General-purpose string utilities for OwnChart.
 */

/**
 * Simple English pluralization: pluralize(3, "task") → "3 tasks"
 * Appends "s" when count !== 1.
 */
export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}
