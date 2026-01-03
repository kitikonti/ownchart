/**
 * Undo/Redo toolbar buttons
 * Provides visual controls for undo/redo operations
 */

import { ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';
import { useHistoryStore } from '../../store/slices/historySlice';

export function UndoRedoButtons() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) => state.getUndoDescription());
  const redoDescription = useHistoryStore((state) => state.getRedoDescription());

  return (
    <div className="flex gap-1">
      {/* Undo Button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
        aria-label={
          canUndo ? `Undo: ${undoDescription} (Ctrl+Z)` : 'Nothing to undo'
        }
        title={canUndo ? `Undo: ${undoDescription}` : 'Nothing to undo'}
      >
        <ArrowCounterClockwise size={18} weight="regular" />
      </button>

      {/* Redo Button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
        aria-label={
          canRedo ? `Redo: ${redoDescription} (Ctrl+Shift+Z)` : 'Nothing to redo'
        }
        title={canRedo ? `Redo: ${redoDescription}` : 'Nothing to redo'}
      >
        <ArrowClockwise size={18} weight="regular" />
      </button>
    </div>
  );
}
