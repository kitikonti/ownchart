/**
 * useRowSelectionHandler — encapsulates row-level selection logic for TaskTableRow.
 *
 * Handles three modifier modes:
 *  - Plain click         → single selection
 *  - Ctrl/Cmd + click   → toggle individual task
 *  - Shift + click       → contiguous range from last anchor
 *
 * Co-located in TaskList (not src/hooks) because it has a direct dependency on
 * dragSelectionState, which tracks the drag-select anchor within this folder.
 */

import { useCallback } from "react";
import type { TaskId } from "../../types/branded.types";
import { useTaskStore } from "../../store/slices/taskSlice";
import { dragState } from "./dragSelectionState";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseRowSelectionHandlerOptions {
  /**
   * Ordered list of currently visible (non-hidden) task IDs — used for range calculation.
   *
   * @important Callers should pass a stable (memoized) reference. A new array on every
   * render will cause `handleSelectRow` to be recreated via `useCallback`, even when
   * the task IDs themselves have not changed.
   */
  visibleTaskIds: TaskId[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * @returns `handleSelectRow` — stable callback (memoized via `useCallback`) that
 * applies the appropriate selection mutation based on modifier keys.
 */
export function useRowSelectionHandler({
  visibleTaskIds,
}: UseRowSelectionHandlerOptions): {
  handleSelectRow: (
    taskId: TaskId,
    shiftKey: boolean,
    ctrlKey: boolean
  ) => void;
} {
  const setActiveCell = useTaskStore((state) => state.setActiveCell);
  const setSelectedTaskIds = useTaskStore((state) => state.setSelectedTaskIds);
  const toggleTaskSelection = useTaskStore(
    (state) => state.toggleTaskSelection
  );

  const handleSelectRow = useCallback(
    (taskId: TaskId, shiftKey: boolean, ctrlKey: boolean): void => {
      // Selecting a row always clears any active cell edit
      setActiveCell(null, null);

      if (shiftKey) {
        // Prefer the drag-select start task as range anchor; fall back to the
        // last explicitly selected task. Read from getState() to avoid a
        // subscription that would cause unnecessary re-renders.
        const anchorTaskId =
          dragState.startTaskId || useTaskStore.getState().lastSelectedTaskId;

        if (anchorTaskId) {
          const startIdx = visibleTaskIds.indexOf(anchorTaskId);
          const endIdx = visibleTaskIds.indexOf(taskId);

          if (startIdx !== -1 && endIdx !== -1) {
            const minIdx = Math.min(startIdx, endIdx);
            const maxIdx = Math.max(startIdx, endIdx);
            setSelectedTaskIds(visibleTaskIds.slice(minIdx, maxIdx + 1), false);
          } else {
            // Anchor or target is no longer visible — fall back to single selection
            // to avoid a confusing no-op when the anchor was from a now-hidden task.
            setSelectedTaskIds([taskId], false);
          }
        } else {
          // No anchor yet — treat as plain single selection
          setSelectedTaskIds([taskId], false);
        }
      } else if (ctrlKey) {
        toggleTaskSelection(taskId);
      } else {
        setSelectedTaskIds([taskId], false);
      }
    },
    [visibleTaskIds, setActiveCell, setSelectedTaskIds, toggleTaskSelection]
  );

  return { handleSelectRow };
}
