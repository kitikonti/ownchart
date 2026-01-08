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
import { deserializeGanttFile } from "../utils/fileOperations/deserialize";
import {
  saveFile,
  openFile,
  clearFileHandle,
} from "../utils/fileOperations/fileDialog";

export function useFileOperations() {
  const tasks = useTaskStore((state) => state.tasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const setTaskTableWidth = useTaskStore((state) => state.setTaskTableWidth);

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
  const setViewSettings = useChartStore((state) => state.setViewSettings);

  // Sprint 1.4: Dependency store
  const dependencies = useDependencyStore((state) => state.dependencies);
  const setDependencies = useDependencyStore((state) => state.setDependencies);
  const clearDependencies = useDependencyStore(
    (state) => state.clearDependencies
  );

  const fileState = useFileStore();
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  // Export options from uiSlice
  const exportOptions = useUIStore((state) => state.exportOptions);
  const resetExportOptions = useUIStore((state) => state.resetExportOptions);
  const openChartSettingsDialog = useUIStore(
    (state) => state.openChartSettingsDialog
  );

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

        const result = await saveFile(
          content,
          fileState.fileName || "untitled.ownchart",
          saveAs
        );

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

      const { file } = result;
      const parseResult = await deserializeGanttFile(
        file.content,
        file.name,
        file.size
      );

      if (!parseResult.success) {
        toast.error(parseResult.error!.message);
        return;
      }

      // Load data
      setTasks(parseResult.data!.tasks);
      setDependencies(parseResult.data!.dependencies || []); // Sprint 1.4
      resetExportOptions(parseResult.data!.exportSettings); // Sprint 1.6

      // Load view settings from file (Sprint 1.5.9)
      const loadedViewSettings = parseResult.data!.viewSettings;
      setViewSettings({
        zoom: loadedViewSettings.zoom,
        panOffset: loadedViewSettings.panOffset,
        showWeekends: loadedViewSettings.showWeekends,
        showTodayMarker: loadedViewSettings.showTodayMarker,
        showHolidays: loadedViewSettings.showHolidays ?? true,
        showDependencies: loadedViewSettings.showDependencies ?? true,
        showProgress: loadedViewSettings.showProgress ?? true,
        taskLabelPosition: loadedViewSettings.taskLabelPosition ?? "inside",
        workingDaysMode: loadedViewSettings.workingDaysMode ?? false,
        workingDaysConfig: loadedViewSettings.workingDaysConfig ?? {
          excludeSaturday: true,
          excludeSunday: true,
          excludeHolidays: true,
        },
        holidayRegion: loadedViewSettings.holidayRegion, // Use file's region, undefined keeps current
      });

      // Restore column widths from file
      if (loadedViewSettings.taskTableWidth !== undefined) {
        setTaskTableWidth(loadedViewSettings.taskTableWidth);
      }
      if (loadedViewSettings.columnWidths) {
        Object.entries(loadedViewSettings.columnWidths).forEach(
          ([columnId, width]) => {
            setColumnWidth(columnId, width);
          }
        );
      }

      // Only auto-fit if no column widths were saved in file
      if (
        !loadedViewSettings.columnWidths ||
        Object.keys(loadedViewSettings.columnWidths).length === 0
      ) {
        autoFitColumn("name");
      }
      clearHistory();
      fileState.setFileName(file.name);
      fileState.setChartId(parseResult.data!.chartId);
      fileState.setLastSaved(new Date());
      fileState.markClean();

      // Show warnings
      if (parseResult.warnings) {
        parseResult.warnings.forEach((w) => toast(w, { icon: "ℹ️" }));
      }

      toast.success(`Opened "${file.name}"`);
    } catch (e) {
      toast.error(`Open failed: ${(e as Error).message}`);
    }
  }, [
    fileState,
    setTasks,
    setDependencies,
    resetExportOptions,
    setViewSettings,
    setColumnWidth,
    setTaskTableWidth,
    autoFitColumn,
    clearHistory,
  ]);

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
    clearHistory();
    clearFileHandle();
    fileState.reset();

    // Open chart settings dialog to configure the new project
    openChartSettingsDialog();

    toast.success("Created new chart");
  }, [
    fileState,
    setTasks,
    clearDependencies,
    resetExportOptions,
    clearHistory,
    openChartSettingsDialog,
  ]);

  return {
    handleSave,
    handleSaveAs: () => handleSave(true),
    handleOpen,
    handleNew,
    fileName: fileState.fileName,
    isDirty: fileState.isDirty,
    lastSaved: fileState.lastSaved,
  };
}
