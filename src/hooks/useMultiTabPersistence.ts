/**
 * Multi-Tab Persistence Hook
 *
 * Replaces useLocalStoragePersistence with multi-tab support.
 * Each browser tab can work on a different chart simultaneously.
 * Each tab persists to its own localStorage key; there is no live cross-tab sync.
 */

import { useEffect, useRef } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useFileStore } from "../store/slices/fileSlice";
import { useDependencyStore } from "../store/slices/dependencySlice";
import { useUIStore } from "../store/slices/uiSlice";
import {
  getTabId,
  loadTabChart,
  saveTabChart,
  updateTabActivity,
  cleanupInactiveTabs,
  type ChartState,
  type TabChartData,
} from "../utils/multiTabStorage";

const SAVE_DEBOUNCE_MS = 200;
const ACTIVITY_UPDATE_INTERVAL_MS = 60_000;
const INITIAL_SAVE_DELAY_MS = 100;

// ---------------------------------------------------------------------------
// Pure helper functions (module-level, no closure over hook state)
// ---------------------------------------------------------------------------

function restoreTableState(tableState: TabChartData["tableState"]): void {
  if (!tableState) return;
  const taskStore = useTaskStore.getState();
  if (tableState.columnWidths) {
    Object.entries(tableState.columnWidths).forEach(([columnId, width]) => {
      taskStore.setColumnWidth(columnId, width);
    });
  }
  if (tableState.taskTableWidth !== null) {
    taskStore.setTaskTableWidth(tableState.taskTableWidth);
  }
}

function restoreChartState(chartState: ChartState): void {
  const store = useChartStore.getState();

  // Always-present fields
  store.setZoom(chartState.zoom);
  store.setPanOffset(chartState.panOffset);
  store.setShowWeekends(chartState.showWeekends);
  store.setShowTodayMarker(chartState.showTodayMarker);

  // Optional fields added in Sprint 1.5.9 — may be absent in older saves
  if (chartState.showHolidays !== undefined)
    store.setShowHolidays(chartState.showHolidays);
  if (chartState.showDependencies !== undefined)
    store.setShowDependencies(chartState.showDependencies);
  if (chartState.showProgress !== undefined)
    store.setShowProgress(chartState.showProgress);
  if (chartState.taskLabelPosition !== undefined)
    store.setTaskLabelPosition(chartState.taskLabelPosition);
  if (chartState.workingDaysConfig !== undefined)
    store.setWorkingDaysConfig(chartState.workingDaysConfig); // auto-derives workingDaysMode
  if (chartState.holidayRegion !== undefined)
    store.setHolidayRegion(chartState.holidayRegion);
  if (chartState.projectTitle !== undefined)
    store.setProjectTitle(chartState.projectTitle);
  if (chartState.projectAuthor !== undefined)
    store.setProjectAuthor(chartState.projectAuthor);
  if (chartState.hiddenColumns !== undefined)
    store.setHiddenColumns(chartState.hiddenColumns);
  if (chartState.isTaskTableCollapsed !== undefined)
    store.setTaskTableCollapsed(chartState.isTaskTableCollapsed);
  if (chartState.hiddenTaskIds !== undefined)
    store.setHiddenTaskIds(chartState.hiddenTaskIds);
  if (chartState.colorModeState !== undefined)
    store.setColorModeState(chartState.colorModeState);
}

function restoreFileState(fileState: TabChartData["fileState"]): void {
  const { setFileName, setChartId, setLastSaved, markDirty, markClean } =
    useFileStore.getState();
  if (fileState.fileName) setFileName(fileState.fileName);
  if (fileState.chartId) setChartId(fileState.chartId);
  if (fileState.lastSaved) {
    const parsed = new Date(fileState.lastSaved);
    if (!isNaN(parsed.getTime())) setLastSaved(parsed);
  }
  if (fileState.isDirty) markDirty();
  else markClean();
}

/** Restore all stores from a saved chart. Throws on unexpected errors. */
function restoreStateFromChart(savedChart: TabChartData): void {
  if (savedChart.tasks.length > 0) {
    useTaskStore.getState().setTasks(savedChart.tasks);
  }
  if (savedChart.dependencies && savedChart.dependencies.length > 0) {
    useDependencyStore.getState().setDependencies(savedChart.dependencies);
  }
  restoreTableState(savedChart.tableState);
  restoreChartState(savedChart.chartState);
  restoreFileState(savedChart.fileState);
}

/** Build the full save payload from current store state. */
function buildSavePayload(): Omit<TabChartData, "tabId" | "lastActive"> {
  const taskState = useTaskStore.getState();
  const dependencyState = useDependencyStore.getState();
  const chartState = useChartStore.getState();
  const fileState = useFileStore.getState();

  return {
    tasks: taskState.tasks,
    dependencies: dependencyState.dependencies,
    chartState: {
      zoom: chartState.zoom,
      panOffset: chartState.panOffset,
      showWeekends: chartState.showWeekends,
      showTodayMarker: chartState.showTodayMarker,
      showHolidays: chartState.showHolidays,
      showDependencies: chartState.showDependencies,
      showProgress: chartState.showProgress,
      taskLabelPosition: chartState.taskLabelPosition,
      workingDaysMode: chartState.workingDaysMode,
      workingDaysConfig: chartState.workingDaysConfig,
      holidayRegion: chartState.holidayRegion,
      projectTitle: chartState.projectTitle,
      projectAuthor: chartState.projectAuthor,
      hiddenColumns: chartState.hiddenColumns,
      isTaskTableCollapsed: chartState.isTaskTableCollapsed,
      hiddenTaskIds: chartState.hiddenTaskIds,
      colorModeState: chartState.colorModeState,
    },
    tableState: {
      columnWidths: taskState.columnWidths,
      taskTableWidth: taskState.taskTableWidth,
    },
    fileState: {
      fileName: fileState.fileName,
      chartId: fileState.chartId,
      lastSaved: fileState.lastSaved?.toISOString() ?? null,
      isDirty: fileState.isDirty,
    },
  };
}

// ---------------------------------------------------------------------------
// Private sub-hooks (not exported — used only by useMultiTabPersistence)
// ---------------------------------------------------------------------------

function useTabCleanupOnMount(): void {
  useEffect(() => {
    cleanupInactiveTabs();
  }, []);
}

function useTabRestore(
  tabIdRef: { current: string },
  isRestoringRef: { current: boolean }
): void {
  useEffect(() => {
    const tabId = tabIdRef.current;
    const savedChart = loadTabChart(tabId);

    if (!savedChart) {
      // Mark as hydrated even when no saved state exists
      useUIStore.getState().setHydrated();
      return;
    }

    isRestoringRef.current = true;
    try {
      restoreStateFromChart(savedChart);
    } catch (error) {
      console.error("[useMultiTabPersistence] Failed to restore state:", error);
    } finally {
      isRestoringRef.current = false;
      // Mark as hydrated after restoration attempt (success or partial failure)
      useUIStore.getState().setHydrated();
    }
  }, []); // tabIdRef and isRestoringRef are stable refs
}

function useTabAutoSave(
  tabIdRef: { current: string },
  isRestoringRef: { current: boolean },
  saveTimerRef: { current: ReturnType<typeof setTimeout> | null }
): void {
  useEffect(() => {
    const tabId = tabIdRef.current;

    const saveCurrentState = (): void => {
      // Don't save during initial restoration to avoid overwriting restored state
      // with stale defaults. The initial mount path is safe because useTabRestore
      // runs its effect before useTabAutoSave sets up subscriptions (effects run
      // in declaration order). The guard matters on remount — e.g. React StrictMode
      // double-invoke — where subscriptions may fire before restoration completes.
      if (isRestoringRef.current) return;

      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        saveTabChart(tabId, buildSavePayload());
      }, SAVE_DEBOUNCE_MS);
    };

    // Subscribe to all store changes
    const unsubscribeTasks = useTaskStore.subscribe(saveCurrentState);
    const unsubscribeDeps = useDependencyStore.subscribe(saveCurrentState);
    const unsubscribeChart = useChartStore.subscribe(saveCurrentState);
    const unsubscribeFile = useFileStore.subscribe(saveCurrentState);

    // Initial save after a short delay to let restoration settle.
    const initialSaveTimer = setTimeout(() => {
      if (!isRestoringRef.current) {
        saveTabChart(tabId, buildSavePayload());
      }
    }, INITIAL_SAVE_DELAY_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      clearTimeout(initialSaveTimer);
      unsubscribeTasks();
      unsubscribeDeps();
      unsubscribeChart();
      unsubscribeFile();
    };
  }, []); // tabIdRef, isRestoringRef, saveTimerRef are stable refs
}

function useTabHeartbeat(tabIdRef: { current: string }): void {
  useEffect(() => {
    const tabId = tabIdRef.current;

    const interval = setInterval(() => {
      updateTabActivity(tabId);
    }, ACTIVITY_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []); // tabIdRef is a stable ref
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to manage multi-tab localStorage persistence
 */
export function useMultiTabPersistence(): void {
  const tabIdRef = useRef<string>(getTabId());
  const isRestoringRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useTabCleanupOnMount();
  useTabRestore(tabIdRef, isRestoringRef);
  useTabAutoSave(tabIdRef, isRestoringRef, saveTimerRef);
  useTabHeartbeat(tabIdRef);

  // Note: We don't cleanup on beforeunload because:
  // - beforeunload fires on page refresh, which would delete data we want to persist
  // - cleanupInactiveTabs() handles cleanup of truly inactive tabs (24h timeout)
  // - Data persisting across reloads is the desired behavior
}
