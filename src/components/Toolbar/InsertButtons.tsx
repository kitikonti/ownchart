/**
 * InsertButtons - Insert task above/below buttons for the toolbar
 * Disabled when no single task is selected
 */

import { RowsPlusTop, RowsPlusBottom } from "@phosphor-icons/react";
import { useTaskStore } from "../../store/slices/taskSlice";

export function InsertButtons() {
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);

  // Get the single selected task ID (from selection or active cell)
  const getSingleSelectedTaskId = (): string | null => {
    // If exactly one task is selected via checkbox, use that
    if (selectedTaskIds.length === 1) {
      return selectedTaskIds[0];
    }
    // If no checkbox selection but a cell is active, use that task
    if (selectedTaskIds.length === 0 && activeCell.taskId) {
      return activeCell.taskId;
    }
    return null;
  };

  const singleTaskId = getSingleSelectedTaskId();
  const canInsert = singleTaskId !== null;

  const handleInsertAbove = () => {
    if (singleTaskId) {
      insertTaskAbove(singleTaskId);
    }
  };

  const handleInsertBelow = () => {
    if (singleTaskId) {
      insertTaskBelow(singleTaskId);
    }
  };

  return (
    <div className="inline-flex items-center gap-0.5">
      {/* Insert Above Button */}
      <button
        onClick={handleInsertAbove}
        disabled={!canInsert}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canInsert
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Insert task above"
        aria-label="Insert task above"
      >
        <RowsPlusTop size={20} weight="regular" />
      </button>

      {/* Insert Below Button */}
      <button
        onClick={handleInsertBelow}
        disabled={!canInsert}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canInsert
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Insert task below"
        aria-label="Insert task below"
      >
        <RowsPlusBottom size={20} weight="regular" />
      </button>
    </div>
  );
}
