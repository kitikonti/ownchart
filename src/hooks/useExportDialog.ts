/**
 * useExportDialog - Hook encapsulating all state and logic for the ExportDialog.
 * Reads from stores, computes derived values, and provides the export action.
 */

import { useCallback, useMemo, useEffect } from "react";
import type { Task } from "@/types/chart.types";
import type { TimelineScale } from "@/utils/timelineUtils";
import { prepareExportTasks } from "@/utils/export/prepareExportTasks";
import { calculateWorkingDays } from "@/utils/workingDaysCalculator";
import type {
  ExportFormat,
  ExportOptions,
  PdfExportOptions,
  ReadabilityStatus,
} from "@/utils/export/types";
import {
  EXPORT_ZOOM_READABLE_THRESHOLD,
  EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD,
  EXPORT_MAX_SAFE_WIDTH,
  EXPORT_LARGE_WIDTH_THRESHOLD,
} from "@/utils/export/types";
import { useUIStore } from "@/store/slices/uiSlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useFileStore } from "@/store/slices/fileSlice";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesSlice";
import {
  exportToPng,
  calculateExportDimensions,
  calculateTaskTableWidth,
} from "@/utils/export";
import { calculatePdfFitToWidth } from "@/utils/export/pdfLayout";
import { APP_CONFIG } from "@/config/appConfig";

// =============================================================================
// Pure computation helpers (extracted for testability)
// =============================================================================

/** Shared date range type used by project and visible date range computations. */
export type DateRange = { start: Date; end: Date };

/**
 * Calculate the overall project date range from a list of tasks.
 *
 * Iterates all tasks and returns the earliest `startDate` and latest `endDate`
 * found. Tasks with missing or invalid dates are skipped.
 *
 * @param tasks - The full array of tasks to analyse.
 * @returns The `{ start, end }` bounding date range, or `undefined` if no
 *   valid dates are found (e.g. empty array or all-invalid tasks).
 */
export function computeProjectDateRange(tasks: Task[]): DateRange | undefined {
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

/**
 * Calculate the currently visible date range from the viewport scroll position.
 *
 * Converts pixel coordinates to dates using the timeline scale's `pixelsPerDay`
 * value. The start date is floored and the end date is ceiled to ensure the full
 * visible window is captured even when fractional-day offsets are involved.
 *
 * @param scale - The active timeline scale, or `null` when the chart is not yet
 *   initialised.
 * @param viewportScrollLeft - Current horizontal scroll offset in pixels.
 * @param viewportWidth - Width of the visible viewport in pixels.
 * @returns The `{ start, end }` visible date range, or `undefined` when the
 *   scale is absent or the viewport has zero width.
 */
export function computeVisibleDateRange(
  scale: TimelineScale | null,
  viewportScrollLeft: number,
  viewportWidth: number
): DateRange | undefined {
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

/**
 * Determine the label readability status for a given effective export zoom level.
 *
 * Uses the project-wide thresholds `EXPORT_ZOOM_READABLE_THRESHOLD` and
 * `EXPORT_ZOOM_LABELS_HIDDEN_THRESHOLD` to classify zoom into three levels:
 * - `"good"` — labels are clearly readable
 * - `"warning"` — labels may be hard to read
 * - `"critical"` — labels will be hidden at this zoom
 *
 * @param effectiveZoom - The computed zoom ratio for the export (e.g. `0.15`).
 * @returns A `ReadabilityStatus` object with `level` and `message`.
 */
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
  exportTasks: Task[];
  columnWidths: Record<string, number>;
  currentAppZoom: number;
  projectTitle: string;
  projectAuthor: string;
  setProjectAuthor: (author: string) => void;
  projectLogo: import("@/types/logo.types").ProjectLogo | null;
  setProjectLogo: (
    logo: import("@/types/logo.types").ProjectLogo | null
  ) => void;
  hiddenTaskCount: number;

  // Computed values
  effectiveExportOptions: ExportOptions;
  estimatedDimensions: { width: number; height: number; effectiveZoom: number };
  taskTableWidth: number;
  effectiveZoom: number;
  readabilityStatus: ReadabilityStatus;
  projectDateRange: DateRange | undefined;
  visibleDateRange: DateRange | undefined;

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
  const projectLogo = useChartStore((state) => state.projectLogo);
  const setProjectLogo = useChartStore((state) => state.setProjectLogo);
  const scale = useChartStore((state) => state.scale);
  const viewportScrollLeft = useChartStore((state) => state.viewportScrollLeft);
  const viewportWidth = useChartStore((state) => state.viewportWidth);
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  const fileName = useFileStore((state) => state.fileName);
  const dateFormat = useUserPreferencesStore(
    (state) => state.preferences.dateFormat
  );

  // --- Derived values ---
  const projectName = useMemo(
    () =>
      projectTitle ||
      fileName?.replace(APP_CONFIG.fileExtension, "") ||
      undefined,
    [projectTitle, fileName]
  );

  const exportTasks = useMemo(() => {
    const filtered = prepareExportTasks(tasks, hiddenTaskIds);
    // When working-days mode is on, override each task's stored (calendar)
    // duration with the working-day count of its calendar span. This keeps
    // exported PNG/PDF/SVG aligned with the table view (#81). Storage is not
    // mutated — only the in-memory copy passed to the export pipeline.
    if (!workingDaysMode) return filtered;
    return filtered.map((task) => {
      if (task.type === "milestone" || !task.startDate || !task.endDate) {
        return task;
      }
      return {
        ...task,
        duration: calculateWorkingDays(
          task.startDate,
          task.endDate,
          workingDaysConfig,
          holidayRegion
        ),
      };
    });
  }, [tasks, hiddenTaskIds, workingDaysMode, workingDaysConfig, holidayRegion]);
  const hiddenTaskCount = useMemo(
    () => tasks.length - exportTasks.length,
    [tasks.length, exportTasks.length]
  );

  const projectDateRange = useMemo(
    () => computeProjectDateRange(exportTasks),
    [exportTasks]
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
        exportTasks,
        exportOptions,
        pdfExportOptions
      );
      return { ...exportOptions, fitToWidth: pdfFitToWidth };
    }
    return exportOptions;
  }, [selectedExportFormat, exportOptions, pdfExportOptions, exportTasks]);

  const estimatedDimensions = useMemo(
    () =>
      calculateExportDimensions({
        tasks: exportTasks,
        options: effectiveExportOptions,
        columnWidths,
        currentAppZoom,
        projectDateRange,
        visibleDateRange,
      }),
    [
      exportTasks,
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

  // Display flags — intentionally not memoized: these are O(1) boolean
  // derivations from already-memoized values, so the cost is negligible.
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
    setExportProgress(0); // Reset to 0 at start so the progress bar begins fresh.

    try {
      if (selectedExportFormat === "png") {
        await exportToPng({
          tasks: exportTasks,
          options: effectiveExportOptions,
          columnWidths,
          currentAppZoom,
          projectDateRange,
          visibleDateRange,
          projectName,
        });
      } else if (selectedExportFormat === "pdf") {
        const { exportToPdf } = await import("@/utils/export/pdfExport");
        await exportToPdf({
          tasks: exportTasks,
          options: effectiveExportOptions,
          pdfOptions: pdfExportOptions,
          columnWidths,
          currentAppZoom,
          projectDateRange,
          visibleDateRange,
          projectName,
          projectTitle,
          projectAuthor,
          projectLogo: projectLogo ?? undefined,
          dateFormat,
          colorModeState,
          onProgress: setExportProgress,
        });
      } else if (selectedExportFormat === "svg") {
        const { exportToSvg } = await import("@/utils/export/svgExport");
        await exportToSvg({
          tasks: exportTasks,
          options: effectiveExportOptions,
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
      // Always reset progress to 0 so the next export starts from a clean state,
      // regardless of whether this attempt succeeded or failed partway through.
      setExportProgress(0);
    }
  }, [
    selectedExportFormat,
    exportTasks,
    effectiveExportOptions,
    pdfExportOptions,
    svgExportOptions,
    columnWidths,
    currentAppZoom,
    projectDateRange,
    visibleDateRange,
    projectName,
    projectTitle,
    projectAuthor,
    projectLogo,
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
    exportTasks,
    hiddenTaskCount,
    columnWidths,
    currentAppZoom,
    projectTitle,
    projectAuthor,
    setProjectAuthor,
    projectLogo,
    setProjectLogo,
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
