/**
 * Export Dialog component for PNG export with options.
 */

import { useCallback, useMemo, useEffect } from "react";
import {
  Export,
  Spinner,
  Download,
  Warning,
  Info,
} from "@phosphor-icons/react";
import { EXPORT_MAX_SAFE_WIDTH } from "../../utils/export/types";
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

  // Get current app zoom level
  const currentAppZoom = useChartStore((state) => state.zoom);

  // Get scale and viewport for visible range calculation
  const scale = useChartStore((state) => state.scale);
  const viewportScrollLeft = useChartStore((state) => state.viewportScrollLeft);
  const viewportWidth = useChartStore((state) => state.viewportWidth);

  // Calculate project date range from tasks
  const projectDateRange = useMemo(() => {
    if (tasks.length === 0) return undefined;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const task of tasks) {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);

      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    }

    if (!minDate || !maxDate) return undefined;

    return { start: minDate, end: maxDate };
  }, [tasks]);

  // Calculate visible date range from viewport scroll position
  const visibleDateRange = useMemo(() => {
    if (!scale || viewportWidth === 0) return undefined;

    // Convert pixel positions to dates using scale
    const pixelsPerDay = scale.pixelsPerDay;
    const scaleStartDate = new Date(scale.minDate);

    // Calculate start date from scroll position
    const startDaysOffset = viewportScrollLeft / pixelsPerDay;
    const visibleStartDate = new Date(scaleStartDate);
    visibleStartDate.setDate(
      visibleStartDate.getDate() + Math.floor(startDaysOffset)
    );

    // Calculate end date from scroll position + viewport width
    const endDaysOffset = (viewportScrollLeft + viewportWidth) / pixelsPerDay;
    const visibleEndDate = new Date(scaleStartDate);
    visibleEndDate.setDate(visibleEndDate.getDate() + Math.ceil(endDaysOffset));

    return {
      start: visibleStartDate,
      end: visibleEndDate,
    };
  }, [scale, viewportScrollLeft, viewportWidth]);

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
    return calculateExportDimensions(
      tasks,
      exportOptions,
      columnWidths,
      currentAppZoom,
      projectDateRange,
      visibleDateRange
    );
  }, [
    tasks,
    exportOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  ]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      await exportToPng({
        tasks,
        options: exportOptions,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
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
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    closeExportDialog,
    setIsExporting,
    setExportError,
  ]);

  // Determine warning state for dimensions
  const hasWarning = estimatedDimensions.width > EXPORT_MAX_SAFE_WIDTH;
  const hasInfo =
    estimatedDimensions.width > 4000 &&
    estimatedDimensions.width <= EXPORT_MAX_SAFE_WIDTH;

  const footer = (
    <div className="flex items-center justify-between w-full gap-4">
      {/* Export Size - Always visible */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-lg font-bold font-mono tabular-nums ${hasWarning ? "text-amber-700" : "text-slate-800"}`}
          >
            {estimatedDimensions.width.toLocaleString()}
          </span>
          <span className="text-slate-400">×</span>
          <span
            className={`text-lg font-bold font-mono tabular-nums ${hasWarning ? "text-amber-700" : "text-slate-800"}`}
          >
            {estimatedDimensions.height.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 ml-0.5">px</span>
        </div>
        {/* Warning/Info icon */}
        {hasWarning && (
          <div
            className="p-1 bg-amber-100 rounded-full text-amber-600"
            title={`Export width exceeds ${EXPORT_MAX_SAFE_WIDTH.toLocaleString()}px. Some browsers may have trouble rendering.`}
          >
            <Warning size={14} weight="bold" />
          </div>
        )}
        {hasInfo && (
          <div
            className="p-1 bg-slate-100 rounded-full text-slate-500"
            title="Large export. Generation may take a moment."
          >
            <Info size={14} weight="bold" />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={closeExportDialog}
          disabled={isExporting}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-xs"
        >
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600 active:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isExportDialogOpen}
      onClose={closeExportDialog}
      title="Export to PNG"
      icon={<Export size={24} weight="duotone" className="text-slate-500" />}
      footer={footer}
      widthClass="max-w-xl"
    >
      <div className="space-y-6">
        {/* Export options */}
        <ExportOptionsForm
          options={exportOptions}
          onChange={setExportOptions}
          currentAppZoom={currentAppZoom}
          projectDateRange={projectDateRange}
          visibleDateRange={visibleDateRange}
          columnWidths={columnWidths}
        />

        {/* Error message */}
        {exportError && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            {exportError}
          </div>
        )}
      </div>
    </Modal>
  );
}
