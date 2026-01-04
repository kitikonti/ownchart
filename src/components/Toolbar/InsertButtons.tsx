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
    <div className="inline-flex items-center gap-1 border-r border-gray-200 pr-2">
      {/* Insert Above Button */}
      <button
        onClick={handleInsertAbove}
        disabled={!canInsert}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canInsert ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Insert task above"
        aria-label="Insert task above"
      >
        <RowsPlusTop size={18} weight="regular" className="text-gray-700" />
      </button>

      {/* Insert Below Button */}
      <button
        onClick={handleInsertBelow}
        disabled={!canInsert}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canInsert ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Insert task below"
        aria-label="Insert task below"
      >
        <RowsPlusBottom size={18} weight="regular" className="text-gray-700" />
      </button>
    </div>
  );
}
