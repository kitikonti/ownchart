/**
 * Shared file-loading function
 * Loads parsed .ownchart file data into Zustand stores.
 * Works outside React (uses getState()).
 */

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useFileStore } from "../../store/slices/fileSlice";
import { useHistoryStore } from "../../store/slices/historySlice";
import { useDependencyStore } from "../../store/slices/dependencySlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { deserializeGanttFile } from "./deserialize";
import type { ViewSettings } from "./types";
import { applyViewSettingsDefaults } from "../../config/viewSettingsDefaults";

export interface LoadFileResult {
  success: boolean;
  warnings?: string[];
  error?: string;
}

/** Toast handler compatible with react-hot-toast API */
export interface ToastHandler {
  success: (msg: string) => void;
  error: (msg: string) => void;
  (msg: string, opts?: { icon: string }): void;
}

/**
 * Load file content into the application stores.
 * Can be called from both React hooks and non-React contexts (e.g. LaunchQueue).
 *
 * Returns a plain LoadFileResult (not a Promise). Callers that `await` it
 * still work — `await` on a non-Promise resolves immediately.
 */
export function loadFileIntoApp(file: {
  name: string;
  content: string;
  size: number;
}): LoadFileResult {
  const parseResult = deserializeGanttFile(file.content, file.name, file.size);

  if (!parseResult.success || !parseResult.data) {
    return {
      success: false,
      error: parseResult.error?.message ?? "Unknown parse error",
    };
  }

  const { data } = parseResult;

  // Hydrate all stores inside a try/catch so callers get a structured
  // error result instead of an unhandled exception.
  //
  // Ordering rationale: lightweight, rarely-failing operations (file state,
  // history clear) run first so the app stays consistent even if a heavier
  // operation (updateScale) fails later.  A full rollback is not attempted
  // because valid data already passed the 6-layer validation pipeline and
  // store failures are exceptional.
  try {
    // 1. Reset tracking state & history first (lightweight, unlikely to fail)
    resetFileState(file.name, data.chartId, data.chartCreatedAt);
    useHistoryStore.getState().clearHistory();

    // 2. Load core data into stores
    useTaskStore.getState().setTasks(data.tasks);
    useDependencyStore.getState().setDependencies(data.dependencies || []);
    useUIStore.getState().resetExportOptions(data.exportSettings);

    // 3. Apply view settings with defaults for older file versions
    const viewSettings = applyViewSettingsDefaults(data.viewSettings);
    applyViewSettings(viewSettings);
    restoreColumnWidths(viewSettings);

    // 4. Update scale and signal completion (heaviest operation, runs last)
    const chartStore = useChartStore.getState();
    chartStore.updateScale(data.tasks);
    chartStore.signalFileLoaded();
  } catch (e) {
    return {
      success: false,
      error: `Failed to load file data: ${(e as Error).message}`,
    };
  }

  return {
    success: true,
    warnings: parseResult.warnings,
  };
}

/**
 * Apply view settings from file to chart store.
 * setViewSettings accepts Partial<SettableViewFields> and only reads
 * fields it knows about, so passing the full ViewSettings is safe —
 * taskTableWidth/columnWidths are handled separately in restoreColumnWidths.
 */
function applyViewSettings(viewSettings: ViewSettings): void {
  useChartStore.getState().setViewSettings(viewSettings);
}

/**
 * Restore column widths from file, or auto-fit if none were saved
 */
function restoreColumnWidths(viewSettings: ViewSettings): void {
  const taskStore = useTaskStore.getState();

  if (viewSettings.taskTableWidth !== undefined) {
    taskStore.setTaskTableWidth(viewSettings.taskTableWidth);
  }

  if (
    viewSettings.columnWidths &&
    Object.keys(viewSettings.columnWidths).length > 0
  ) {
    for (const [columnId, width] of Object.entries(viewSettings.columnWidths)) {
      taskStore.setColumnWidth(columnId, width);
    }
  } else {
    taskStore.autoFitColumn("name");
  }
}

/**
 * Reset file tracking state after loading
 */
function resetFileState(
  fileName: string,
  chartId: string,
  chartCreatedAt?: string
): void {
  const fileStore = useFileStore.getState();
  fileStore.setFileName(fileName);
  fileStore.setChartId(chartId);
  fileStore.setChartCreatedAt(chartCreatedAt ?? null);
  fileStore.setLastSaved(new Date());
  fileStore.markClean();
}

/**
 * Show toast notifications for load results.
 * Separated from core logic for testability.
 */
export function showLoadNotifications(
  result: LoadFileResult & { fileName: string },
  toast: ToastHandler
): void {
  if (!result.success) {
    toast.error(result.error ?? "Failed to open file");
    return;
  }

  if (result.warnings) {
    result.warnings.forEach((w) => toast(w, { icon: "\u2139\uFE0F" }));
  }

  toast.success(`Opened "${result.fileName}"`);
}
