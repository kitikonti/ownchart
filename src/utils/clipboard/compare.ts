/**
 * Comparison utilities for clipboard data.
 * Pure functions that compare clipboard contents to detect duplicates or
 * determine whether system and internal clipboards hold the same data.
 */

import type { TaskId } from "../../types/branded.types";

/**
 * Returns true if two task arrays represent the same ordered sequence of IDs.
 * Used to detect when the system clipboard holds data already present in the
 * internal clipboard, preventing accidental double-paste across tabs.
 *
 * @param a - First task array (order-sensitive comparison).
 * @param b - Second task array.
 * @returns `true` when both arrays have the same length and every ID matches
 *   positionally, `false` otherwise.
 *
 * @example
 * // NOTE: `id` values must be branded TaskId; plain strings are used here for brevity.
 * const t1 = 't1' as TaskId;
 * const t2 = 't2' as TaskId;
 * hasSameTaskIds([{ id: t1 }], [{ id: t1 }]); // true
 * hasSameTaskIds([{ id: t1 }], [{ id: t2 }]); // false
 * hasSameTaskIds([{ id: t1 }, { id: t2 }], [{ id: t1 }]); // false
 */
export function hasSameTaskIds(
  a: readonly { id: TaskId }[],
  b: readonly { id: TaskId }[]
): boolean {
  return a.length === b.length && a.every((item, i) => item.id === b[i].id);
}
