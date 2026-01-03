/**
 * FileButtons - New/Open/Save file operations toolbar buttons
 */

import { File, FolderOpen, FloppyDisk } from '@phosphor-icons/react';
import { useFileOperations } from '../../hooks/useFileOperations';

export function FileButtons() {
  const { handleNew, handleOpen, handleSave, isDirty } = useFileOperations();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleNew}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
        title="New Chart (Ctrl+Alt+N)"
        aria-label="New Chart"
      >
        <File size={18} weight="regular" />
      </button>

      <button
        onClick={handleOpen}
        className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
        title="Open File (Ctrl+O)"
        aria-label="Open File"
      >
        <FolderOpen size={18} weight="regular" />
      </button>

      <button
        onClick={() => handleSave()}
        className={`p-1.5 rounded transition-colors ${
          isDirty
            ? 'text-blue-600 hover:bg-blue-50'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        title="Save (Ctrl+S)"
        aria-label="Save File"
      >
        <FloppyDisk size={18} weight={isDirty ? 'fill' : 'regular'} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />
    </div>
  );
}
