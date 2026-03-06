/**
 * Main file operations hook
 * Handles save, open, and new file operations
 */

import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useFileStore } from "../store/slices/fileSlice";
import { useHistoryStore } from "../store/slices/historySlice";
import { useDependencyStore } from "../store/slices/dependencySlice";
import { useUIStore } from "../store/slices/uiSlice";
import { serializeToGanttFile } from "../utils/fileOperations/serialize";
import {
  saveFile,
  openFile,
  clearFileHandle,
} from "../utils/fileOperations/fileDialog";
import {
  loadFileIntoApp,
  showLoadNotifications,
} from "../utils/fileOperations/loadFromFile";
import { sanitizeFilename } from "../utils/export/sanitizeFilename";

const OWNCHART_FILE_EXTENSION = ".ownchart";
const DEFAULT_CHART_NAME = "Untitled";

/** Coerce an unknown catch value to a readable string. */
function toErrorMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Generate a suggested filename from project title and current date.
 * Format: <chartname>_<YYYY-MM-DD>.ownchart
 */
export function generateSuggestedFilename(projectTitle: string): string {
  const sanitizedName = sanitizeFilename(projectTitle);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  return `${sanitizedName}_${dateStr}${OWNCHART_FILE_EXTENSION}`;
}

/**
 * Resolve the filename to suggest in the save dialog.
 * Priority: existing fileName → generated from title → "untitled.ownchart"
 */
export function resolveSuggestedFilename(
  fileName: string | null,
  projectTitle: string
): string {
  if (fileName) return fileName;
  if (projectTitle) return generateSuggestedFilename(projectTitle);
  return `untitled${OWNCHART_FILE_EXTENSION}`;
}

// ---------------------------------------------------------------------------
// State sub-hooks — split by slice so each value keeps its own Zustand
// subscription. Grouping by slice (rather than one giant hook) keeps each
// sub-hook under 50 lines while preserving the individual-selector pattern.
//
// Callers destructure the returned object immediately so useCallback dep
// arrays reference stable individual variables rather than the container
// object, which changes identity on every render.
// ---------------------------------------------------------------------------

function useTaskSliceState() {
  const tasks = useTaskStore((s) => s.tasks);
  const setTasks = useTaskStore((s) => s.setTasks);
  const taskTableWidth = useTaskStore((s) => s.taskTableWidth);
  const columnWidths = useTaskStore((s) => s.columnWidths);
  return { tasks, setTasks, taskTableWidth, columnWidths };
}

function useChartSliceState() {
  const zoom = useChartStore((s) => s.zoom);
  const panOffset = useChartStore((s) => s.panOffset);
  const showWeekends = useChartStore((s) => s.showWeekends);
  const showTodayMarker = useChartStore((s) => s.showTodayMarker);
  const showHolidays = useChartStore((s) => s.showHolidays);
  const showDependencies = useChartStore((s) => s.showDependencies);
  const showProgress = useChartStore((s) => s.showProgress);
  const taskLabelPosition = useChartStore((s) => s.taskLabelPosition);
  const workingDaysMode = useChartStore((s) => s.workingDaysMode);
  const workingDaysConfig = useChartStore((s) => s.workingDaysConfig);
  const holidayRegion = useChartStore((s) => s.holidayRegion);
  const colorModeState = useChartStore((s) => s.colorModeState);
  const hiddenColumns = useChartStore((s) => s.hiddenColumns);
  const isTaskTableCollapsed = useChartStore((s) => s.isTaskTableCollapsed);
  const hiddenTaskIds = useChartStore((s) => s.hiddenTaskIds);
  const projectTitle = useChartStore((s) => s.projectTitle);
  const projectAuthor = useChartStore((s) => s.projectAuthor);
  const setProjectTitle = useChartStore((s) => s.setProjectTitle);
  const setProjectAuthor = useChartStore((s) => s.setProjectAuthor);
  const setHiddenTaskIds = useChartStore((s) => s.setHiddenTaskIds);
  const resetView = useChartStore((s) => s.resetView);
  return {
    zoom,
    panOffset,
    showWeekends,
    showTodayMarker,
    showHolidays,
    showDependencies,
    showProgress,
    taskLabelPosition,
    workingDaysMode,
    workingDaysConfig,
    holidayRegion,
    colorModeState,
    hiddenColumns,
    isTaskTableCollapsed,
    hiddenTaskIds,
    projectTitle,
    projectAuthor,
    setProjectTitle,
    setProjectAuthor,
    setHiddenTaskIds,
    resetView,
  };
}

function useOperationalSliceState() {
  const dependencies = useDependencyStore((s) => s.dependencies);
  const clearDependencies = useDependencyStore((s) => s.clearDependencies);
  const fileName = useFileStore((s) => s.fileName);
  const isDirty = useFileStore((s) => s.isDirty);
  const lastSaved = useFileStore((s) => s.lastSaved);
  const chartId = useFileStore((s) => s.chartId);
  const chartCreatedAt = useFileStore((s) => s.chartCreatedAt);
  const setFileName = useFileStore((s) => s.setFileName);
  const setLastSaved = useFileStore((s) => s.setLastSaved);
  const markClean = useFileStore((s) => s.markClean);
  const resetFileStore = useFileStore((s) => s.reset);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const exportOptions = useUIStore((s) => s.exportOptions);
  const resetExportOptions = useUIStore((s) => s.resetExportOptions);
  return {
    dependencies,
    clearDependencies,
    fileName,
    isDirty,
    lastSaved,
    chartId,
    chartCreatedAt,
    setFileName,
    setLastSaved,
    markClean,
    resetFileStore,
    clearHistory,
    exportOptions,
    resetExportOptions,
  };
}

// ---------------------------------------------------------------------------
// Serialization options sub-hook — groups the three memoized values that feed
// into handleSave. Extracting them here keeps handleSave's dep array minimal
// and makes the "what gets serialized" contract explicit in one place.
//
// Params are the sub-hook result objects. Each value is destructured
// immediately so the useMemo dep arrays reference individual stable variables,
// not the container objects (which are new on every render).
// ---------------------------------------------------------------------------

function useSerializeOptions(
  task: ReturnType<typeof useTaskSliceState>,
  chart: ReturnType<typeof useChartSliceState>,
  op: ReturnType<typeof useOperationalSliceState>
) {
  const { taskTableWidth, columnWidths } = task;
  const {
    zoom,
    panOffset,
    showWeekends,
    showTodayMarker,
    showHolidays,
    showDependencies,
    showProgress,
    taskLabelPosition,
    workingDaysMode,
    workingDaysConfig,
    holidayRegion,
    colorModeState,
    hiddenColumns,
    isTaskTableCollapsed,
    hiddenTaskIds,
    projectTitle,
    projectAuthor,
  } = chart;
  const { fileName, chartId, chartCreatedAt, dependencies, exportOptions } = op;

  // Snapshot of all view settings written to the .ownchart file.
  const viewSettings = useMemo(
    () => ({
      zoom,
      panOffset,
      taskTableWidth,
      columnWidths,
      showWeekends,
      showTodayMarker,
      showHolidays,
      showDependencies,
      showProgress,
      taskLabelPosition,
      workingDaysMode,
      workingDaysConfig,
      holidayRegion,
      projectTitle,
      projectAuthor,
      colorModeState,
      hiddenColumns,
      isTaskTableCollapsed,
      hiddenTaskIds,
    }),
    [
      zoom,
      panOffset,
      taskTableWidth,
      columnWidths,
      showWeekends,
      showTodayMarker,
      showHolidays,
      showDependencies,
      showProgress,
      taskLabelPosition,
      workingDaysMode,
      workingDaysConfig,
      holidayRegion,
      projectTitle,
      projectAuthor,
      colorModeState,
      hiddenColumns,
      isTaskTableCollapsed,
      hiddenTaskIds,
    ]
  );

  // Serializer flags and metadata (file identity, dependency data, export settings).
  const serializeOpts = useMemo(
    () => ({
      chartName:
        fileName?.replace(OWNCHART_FILE_EXTENSION, "") ?? DEFAULT_CHART_NAME,
      chartId: chartId ?? undefined,
      chartCreatedAt: chartCreatedAt ?? undefined,
      prettyPrint: true,
      dependencies,
      exportSettings: exportOptions,
    }),
    [fileName, chartId, chartCreatedAt, dependencies, exportOptions]
  );

  const suggestedFilename = useMemo(
    () => resolveSuggestedFilename(fileName, projectTitle),
    [fileName, projectTitle]
  );

  return { viewSettings, serializeOpts, suggestedFilename };
}

// ---------------------------------------------------------------------------

export function useFileOperations(): {
  handleSave: (saveAs?: boolean) => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleOpen: () => Promise<void>;
  handleNew: () => Promise<void>;
  fileName: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
} {
  const taskState = useTaskSliceState();
  const chartState = useChartSliceState();
  const opState = useOperationalSliceState();

  // Destructure immediately so callback dep arrays reference stable individual
  // variables, not the container objects (exhaustive-deps requires this).
  const { tasks, setTasks } = taskState;
  const { setProjectTitle, setProjectAuthor, setHiddenTaskIds, resetView } =
    chartState;
  const {
    isDirty,
    fileName,
    lastSaved,
    setFileName,
    setLastSaved,
    markClean,
    clearDependencies,
    resetExportOptions,
    clearHistory,
    resetFileStore,
  } = opState;

  const { viewSettings, serializeOpts, suggestedFilename } =
    useSerializeOptions(taskState, chartState, opState);

  // Save (Ctrl+S) — re-save to existing handle if present, else open dialog.
  const handleSave = useCallback(
    async (saveAs = false) => {
      try {
        const content = serializeToGanttFile(
          tasks,
          viewSettings,
          serializeOpts
        );
        const result = await saveFile(content, suggestedFilename, saveAs);

        if (result.success) {
          setFileName(result.fileName ?? "");
          setLastSaved(new Date());
          markClean();
          toast.success(`Saved "${result.fileName}"`);
        } else if (result.error !== "Save cancelled") {
          toast.error(`Save failed: ${result.error}`);
        }
      } catch (e) {
        toast.error(`Save failed: ${toErrorMsg(e)}`);
      }
    },
    [
      tasks,
      viewSettings,
      serializeOpts,
      suggestedFilename,
      setFileName,
      setLastSaved,
      markClean,
    ]
  );

  const handleSaveAs = useCallback(
    (): Promise<void> => handleSave(true),
    [handleSave]
  );

  // Open (Ctrl+O)
  const handleOpen = useCallback(async () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you want to continue without saving?"
      );
      if (!confirmed) return;
    }

    try {
      const result = await openFile();

      if (!result.success || !result.file) {
        if (result.error !== "Open cancelled") {
          toast.error(`Open failed: ${result.error}`);
        }
        return;
      }

      const loadResult = await loadFileIntoApp(result.file);
      showLoadNotifications(
        { ...loadResult, fileName: result.file.name },
        toast
      );
    } catch (e) {
      toast.error(`Open failed: ${toErrorMsg(e)}`);
    }
  }, [isDirty]);

  // New (Ctrl+N)
  const handleNew = useCallback(async () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you want to create a new chart without saving?"
      );
      if (!confirmed) return;
    }

    setTasks([]);
    clearDependencies();
    resetExportOptions();
    setProjectTitle("");
    setProjectAuthor("");
    // Per-file row visibility resets with the file.
    // Column visibility and table layout are user preferences that intentionally
    // persist across new charts — only task-specific hidden rows are cleared.
    setHiddenTaskIds([]);
    // Reset zoom and pan so a new chart always opens at a sensible default view.
    resetView();
    clearHistory();
    clearFileHandle();
    resetFileStore();

    toast.success("Created new chart");
  }, [
    isDirty,
    setTasks,
    clearDependencies,
    resetExportOptions,
    setProjectTitle,
    setProjectAuthor,
    setHiddenTaskIds,
    resetView,
    clearHistory,
    resetFileStore,
  ]);

  return {
    handleSave,
    handleSaveAs,
    handleOpen,
    handleNew,
    fileName,
    isDirty,
    lastSaved,
  };
}
