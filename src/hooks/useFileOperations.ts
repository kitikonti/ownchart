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
  return `${sanitizedName}_${dateStr}.ownchart`;
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

  const fileState = useFileStore();
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  // Export options from uiSlice
  const exportOptions = useUIStore((state) => state.exportOptions);
  const resetExportOptions = useUIStore((state) => state.resetExportOptions);

  // Save (Ctrl+S) - Re-save if handle exists, otherwise show dialog
  const handleSave = useCallback(
    async (saveAs = false) => {
      try {
        const content = serializeToGanttFile(
          tasks,
          {
            // Navigation
            zoom,
            panOffset,
            taskTableWidth,
            columnWidths,
            // Display settings
            showWeekends,
            showTodayMarker,
            showHolidays,
            showDependencies,
            showProgress,
            taskLabelPosition,
            // Working days mode
            workingDaysMode,
            workingDaysConfig,
            // Holiday region
            holidayRegion,
            // Project metadata
            projectTitle,
            projectAuthor,
            // Color mode
            colorModeState,
            // Column visibility
            hiddenColumns,
            // Task table collapse
            isTaskTableCollapsed,
            // Hidden task IDs
            hiddenTaskIds,
          },
          {
            chartName:
              fileState.fileName?.replace(".ownchart", "") || "Untitled",
            chartId: fileState.chartId || undefined,
            prettyPrint: true,
            dependencies, // Sprint 1.4
            exportSettings: exportOptions, // Sprint 1.6
          }
        );

        // Determine suggested filename:
        // 1. Use existing filename if available
        // 2. Otherwise, generate from projectTitle (with date)
        // 3. Fallback to "untitled.ownchart"
        const suggestedFilename =
          fileState.fileName ||
          (projectTitle
            ? generateSuggestedFilename(projectTitle)
            : "untitled.ownchart");

        const result = await saveFile(content, suggestedFilename, saveAs);

        if (result.success) {
          fileState.setFileName(result.fileName!);
          fileState.setLastSaved(new Date());
          fileState.markClean();
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
      fileState,
    ]
  );

  // Open (Ctrl+O)
  const handleOpen = useCallback(async () => {
    // Check unsaved changes
    if (fileState.isDirty) {
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
  }, [fileState]);

  // New (Ctrl+N)
  const handleNew = useCallback(async () => {
    if (fileState.isDirty) {
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
    fileState.reset();

    toast.success("Created new chart");
  }, [
    fileState,
    setTasks,
    clearDependencies,
    resetExportOptions,
    setProjectTitle,
    setProjectAuthor,
    clearHistory,
  ]);

  return {
    handleSave,
    handleSaveAs: (): Promise<void> => handleSave(true),
    handleOpen,
    handleNew,
    fileName: fileState.fileName,
    isDirty: fileState.isDirty,
    lastSaved: fileState.lastSaved,
  };
}
