/**
 * FileButtons - New/Open/Save file operations toolbar buttons
 */

import { File, FolderOpen, FloppyDisk } from "@phosphor-icons/react";
import { useFileOperations } from "../../hooks/useFileOperations";

export function FileButtons() {
  const { handleNew, handleOpen, handleSave, isDirty } = useFileOperations();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleNew}
        className="p-1.5 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        title="New Chart (Ctrl+Alt+N)"
        aria-label="New Chart"
      >
        <File size={20} weight="regular" />
      </button>

      <button
        onClick={handleOpen}
        className="p-1.5 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400 transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        title="Open File (Ctrl+O)"
        aria-label="Open File"
      >
        <FolderOpen size={20} weight="regular" />
      </button>

      <button
        onClick={() => handleSave()}
        className={`p-1.5 rounded-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
          isDirty
            ? "text-slate-800 bg-slate-100"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200"
        }`}
        title="Save (Ctrl+S)"
        aria-label="Save File"
      >
        <FloppyDisk size={20} weight={isDirty ? "fill" : "regular"} />
      </button>
    </div>
  );
}
