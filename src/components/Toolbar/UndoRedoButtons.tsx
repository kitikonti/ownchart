/**
 * Undo/Redo toolbar buttons
 * Provides visual controls for undo/redo operations
 */

import { ArrowCounterClockwise, ArrowClockwise } from "@phosphor-icons/react";
import { useHistoryStore } from "../../store/slices/historySlice";

export function UndoRedoButtons() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) =>
    state.getUndoDescription()
  );
  const redoDescription = useHistoryStore((state) =>
    state.getRedoDescription()
  );

  return (
    <div className="flex gap-1">
      {/* Undo Button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canUndo
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        aria-label={
          canUndo ? `Undo: ${undoDescription} (Ctrl+Z)` : "Nothing to undo"
        }
        title={canUndo ? `Undo: ${undoDescription}` : "Nothing to undo"}
      >
        <ArrowCounterClockwise size={20} weight="regular" />
      </button>

      {/* Redo Button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          !canRedo
            ? "text-slate-400 cursor-not-allowed"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        aria-label={
          canRedo
            ? `Redo: ${redoDescription} (Ctrl+Shift+Z)`
            : "Nothing to redo"
        }
        title={canRedo ? `Redo: ${redoDescription}` : "Nothing to redo"}
      >
        <ArrowClockwise size={20} weight="regular" />
      </button>
    </div>
  );
}
