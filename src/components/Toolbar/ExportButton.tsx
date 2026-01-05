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
      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-700"
      title="Export to PNG (Ctrl+E)"
      aria-label="Export to PNG"
    >
      <Export size={18} weight="regular" />
    </button>
  );
}
