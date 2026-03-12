/**
 * General-purpose string utilities for OwnChart.
 */

/**
 * Simple English pluralization: pluralize(3, "task") → "3 tasks"
 * Appends "s" when count !== 1.
 *
 * @param count - The numeric quantity to display and use for pluralization.
 * @param word  - The singular base word to pluralize (must form plural by appending "s").
 * @returns A string combining `count` and the correctly pluralized `word`.
 *
 * @remarks Only handles regular English pluralization (appends "s").
 *   Does not support irregular plurals (e.g. "child" → "children").
 *   Only use with words whose plural form is the base word + "s".
 */
export function pluralize(count: number, word: string): string {
  return `${count} ${word}${count !== 1 ? "s" : ""}`;
}
