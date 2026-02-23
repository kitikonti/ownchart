/**
 * useExportDialog - Hook encapsulating all state and logic for the ExportDialog.
 * Reads from stores, computes derived values, and provides the export action.
 */

import { useCallback, useMemo, useEffect } from "react";
import type { Task } from "../types/chart.types";
import type { TimelineScale } from "../utils/timelineUtils";
import type {
  ExportFormat,
  ExportOptions,
  PdfExportOptions,
  ReadabilityStatus,
} from "../utils/export/types";
import {
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
  EXPORT_MAX_SAFE_WIDTH,
  EXPORT_LARGE_WIDTH_THRESHOLD,
} from "../utils/export/types";
import { useUIStore } from "../store/slices/uiSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useFileStore } from "../store/slices/fileSlice";
import { useDependencyStore } from "../store/slices/dependencySlice";
import { useUserPreferencesStore } from "../store/slices/userPreferencesSlice";
import {
  exportToPng,
  calculateExportDimensions,
  calculateTaskTableWidth,
} from "../utils/export";
import { calculatePdfFitToWidth } from "../utils/export/pdfLayout";

// =============================================================================
// Pure computation helpers (extracted for testability)
// =============================================================================

/** Calculate project date range from tasks */
export function computeProjectDateRange(
  tasks: Task[]
): { start: Date; end: Date } | undefined {
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
}

/** Calculate visible date range from viewport scroll position */
export function computeVisibleDateRange(
  scale: TimelineScale | null,
  viewportScrollLeft: number,
  viewportWidth: number
): { start: Date; end: Date } | undefined {
  if (!scale || viewportWidth === 0) return undefined;

  const { pixelsPerDay } = scale;
  const scaleStartDate = new Date(scale.minDate);

  const startDaysOffset = viewportScrollLeft / pixelsPerDay;
  const visibleStartDate = new Date(scaleStartDate);
  visibleStartDate.setDate(
    visibleStartDate.getDate() + Math.floor(startDaysOffset)
  );

  const endDaysOffset = (viewportScrollLeft + viewportWidth) / pixelsPerDay;
  const visibleEndDate = new Date(scaleStartDate);
  visibleEndDate.setDate(visibleEndDate.getDate() + Math.ceil(endDaysOffset));

  return { start: visibleStartDate, end: visibleEndDate };
}

/** Calculate readability status based on effective zoom */
export function computeReadabilityStatus(
  effectiveZoom: number
): ReadabilityStatus {
  if (effectiveZoom >= EXPORT_ZOOM_READABLE_THRESHOLD) {
    return { level: "good", message: "Labels clearly readable" };
  } else if (effectiveZoom >= EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD) {
    return { level: "warning", message: "Labels may be hard to read" };
  } else {
    return { level: "critical", message: "Labels will be hidden" };
  }
}

// =============================================================================
// Hook return type
// =============================================================================

export interface UseExportDialogResult {
  // Dialog control
  isExportDialogOpen: boolean;
  closeExportDialog: () => void;
  selectedExportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;

  // Export options
  exportOptions: ExportOptions;
  setExportOptions: (options: Partial<ExportOptions>) => void;
  pdfExportOptions: PdfExportOptions;
  setPdfExportOptions: (options: Partial<PdfExportOptions>) => void;

  // Export status & action
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;
  handleExport: () => Promise<void>;

  // Data for sub-components
  tasks: Task[];
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectTitle: string;
  projectAuthor: string;
  setProjectAuthor: (author: string) => void;

  // Computed values
  effectiveExportOptions: ExportOptions;
  estimatedDimensions: { width: number; height: number; effectiveZoom: number };
  taskTableWidth: number;
  effectiveZoom: number;
  readabilityStatus: ReadabilityStatus;
  projectDateRange: { start: Date; end: Date } | undefined;
  visibleDateRange: { start: Date; end: Date } | undefined;

  // Display flags
  showDimensions: boolean;
  hasWarning: boolean;
  hasInfo: boolean;
}

// =============================================================================
// Hook implementation
// =============================================================================

export function useExportDialog(): UseExportDialogResult {
  // --- Store reads ---
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

  const tasks = useTaskStore((state) => state.tasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);

  const showHolidays = useChartStore((state) => state.showHolidays);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);
  const colorModeState = useChartStore((state) => state.colorModeState);
  const currentAppZoom = useChartStore((state) => state.zoom);
  const projectTitle = useChartStore((state) => state.projectTitle);
  const projectAuthor = useChartStore((state) => state.projectAuthor);
  const setProjectAuthor = useChartStore((state) => state.setProjectAuthor);
  const scale = useChartStore((state) => state.scale);
  const viewportScrollLeft = useChartStore((state) => state.viewportScrollLeft);
  const viewportWidth = useChartStore((state) => state.viewportWidth);

  const fileName = useFileStore((state) => state.fileName);
  const dependencies = useDependencyStore((state) => state.dependencies);
  const dateFormat = useUserPreferencesStore(
    (state) => state.preferences.dateFormat
  );

  // --- Derived values ---
  const projectName =
    projectTitle || fileName?.replace(".ownchart", "") || undefined;

  const projectDateRange = useMemo(
    () => computeProjectDateRange(tasks),
    [tasks]
  );

  const visibleDateRange = useMemo(
    () => computeVisibleDateRange(scale, viewportScrollLeft, viewportWidth),
    [scale, viewportScrollLeft, viewportWidth]
  );

  // Sync export options with chart settings when dialog opens
  useEffect(() => {
    if (isExportDialogOpen) {
      setExportOptions({
        includeHolidays: showHolidays,
        taskLabelPosition,
      });
    }
  }, [isExportDialogOpen, showHolidays, taskLabelPosition, setExportOptions]);

  // PDF-aware effective options
  const effectiveExportOptions = useMemo((): ExportOptions => {
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

  const estimatedDimensions = useMemo(
    () =>
      calculateExportDimensions(
        tasks,
        effectiveExportOptions,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange
      ),
    [
      tasks,
      effectiveExportOptions,
      columnWidths,
      currentAppZoom,
      projectDateRange,
      visibleDateRange,
    ]
  );

  const taskTableWidth = useMemo(
    () =>
      calculateTaskTableWidth(
        exportOptions.selectedColumns,
        columnWidths,
        exportOptions.density
      ),
    [exportOptions.selectedColumns, columnWidths, exportOptions.density]
  );

  const effectiveZoom = estimatedDimensions.effectiveZoom;

  const readabilityStatus = useMemo(
    () => computeReadabilityStatus(effectiveZoom),
    [effectiveZoom]
  );

  // Display flags
  const showDimensions =
    selectedExportFormat === "png" || selectedExportFormat === "svg";
  const hasWarning =
    selectedExportFormat === "png" &&
    estimatedDimensions.width > EXPORT_MAX_SAFE_WIDTH;
  const hasInfo =
    selectedExportFormat === "png" &&
    estimatedDimensions.width > EXPORT_LARGE_WIDTH_THRESHOLD &&
    estimatedDimensions.width <= EXPORT_MAX_SAFE_WIDTH;

  // --- Export action ---
  const handleExport = useCallback(async (): Promise<void> => {
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
        const { exportToPdf } = await import("../utils/export/pdfExport");
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
        const { exportToSvg } = await import("../utils/export/svgExport");
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
    } finally {
      setIsExporting(false);
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

  return {
    isExportDialogOpen,
    closeExportDialog,
    selectedExportFormat,
    setExportFormat,
    exportOptions,
    setExportOptions,
    pdfExportOptions,
    setPdfExportOptions,
    isExporting,
    exportProgress,
    exportError,
    handleExport,
    tasks,
    columnWidths,
    currentAppZoom,
    projectTitle,
    projectAuthor,
    setProjectAuthor,
    effectiveExportOptions,
    estimatedDimensions,
    taskTableWidth,
    effectiveZoom,
    readabilityStatus,
    projectDateRange,
    visibleDateRange,
    showDimensions,
    hasWarning,
    hasInfo,
  };
}
