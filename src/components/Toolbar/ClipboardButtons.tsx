/**
 * ClipboardButtons - Copy/Cut/Paste/Delete buttons for the toolbar
 * Supports both row-level and cell-level operations
 */

import { Copy, Scissors, ClipboardText, Trash } from "@phosphor-icons/react";
import { useClipboardOperations } from "../../hooks/useClipboardOperations";
import { useTaskStore } from "../../store/slices/taskSlice";

export function ClipboardButtons() {
  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);

  const canDelete = selectedTaskIds.length > 0;

  return (
    <div className="inline-flex items-center gap-1 border-r border-gray-200 pr-2">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        disabled={!canCopyOrCut}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canCopyOrCut ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Copy (Ctrl+C)"
        aria-label="Copy"
      >
        <Copy size={18} weight="regular" className="text-gray-700" />
      </button>

      {/* Cut Button */}
      <button
        onClick={handleCut}
        disabled={!canCopyOrCut}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canCopyOrCut ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Cut (Ctrl+X)"
        aria-label="Cut"
      >
        <Scissors size={18} weight="regular" className="text-gray-700" />
      </button>

      {/* Paste Button */}
      <button
        onClick={handlePaste}
        disabled={!canPaste}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canPaste ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Paste (Ctrl+V)"
        aria-label="Paste"
      >
        <ClipboardText size={18} weight="regular" className="text-gray-700" />
      </button>

      {/* Delete Button */}
      <button
        onClick={deleteSelectedTasks}
        disabled={!canDelete}
        className={`p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          !canDelete ? "opacity-40 cursor-not-allowed" : ""
        }`}
        title="Delete (Del)"
        aria-label="Delete"
      >
        <Trash size={18} weight="regular" className="text-gray-700" />
      </button>
    </div>
  );
}
