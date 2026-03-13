/**
 * useIsPlaceholderSelected — focused Zustand selector for placeholder row selection.
 *
 * Returns true only when the placeholder row is in the selection set.
 * Because the selector returns a primitive boolean, Zustand skips re-renders
 * when the selection set changes without affecting the placeholder row.
 */

import { useTaskStore } from "@/store/slices/taskSlice";
import { PLACEHOLDER_TASK_ID } from "@/config/placeholderRow";

/** Focused selector — only re-renders when the placeholder's selection state changes. */
export function useIsPlaceholderSelected(): boolean {
  // selectedTaskIds is typically small (bounded by the number of selected tasks),
  // so Array.includes is fast enough here. The store intentionally uses an array
  // (not a Set) to maintain insertion order for multi-select operations.
  return useTaskStore((s) => s.selectedTaskIds.includes(PLACEHOLDER_TASK_ID));
}
