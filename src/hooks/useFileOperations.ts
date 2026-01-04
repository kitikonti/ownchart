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
  const taskTableWidth = useTaskStore((state) => state.taskTableWidth);
  const columnWidths = useTaskStore((state) => state.columnWidths);

  const zoom = useChartStore((state) => state.zoom);
  const panOffset = useChartStore((state) => state.panOffset);
  const showWeekends = useChartStore((state) => state.showWeekends);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);

  // Sprint 1.4: Dependency store
  const dependencies = useDependencyStore((state) => state.dependencies);
  const setDependencies = useDependencyStore((state) => state.setDependencies);
  const clearDependencies = useDependencyStore(
    (state) => state.clearDependencies
  );

  const fileState = useFileStore();
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  // Save (Ctrl+S) - Re-save if handle exists, otherwise show dialog
  const handleSave = useCallback(
    async (saveAs = false) => {
      try {
        const content = serializeToGanttFile(
          tasks,
          {
            zoom,
            panOffset,
            showWeekends,
            showTodayMarker,
            taskTableWidth,
            columnWidths,
          },
          {
            chartName: fileState.fileName?.replace(".gantt", "") || "Untitled",
            chartId: fileState.chartId || undefined,
            prettyPrint: true,
            dependencies, // Sprint 1.4
          }
        );

        const result = await saveFile(
          content,
          fileState.fileName || "untitled.gantt",
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
      zoom,
      panOffset,
      showWeekends,
      showTodayMarker,
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
  }, [fileState, setTasks, setDependencies, clearHistory]);

  // New (Ctrl+N)
  const handleNew = useCallback(async () => {
    if (fileState.isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Do you want to create a new chart without saving?"
      );
      if (!confirmed) return;
    }

    // Reset to initial task
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    const initialTask = {
      id: crypto.randomUUID(),
      name: "New Task",
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
      duration: 7,
      progress: 0,
      color: "#3b82f6",
      order: 0,
      type: "task" as const,
      metadata: {},
    };

    setTasks([initialTask]);
    clearDependencies(); // Sprint 1.4
    clearHistory();
    clearFileHandle();
    fileState.reset();

    toast.success("Created new chart");
  }, [fileState, setTasks, clearDependencies, clearHistory]);

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
