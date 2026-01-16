/**
 * Export Dialog component for PNG, PDF, and SVG export with options.
 */

import { useCallback, useMemo, useEffect } from "react";
import {
  Spinner,
  Warning,
  Info,
  FilePdf,
  FileCode,
  Image,
} from "@phosphor-icons/react";
import { EXPORT_MAX_SAFE_WIDTH } from "../../utils/export/types";
import type { ExportFormat } from "../../utils/export/types";
import { Modal } from "../common/Modal";
import { ExportFormatSelector } from "./ExportFormatSelector";
import { SharedExportOptions } from "./SharedExportOptions";
import { PngScaleOptions } from "./PngScaleOptions";
import { PdfExportOptions } from "./PdfExportOptions";
import { ExportPreview } from "./ExportPreview";
import { useExportPreview } from "../../hooks/useExportPreview";
import { useUIStore } from "../../store/slices/uiSlice";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useFileStore } from "../../store/slices/fileSlice";
import { useDependencyStore } from "../../store/slices/dependencySlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import {
  exportToPng,
  calculateExportDimensions,
  calculateTaskTableWidth,
  calculateDurationDays,
  calculateEffectiveZoom,
} from "../../utils/export";
import {
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
} from "../../utils/export/types";
import type { ReadabilityStatus } from "./ChartPreview";

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

  // Get file name for fallback export filename
  const fileName = useFileStore((state) => state.fileName);

  // Get dependencies for export
  const dependencies = useDependencyStore((state) => state.dependencies);

  // Get date format preference
  const dateFormat = useUserPreferencesStore(
    (state) => state.preferences.dateFormat
  );

  // Get current app zoom level
  const currentAppZoom = useChartStore((state) => state.zoom);

  // Get project metadata from chart settings
  const projectTitle = useChartStore((state) => state.projectTitle);
  const projectAuthor = useChartStore((state) => state.projectAuthor);

  // Project name for export filename (prefer projectTitle, fallback to file name)
  const projectName =
    projectTitle || fileName?.replace(".ownchart", "") || undefined;

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

  // Calculate effective zoom for preview info
  const effectiveZoom = useMemo(
    () =>
      calculateEffectiveZoom(
        exportOptions,
        currentAppZoom,
        projectDurationDays,
        taskTableWidth
      ),
    [exportOptions, currentAppZoom, projectDurationDays, taskTableWidth]
  );

  // Calculate readability status based on effective zoom
  const readabilityStatus = useMemo((): ReadabilityStatus => {
    if (effectiveZoom >= EXPORT_ZOOM_READABLE_THRESHOLD) {
      return { level: "good", message: "Labels clearly readable" };
    } else if (effectiveZoom >= EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) {
      return { level: "warning", message: "Labels may be hard to read" };
    } else {
      return { level: "critical", message: "Labels will be hidden" };
    }
  }, [effectiveZoom]);

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
          projectTitle,
          projectAuthor,
          dateFormat,
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
    projectTitle,
    projectAuthor,
    dateFormat,
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

  // Format-specific button config
  const formatConfig: Record<
    ExportFormat,
    { icon: typeof Image; label: string }
  > = {
    png: { icon: Image, label: "Export PNG" },
    pdf: { icon: FilePdf, label: "Export PDF" },
    svg: { icon: FileCode, label: "Export SVG" },
  };

  const currentFormat = formatConfig[selectedExportFormat];
  const FormatIcon = currentFormat.icon;

  // Generate live preview
  const {
    previewDataUrl,
    previewDimensions,
    isRendering: isPreviewRendering,
    error: previewError,
  } = useExportPreview({
    tasks,
    options: exportOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    enabled: isExportDialogOpen,
  });

  const footer = (
    <div className="flex items-center w-full gap-3">
      {/* Progress bar for PDF export */}
      {isExporting && exportProgress > 0 && (
        <div className="flex items-center gap-2 flex-1">
          <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {exportProgress}%
          </span>
        </div>
      )}

      {/* Spacer when no progress */}
      {!(isExporting && exportProgress > 0) && <div className="flex-1" />}

      {/* Buttons - Outlook style */}
      <button
        onClick={closeExportDialog}
        disabled={isExporting}
        className="flex-1 max-w-[140px] px-5 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2"
      >
        Cancel
      </button>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex-1 max-w-[180px] px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded hover:bg-brand-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2"
      >
        {isExporting ? (
          <>
            <Spinner size={16} className="animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FormatIcon size={16} weight="regular" />
            {currentFormat.label}
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isExportDialogOpen}
      onClose={closeExportDialog}
      title="Export Gantt Chart"
      subtitle="Choose format and customize your export"
      footer={footer}
      widthClass="max-w-7xl"
      headerStyle="figma"
      footerStyle="figma"
      contentPadding="p-0"
    >
      {/* Two-Column Layout */}
      <div className="flex h-[65vh]">
        {/* Left: Preview Panel (flexible) */}
        <div className="flex-1 bg-neutral-50 p-6 border-r border-neutral-200">
          <ExportPreview
            format={selectedExportFormat}
            previewDataUrl={previewDataUrl}
            dimensions={
              previewDimensions.width > 0
                ? previewDimensions
                : estimatedDimensions
            }
            isRendering={isPreviewRendering}
            error={previewError}
            isTransparent={exportOptions.background === "transparent"}
            pdfOptions={pdfExportOptions}
            projectTitle={projectTitle || undefined}
            projectAuthor={projectAuthor || undefined}
            effectiveZoom={effectiveZoom}
            readabilityStatus={readabilityStatus}
          />

          {/* Warnings for PNG/SVG */}
          {showDimensions && (hasWarning || hasInfo) && (
            <div className="mt-4">
              {hasWarning && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded bg-amber-50 border border-amber-200">
                  <Warning
                    className="size-4 text-amber-600 flex-shrink-0"
                    weight="fill"
                  />
                  <span className="text-xs font-medium text-amber-700">
                    Export exceeds {EXPORT_MAX_SAFE_WIDTH.toLocaleString()}px -
                    may cause issues
                  </span>
                </div>
              )}
              {hasInfo && !hasWarning && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded bg-neutral-100 border border-neutral-200">
                  <Info
                    className="size-4 text-neutral-500 flex-shrink-0"
                    weight="fill"
                  />
                  <span className="text-xs font-medium text-neutral-600">
                    Large export - generation may take a moment
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Options Panel (fixed width) */}
        <div className="w-[480px] flex-shrink-0 overflow-y-auto p-8 scrollbar-thin">
          <div className="space-y-8">
            {/* Format Selector */}
            <ExportFormatSelector
              selectedFormat={selectedExportFormat}
              onFormatChange={setExportFormat}
            />

            <div className="divider-h" />

            {/* Format-specific Options */}
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
                exportOptions={exportOptions}
                onExportOptionsChange={setExportOptions}
                currentAppZoom={currentAppZoom}
              />
            )}

            {selectedExportFormat === "svg" && (
              <PngScaleOptions
                options={exportOptions}
                onChange={setExportOptions}
                currentAppZoom={currentAppZoom}
                projectDurationDays={projectDurationDays}
                taskTableWidth={taskTableWidth}
              />
            )}

            <div className="divider-h" />

            {/* Shared Options */}
            <SharedExportOptions
              options={exportOptions}
              onChange={setExportOptions}
              format={selectedExportFormat}
              projectDateRange={projectDateRange}
              visibleDateRange={visibleDateRange}
            />

            {/* Error message */}
            {exportError && (
              <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                {exportError}
              </div>
            )}

            {/* Info tip */}
            <div className="flex items-start gap-3 px-4 py-3 rounded bg-blue-50 border border-blue-200">
              <Info
                className="size-4 text-blue-600 flex-shrink-0 mt-0.5"
                weight="fill"
              />
              <p className="text-xs text-blue-900">
                <strong className="font-semibold">Tip:</strong> For detailed
                documentation, use 100% zoom. For overview posters, use 25-50%
                zoom.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
