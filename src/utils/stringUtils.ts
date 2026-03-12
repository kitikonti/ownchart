/**
 * General-purpose string utilities for OwnChart.
 */

/**
 * Simple English pluralization: pluralize(3, "task") → "3 tasks"
 * Appends "s" when count !== 1.
 *
 * @remarks Only handles regular English pluralization (appends "s").
 *   Does not support irregular plurals (e.g. "child" → "children").
 *   Only use with words whose plural form is the base word + "s".
 */
export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}
