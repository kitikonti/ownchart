/**
 * Shared file-loading function
 * Loads parsed .ownchart file data into Zustand stores.
 * Works outside React (uses getState()).
 */

import toast from "react-hot-toast";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useFileStore } from "../../store/slices/fileSlice";
import { useHistoryStore } from "../../store/slices/historySlice";
import { useDependencyStore } from "../../store/slices/dependencySlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { deserializeGanttFile } from "./deserialize";
import { DEFAULT_COLOR_MODE_STATE } from "../../config/colorModeDefaults";

/**
 * Load file content into the application stores.
 * Can be called from both React hooks and non-React contexts (e.g. LaunchQueue).
 */
export async function loadFileIntoApp(file: {
  name: string;
  content: string;
  size: number;
}): Promise<boolean> {
  const parseResult = await deserializeGanttFile(
    file.content,
    file.name,
    file.size
  );

  if (!parseResult.success) {
    toast.error(parseResult.error!.message);
    return false;
  }

  const taskStore = useTaskStore.getState();
  const chartStore = useChartStore.getState();
  const fileStore = useFileStore.getState();
  const historyStore = useHistoryStore.getState();
  const dependencyStore = useDependencyStore.getState();
  const uiStore = useUIStore.getState();

  // Load data
  taskStore.setTasks(parseResult.data!.tasks);
  dependencyStore.setDependencies(parseResult.data!.dependencies || []);
  uiStore.resetExportOptions(parseResult.data!.exportSettings);

  // Load view settings from file
  const loadedViewSettings = parseResult.data!.viewSettings;
  chartStore.setViewSettings({
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
    holidayRegion: loadedViewSettings.holidayRegion,
    projectTitle: loadedViewSettings.projectTitle ?? "",
    projectAuthor: loadedViewSettings.projectAuthor ?? "",
    colorModeState:
      loadedViewSettings.colorModeState ?? DEFAULT_COLOR_MODE_STATE,
    hiddenColumns: loadedViewSettings.hiddenColumns ?? [],
    isTaskTableCollapsed: loadedViewSettings.isTaskTableCollapsed ?? false,
    hiddenTaskIds: loadedViewSettings.hiddenTaskIds ?? [],
  });

  // Update scale immediately with new tasks and zoom (before signalFileLoaded)
  chartStore.updateScale(parseResult.data!.tasks);

  // Signal that a file was loaded (triggers scroll positioning in GanttLayout)
  chartStore.signalFileLoaded();

  // Restore column widths from file
  if (loadedViewSettings.taskTableWidth !== undefined) {
    taskStore.setTaskTableWidth(loadedViewSettings.taskTableWidth);
  }
  if (loadedViewSettings.columnWidths) {
    Object.entries(loadedViewSettings.columnWidths).forEach(
      ([columnId, width]) => {
        taskStore.setColumnWidth(columnId, width);
      }
    );
  }

  // Only auto-fit if no column widths were saved in file
  if (
    !loadedViewSettings.columnWidths ||
    Object.keys(loadedViewSettings.columnWidths).length === 0
  ) {
    taskStore.autoFitColumn("name");
  }

  historyStore.clearHistory();
  fileStore.setFileName(file.name);
  fileStore.setChartId(parseResult.data!.chartId);
  fileStore.setLastSaved(new Date());
  fileStore.markClean();

  // Show warnings
  if (parseResult.warnings) {
    parseResult.warnings.forEach((w) => toast(w, { icon: "ℹ️" }));
  }

  toast.success(`Opened "${file.name}"`);
  return true;
}
