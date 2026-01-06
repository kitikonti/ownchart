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
    <div className="inline-flex items-center gap-0.5">
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        disabled={!canCopyOrCut}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canCopyOrCut
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Copy (Ctrl+C)"
        aria-label="Copy"
      >
        <Copy size={20} weight="regular" />
      </button>

      {/* Cut Button */}
      <button
        onClick={handleCut}
        disabled={!canCopyOrCut}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canCopyOrCut
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Cut (Ctrl+X)"
        aria-label="Cut"
      >
        <Scissors size={20} weight="regular" />
      </button>

      {/* Paste Button */}
      <button
        onClick={handlePaste}
        disabled={!canPaste}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canPaste
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Paste (Ctrl+V)"
        aria-label="Paste"
      >
        <ClipboardText size={20} weight="regular" />
      </button>

      {/* Delete Button */}
      <button
        onClick={deleteSelectedTasks}
        disabled={!canDelete}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canDelete
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Delete (Del)"
        aria-label="Delete"
      >
        <Trash size={20} weight="regular" />
      </button>
    </div>
  );
}
