/**
 * Export Dialog component for PNG, PDF, and SVG export with options.
 */

import { useCallback, useMemo, useEffect } from "react";
import { Spinner, FilePdf, FileCode, Image } from "@phosphor-icons/react";
import { Alert } from "../common/Alert";
import { Button } from "../common/Button";
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
} from "../../utils/export";
import { calculatePdfFitToWidth } from "../../utils/export/pdfLayout";
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
  const colorModeState = useChartStore((state) => state.colorModeState);

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
  const setProjectAuthor = useChartStore((state) => state.setProjectAuthor);

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
      if (!task.startDate || !task.endDate) continue;
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

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

  // For PDF "Fit to Page", compute the actual fitToWidth that pdfExport will use
  const effectiveExportOptions = useMemo(() => {
    if (
      selectedExportFormat === "pdf" &&
      exportOptions.zoomMode === "fitToWidth"
    ) {
      const pdfFitToWidth = calculatePdfFitToWidth(
        tasks,
        exportOptions,
        pdfExportOptions
      );
      return { ...exportOptions, fitToWidth: pdfFitToWidth };
    }
    return exportOptions;
  }, [selectedExportFormat, exportOptions, pdfExportOptions, tasks]);

  // Calculate estimated dimensions using effective options (PDF-aware)
  const estimatedDimensions = useMemo(() => {
    return calculateExportDimensions(
      tasks,
      effectiveExportOptions,
      columnWidths,
      currentAppZoom,
      projectDateRange,
      visibleDateRange
    );
  }, [
    tasks,
    effectiveExportOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
  ]);

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

  // Use effectiveZoom from calculateExportDimensions (single source of truth)
  // This accounts for padded date ranges and PDF-specific fitToWidth
  const effectiveZoom = estimatedDimensions.effectiveZoom;

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
          colorModeState,
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
          colorModeState,
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
    colorModeState,
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
    options: effectiveExportOptions,
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
      <Button
        variant="secondary"
        onClick={closeExportDialog}
        disabled={isExporting}
        className="flex-1 max-w-[140px]"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleExport}
        disabled={isExporting}
        icon={
          isExporting ? (
            <Spinner size={16} className="animate-spin" />
          ) : (
            <FormatIcon size={16} weight="regular" />
          )
        }
        className="flex-1 max-w-[180px]"
      >
        {isExporting ? "Exporting..." : currentFormat.label}
      </Button>
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
                <Alert variant="warning">
                  <span className="font-medium">
                    Export exceeds {EXPORT_MAX_SAFE_WIDTH.toLocaleString()}px -
                    may cause issues
                  </span>
                </Alert>
              )}
              {hasInfo && !hasWarning && (
                <Alert variant="neutral">
                  <span className="font-medium">
                    Large export - generation may take a moment
                  </span>
                </Alert>
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
                projectAuthor={projectAuthor}
                onProjectAuthorChange={setProjectAuthor}
              />
            )}

            {selectedExportFormat === "svg" && (
              <PngScaleOptions
                options={exportOptions}
                onChange={setExportOptions}
                currentAppZoom={currentAppZoom}
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
            {exportError && <Alert variant="error">{exportError}</Alert>}

            {/* Info tip */}
            <Alert variant="info">
              <strong className="font-semibold">Tip:</strong> For detailed
              documentation, use 100% zoom. For overview posters, use 25-50%
              zoom.
            </Alert>
          </div>
        </div>
      </div>
    </Modal>
  );
}
