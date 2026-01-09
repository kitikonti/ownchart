/**
 * Export Dialog component for PNG, PDF, and SVG export with options.
 */

import { useCallback, useMemo, useEffect } from "react";
import {
  Export,
  Spinner,
  Download,
  Warning,
  Info,
  FilePdf,
  FileCode,
  Image,
  ChartBar,
} from "@phosphor-icons/react";
import { EXPORT_MAX_SAFE_WIDTH } from "../../utils/export/types";
import type { ExportFormat } from "../../utils/export/types";
import { Modal } from "../common/Modal";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { SharedExportOptions } from "./SharedExportOptions";
import { PngScaleOptions } from "./PngScaleOptions";
import { PdfExportOptions } from "./PdfExportOptions";
import { SvgExportOptions } from "./SvgExportOptions";
import { useUIStore } from "../../store/slices/uiSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useFileStore } from "../../store/slices/fileSlice";
import { useDependencyStore } from "../../store/slices/dependencySlice";
import {
  exportToPng,
  calculateExportDimensions,
  calculateTaskTableWidth,
  calculateDurationDays,
} from "../../utils/export";

/**
 * Export Dialog component.
 */
export function ExportDialog(): JSX.Element | null {
  const {
    isExportDialogOpen,
    selectedExportFormat,
    exportOptions,
    pdfExportOptions,
    svgExportOptions,
    isExporting,
    exportProgress,
    exportError,
    closeExportDialog,
    setExportFormat,
    setExportOptions,
    setPdfExportOptions,
    setSvgExportOptions,
    setIsExporting,
    setExportProgress,
    setExportError,
  } = useUIStore();

  // Get tasks from store
  const tasks = useTaskStore((state) => state.tasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);

  // Get chart settings for default values
  const showHolidays = useChartStore((state) => state.showHolidays);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);

  // Get project name for export filename
  const fileName = useFileStore((state) => state.fileName);
  const projectName = fileName?.replace(".ownchart", "") || undefined;

  // Get dependencies for export
  const dependencies = useDependencyStore((state) => state.dependencies);

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

  // Calculate project duration in days (for PNG scale options)
  const projectDurationDays = useMemo(() => {
    if (!projectDateRange) return 365;
    return calculateDurationDays({
      min: projectDateRange.start.toISOString().split("T")[0],
      max: projectDateRange.end.toISOString().split("T")[0],
    });
  }, [projectDateRange]);

  // Calculate task table width from selected columns (for PNG scale options)
  const taskTableWidth = useMemo(
    () =>
      calculateTaskTableWidth(
        exportOptions.selectedColumns,
        columnWidths,
        exportOptions.density
      ),
    [exportOptions.selectedColumns, columnWidths, exportOptions.density]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    setExportProgress(0);

    try {
      if (selectedExportFormat === "png") {
        await exportToPng({
          tasks,
          options: exportOptions,
          columnWidths,
          currentAppZoom,
          projectDateRange,
          visibleDateRange,
          projectName,
        });
      } else if (selectedExportFormat === "pdf") {
        // Lazy load PDF export module
        const { exportToPdf } = await import("../../utils/export/pdfExport");
        await exportToPdf({
          tasks,
          dependencies,
          scale,
          options: exportOptions,
          pdfOptions: pdfExportOptions,
          columnWidths,
          currentAppZoom,
          projectDateRange,
          visibleDateRange,
          projectName,
          onProgress: setExportProgress,
        });
      } else if (selectedExportFormat === "svg") {
        // Lazy load SVG export module
        const { exportToSvg } = await import("../../utils/export/svgExport");
        await exportToSvg({
          tasks,
          options: exportOptions,
          svgOptions: svgExportOptions,
          columnWidths,
          currentAppZoom,
          projectDateRange,
          visibleDateRange,
          projectName,
          onProgress: setExportProgress,
        });
      }
      closeExportDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      setExportError(message);
    }
  }, [
    selectedExportFormat,
    tasks,
    dependencies,
    scale,
    exportOptions,
    pdfExportOptions,
    svgExportOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    projectName,
    closeExportDialog,
    setIsExporting,
    setExportProgress,
    setExportError,
  ]);

  // Determine warning state for dimensions (for PNG and SVG)
  const showDimensions =
    selectedExportFormat === "png" || selectedExportFormat === "svg";
  const hasWarning =
    selectedExportFormat === "png" &&
    estimatedDimensions.width > EXPORT_MAX_SAFE_WIDTH;
  const hasInfo =
    selectedExportFormat === "png" &&
    estimatedDimensions.width > 4000 &&
    estimatedDimensions.width <= EXPORT_MAX_SAFE_WIDTH;

  // Format-specific button config (unified teal color for all formats)
  const formatConfig: Record<
    ExportFormat,
    { icon: typeof Download; label: string; color: string }
  > = {
    png: {
      icon: Image,
      label: "Export PNG",
      color: "bg-teal-600 hover:bg-teal-500",
    },
    pdf: {
      icon: FilePdf,
      label: "Export PDF",
      color: "bg-teal-600 hover:bg-teal-500",
    },
    svg: {
      icon: FileCode,
      label: "Export SVG",
      color: "bg-teal-600 hover:bg-teal-500",
    },
  };

  const currentFormat = formatConfig[selectedExportFormat];
  const FormatIcon = currentFormat.icon;

  const footer = (
    <div className="flex items-center justify-between w-full gap-4">
      {/* Export Size - Show for PNG and SVG */}
      <div className="flex items-center gap-3 min-w-0">
        {showDimensions ? (
          <>
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
            {/* Warning/Info icon (PNG only) */}
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
          </>
        ) : (
          // Progress bar for PDF export
          isExporting &&
          exportProgress > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-600 transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {exportProgress}%
              </span>
            </div>
          )
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
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${currentFormat.color}`}
        >
          {isExporting ? (
            <>
              <Spinner size={16} className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FormatIcon size={16} weight="bold" />
              {currentFormat.label}
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Dynamic title based on format
  const dialogTitles: Record<ExportFormat, string> = {
    png: "Export Chart",
    pdf: "Export Chart",
    svg: "Export Chart",
  };

  return (
    <Modal
      isOpen={isExportDialogOpen}
      onClose={closeExportDialog}
      title={dialogTitles[selectedExportFormat]}
      icon={<Export size={24} weight="duotone" className="text-slate-500" />}
      footer={footer}
      widthClass="max-w-xl"
    >
      <div className="space-y-5">
        {/* Format Selector */}
        <ExportFormatSelector
          selectedFormat={selectedExportFormat}
          onFormatChange={setExportFormat}
        />

        {/* Format-specific Options Panel */}
        <div className="relative p-4 rounded-xl border border-slate-200 overflow-hidden">
          {/* Teal accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
          {/* Panel Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            {selectedExportFormat === "png" && (
              <>
                <Image size={18} weight="duotone" className="text-teal-600" />
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  PNG Settings
                </span>
              </>
            )}
            {selectedExportFormat === "pdf" && (
              <>
                <FilePdf size={18} weight="duotone" className="text-teal-600" />
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  PDF Settings
                </span>
              </>
            )}
            {selectedExportFormat === "svg" && (
              <>
                <FileCode size={18} weight="duotone" className="text-teal-600" />
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  SVG Settings
                </span>
              </>
            )}
          </div>

          {/* Format-specific options content */}
          {selectedExportFormat === "png" && (
            <PngScaleOptions
              options={exportOptions}
              onChange={setExportOptions}
              currentAppZoom={currentAppZoom}
              projectDurationDays={projectDurationDays}
              taskTableWidth={taskTableWidth}
            />
          )}

          {selectedExportFormat === "pdf" && (
            <PdfExportOptions
              options={pdfExportOptions}
              onChange={setPdfExportOptions}
              projectName={projectName}
            />
          )}

          {selectedExportFormat === "svg" && (
            <div className="space-y-4">
              {/* Timeline Scale Options (same as PNG) */}
              <PngScaleOptions
                options={exportOptions}
                onChange={setExportOptions}
                currentAppZoom={currentAppZoom}
                projectDurationDays={projectDurationDays}
                taskTableWidth={taskTableWidth}
              />
              {/* SVG-specific options */}
              <SvgExportOptions
                options={svgExportOptions}
                onChange={setSvgExportOptions}
              />
            </div>
          )}
        </div>

        {/* Shared Options Panel */}
        <div className="relative p-4 rounded-xl border border-slate-200 overflow-hidden">
          {/* Teal accent stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
          {/* Panel Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
            <ChartBar size={18} weight="duotone" className="text-teal-600" />
            <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Chart Content
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
              All Formats
            </span>
          </div>

          {/* Shared options content */}
          <SharedExportOptions
            options={exportOptions}
            onChange={setExportOptions}
            format={selectedExportFormat}
            projectDateRange={projectDateRange}
            visibleDateRange={visibleDateRange}
          />
        </div>

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
