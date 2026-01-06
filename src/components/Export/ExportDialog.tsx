/**
 * Export Dialog component for PNG export with options.
 */

import { useCallback, useMemo, useEffect } from "react";
import { Export, Spinner, Download } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { ExportOptionsForm } from "./ExportOptions";
import { useUIStore } from "../../store/slices/uiSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { exportToPng, calculateExportDimensions } from "../../utils/export";

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

  // Get tasks from store
  const tasks = useTaskStore((state) => state.tasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);

  // Get chart settings for default values
  const showHolidays = useChartStore((state) => state.showHolidays);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);

  // Sync export options with chart settings when dialog opens
  useEffect(() => {
    if (isExportDialogOpen) {
      setExportOptions({
        includeHolidays: showHolidays,
        taskLabelPosition: taskLabelPosition,
      });
    }
  }, [isExportDialogOpen, showHolidays, taskLabelPosition, setExportOptions]);

  // Calculate estimated dimensions
  const estimatedDimensions = useMemo(() => {
    return calculateExportDimensions(tasks, exportOptions, columnWidths);
  }, [tasks, exportOptions, columnWidths]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      await exportToPng({
        tasks,
        options: exportOptions,
        columnWidths,
      });
      closeExportDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      setExportError(message);
    }
  }, [
    tasks,
    exportOptions,
    columnWidths,
    closeExportDialog,
    setIsExporting,
    setExportError,
  ]);

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
        {/* Export options */}
        <ExportOptionsForm
          options={exportOptions}
          onChange={setExportOptions}
          estimatedDimensions={estimatedDimensions}
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
