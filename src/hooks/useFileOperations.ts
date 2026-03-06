/**
 * Main file operations hook
 * Handles save, open, and new file operations
 */

import { useCallback } from "react";
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

/**
 * Generate a suggested filename from project title and current date.
 * Format: <chartname>_<YYYY-MM-DD>.ownchart
 */
function generateSuggestedFilename(projectTitle: string): string {
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
function resolveSuggestedFilename(
  fileName: string | null,
  projectTitle: string
): string {
  if (fileName) return fileName;
  if (projectTitle) return generateSuggestedFilename(projectTitle);
  return `untitled${OWNCHART_FILE_EXTENSION}`;
}

export function useFileOperations(): {
  handleSave: (saveAs?: boolean) => Promise<void>;
  handleSaveAs: () => Promise<void>;
  handleOpen: () => Promise<void>;
  handleNew: () => Promise<void>;
  fileName: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
} {
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const columnWidths = useTaskStore((state) => state.columnWidths);

  // View settings from chartSlice
  const zoom = useChartStore((state) => state.zoom);
  const panOffset = useChartStore((state) => state.panOffset);
  const showWeekends = useChartStore((state) => state.showWeekends);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);
  const showHolidays = useChartStore((state) => state.showHolidays);
  const showDependencies = useChartStore((state) => state.showDependencies);
  const showProgress = useChartStore((state) => state.showProgress);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const holidayRegion = useChartStore((state) => state.holidayRegion);
  const colorModeState = useChartStore((state) => state.colorModeState);
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const isTaskTableCollapsed = useChartStore(
    (state) => state.isTaskTableCollapsed
  );
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);
  const projectTitle = useChartStore((state) => state.projectTitle);
  const projectAuthor = useChartStore((state) => state.projectAuthor);
  const setProjectTitle = useChartStore((state) => state.setProjectTitle);
  const setProjectAuthor = useChartStore((state) => state.setProjectAuthor);

  // Sprint 1.4: Dependency store
  const dependencies = useDependencyStore((state) => state.dependencies);
  const clearDependencies = useDependencyStore(
    (state) => state.clearDependencies
  );

  // fileSlice — individual selectors to avoid full-store subscription and
  // prevent handleSave from being recreated on every isDirty/lastSaved change
  const fileName = useFileStore((state) => state.fileName);
  const isDirty = useFileStore((state) => state.isDirty);
  const lastSaved = useFileStore((state) => state.lastSaved);
  const chartId = useFileStore((state) => state.chartId);
  const chartCreatedAt = useFileStore((state) => state.chartCreatedAt);
  const setFileName = useFileStore((state) => state.setFileName);
  const setLastSaved = useFileStore((state) => state.setLastSaved);
  const markClean = useFileStore((state) => state.markClean);
  const resetFileStore = useFileStore((state) => state.reset);

  const clearHistory = useHistoryStore((state) => state.clearHistory);

  // Export options from uiSlice
  const exportOptions = useUIStore((state) => state.exportOptions);
  const resetExportOptions = useUIStore((state) => state.resetExportOptions);

  // Save (Ctrl+S) - Re-save if handle exists, otherwise show dialog
  const handleSave = useCallback(
    async (saveAs = false) => {
      try {
        const viewSettings = {
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
        };
        const serializeOpts = {
          chartName:
            fileName?.replace(OWNCHART_FILE_EXTENSION, "") ?? "Untitled",
          chartId: chartId ?? undefined,
          chartCreatedAt: chartCreatedAt ?? undefined,
          prettyPrint: true,
          dependencies, // Sprint 1.4
          exportSettings: exportOptions, // Sprint 1.6
        };
        const content = serializeToGanttFile(
          tasks,
          viewSettings,
          serializeOpts
        );

        const suggestedFilename = resolveSuggestedFilename(
          fileName,
          projectTitle
        );
        const result = await saveFile(content, suggestedFilename, saveAs);

        if (result.success) {
          setFileName(result.fileName!);
          setLastSaved(new Date());
          markClean();
          toast.success(`Saved "${result.fileName}"`);
        } else if (result.error !== "Save cancelled") {
          toast.error(`Save failed: ${result.error}`);
        }
      } catch (e) {
        toast.error(`Save failed: ${(e as Error).message}`);
      }
    },
    [
      tasks,
      dependencies,
      exportOptions,
      chartCreatedAt,
      chartId,
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
      taskTableWidth,
      columnWidths,
      fileName,
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
      toast.error(`Open failed: ${(e as Error).message}`);
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

    // Reset to empty task list (placeholder row allows adding new tasks)
    setTasks([]);
    clearDependencies(); // Sprint 1.4
    resetExportOptions(); // Sprint 1.6 - reset to defaults
    setProjectTitle(""); // Reset project metadata
    setProjectAuthor("");
    useChartStore.getState().setHiddenTaskIds([]); // Clear hidden rows from previous chart
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
