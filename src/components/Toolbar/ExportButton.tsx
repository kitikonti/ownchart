/**
 * ExportButton - Toolbar button to open export dialog
 */

import { Export } from "@phosphor-icons/react";
import { useUIStore } from "../../store/slices/uiSlice";

export function ExportButton() {
  const openExportDialog = useUIStore((state) => state.openExportDialog);

  return (
    <button
      onClick={openExportDialog}
      className="p-1.5 rounded-md transition-colors text-slate-600 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      title="Export to PNG (Ctrl+E)"
      aria-label="Export to PNG"
    >
      <Export size={20} weight="regular" />
    </button>
  );
}
