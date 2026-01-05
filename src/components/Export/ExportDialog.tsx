/**
 * Export Dialog component for PNG export with options.
 */

import { useState, useCallback } from "react";
import { Export, Spinner, Download } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { ExportOptionsForm } from "./ExportOptions";
import { useUIStore } from "../../store/slices/uiSlice";
import { exportToPng, EXPORT_WIDTH_PRESETS } from "../../utils/export";
import type { ExportWidthPreset } from "../../utils/export/types";

/**
 * Determine which preset matches the given width, or "custom" if none match.
 */
function getPresetForWidth(width: number): ExportWidthPreset | "custom" {
  for (const [key, value] of Object.entries(EXPORT_WIDTH_PRESETS)) {
    if (value === width) {
      return key as ExportWidthPreset;
    }
  }
  return "custom";
}

/**
 * Export Dialog component.
 */
export function ExportDialog(): JSX.Element | null {
  const {
    isExportDialogOpen,
    exportOptions,
    isExporting,
    exportError,
    closeExportDialog,
    setExportOptions,
    setIsExporting,
    setExportError,
  } = useUIStore();

  const [customWidth, setCustomWidth] = useState(
    exportOptions.width.toString()
  );
  const [selectedPreset, setSelectedPreset] = useState<
    ExportWidthPreset | "custom"
  >(() => getPresetForWidth(exportOptions.width));

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      await exportToPng(exportOptions);
      closeExportDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      setExportError(message);
    }
  }, [exportOptions, closeExportDialog, setIsExporting, setExportError]);

  const handlePresetChange = useCallback(
    (preset: string | "custom") => {
      setSelectedPreset(preset as ExportWidthPreset | "custom");
      if (preset !== "custom") {
        const width =
          EXPORT_WIDTH_PRESETS[preset as keyof typeof EXPORT_WIDTH_PRESETS];
        setCustomWidth(width.toString());
      }
    },
    []
  );

  const handleCustomWidthChange = useCallback((value: string) => {
    setCustomWidth(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedPreset("custom");
    }
  }, []);

  const footer = (
    <>
      <button
        onClick={closeExportDialog}
        disabled={isExporting}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <>
            <Spinner size={16} className="animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download size={16} weight="bold" />
            Export PNG
          </>
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isExportDialogOpen}
      onClose={closeExportDialog}
      title="Export to PNG"
      icon={<Export size={24} weight="duotone" className="text-blue-600" />}
      footer={footer}
      widthClass="max-w-md"
    >
      <div className="space-y-6">
        {/* Preview placeholder */}
        <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-500 border border-gray-200">
          <div className="h-32 flex items-center justify-center">
            <span>
              Export will capture the current chart view at {exportOptions.width}
              px width
            </span>
          </div>
        </div>

        {/* Export options */}
        <ExportOptionsForm
          options={exportOptions}
          onChange={setExportOptions}
          customWidth={customWidth}
          onCustomWidthChange={handleCustomWidthChange}
          selectedPreset={selectedPreset}
          onPresetChange={handlePresetChange}
        />

        {/* Error message */}
        {exportError && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
            {exportError}
          </div>
        )}
      </div>
    </Modal>
  );
}
