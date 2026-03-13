/**
 * Multi-Tab Persistence Hook
 *
 * Replaces useLocalStoragePersistence with multi-tab support.
 * Each browser tab can work on a different chart simultaneously.
 * Each tab persists to its own localStorage key; there is no live cross-tab sync.
 */

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useChartStore } from "@/store/slices/chartSlice";
import { useFileStore } from "@/store/slices/fileSlice";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { useUIStore } from "@/store/slices/uiSlice";
import {
  getTabId,
  loadTabChart,
  saveTabChart,
  updateTabActivity,
  cleanupInactiveTabs,
  type ChartState,
  type TabChartData,
} from "@/utils/multiTabStorage";

const SAVE_DEBOUNCE_MS = 200;
const ACTIVITY_UPDATE_INTERVAL_MS = 60_000;
const INITIAL_SAVE_DELAY_MS = 100;

// ---------------------------------------------------------------------------
// Pure helper functions (module-level, no closure over hook state)
// ---------------------------------------------------------------------------

/** Apply `value` to `setter` only if `value` is not undefined.
 * Reduces the boilerplate of optional-field restoration in restoreChartState. */
function applyIfDefined<T>(value: T | undefined, setter: (v: T) => void): void {
  if (value !== undefined) setter(value);
}

/**
 * Subscribe `callback` to all persisted stores. Returns a single unsubscribe.
 * UIStore is intentionally excluded — its state is transient (dialogs, panels)
 * and must not be persisted to localStorage.
 */
function subscribePersistedStores(callback: () => void): () => void {
  const unsub1 = useTaskStore.subscribe(callback);
  const unsub2 = useDependencyStore.subscribe(callback);
  const unsub3 = useChartStore.subscribe(callback);
  const unsub4 = useFileStore.subscribe(callback);
  return () => {
    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
}

function restoreTableState(tableState: TabChartData["tableState"]): void {
  if (!tableState) return;
  const taskStore = useTaskStore.getState();
  if (tableState.columnWidths) {
    Object.entries(tableState.columnWidths).forEach(([columnId, width]) => {
      taskStore.setColumnWidth(columnId, width);
    });
  }
  // Skip when null (field present but unset) or undefined (old save that
  // predates this field). != null covers both cases explicitly.
  if (tableState.taskTableWidth != null) {
    taskStore.setTaskTableWidth(tableState.taskTableWidth);
  }
}

/**
 * NOTE: Keep in sync with buildSavePayload — every ChartState field restored
 * here must be written by that function. Always-present fields are restored
 * directly; fields added in later sprints use applyIfDefined so older saves
 * that lack them fall back to the current store default rather than overwriting
 * it with undefined.
 */
function restoreChartState(chartState: ChartState): void {
  const store = useChartStore.getState();

  // Always-present fields
  store.setZoom(chartState.zoom);
  store.setPanOffset(chartState.panOffset);
  store.setShowWeekends(chartState.showWeekends);
  store.setShowTodayMarker(chartState.showTodayMarker);

  // Optional fields added in Sprint 1.5.9 — may be absent in older saves
  applyIfDefined(chartState.showHolidays, store.setShowHolidays);
  applyIfDefined(chartState.showDependencies, store.setShowDependencies);
  applyIfDefined(chartState.showProgress, store.setShowProgress);
  applyIfDefined(chartState.taskLabelPosition, store.setTaskLabelPosition);
  applyIfDefined(chartState.holidayRegion, store.setHolidayRegion);
  applyIfDefined(chartState.projectTitle, store.setProjectTitle);
  applyIfDefined(chartState.projectAuthor, store.setProjectAuthor);
  applyIfDefined(chartState.hiddenColumns, store.setHiddenColumns);
  applyIfDefined(chartState.isTaskTableCollapsed, store.setTaskTableCollapsed);
  applyIfDefined(chartState.hiddenTaskIds, store.setHiddenTaskIds);
  applyIfDefined(chartState.colorModeState, store.setColorModeState);

  // Cannot use applyIfDefined — setWorkingDaysConfig auto-derives workingDaysMode
  // from the config object and must always be called as a unit.
  if (chartState.workingDaysConfig !== undefined) {
    store.setWorkingDaysConfig(chartState.workingDaysConfig);
  }
}

function restoreFileState(fileState: TabChartData["fileState"]): void {
  const { setFileName, setChartId, setLastSaved, markDirty, markClean } =
    useFileStore.getState();
  if (fileState.fileName != null) setFileName(fileState.fileName);
  if (fileState.chartId != null) setChartId(fileState.chartId);
  if (fileState.lastSaved != null) {
    const parsed = new Date(fileState.lastSaved);
    if (!isNaN(parsed.getTime())) setLastSaved(parsed);
  }
  // isDirty is absent from saves that predate this field — treat as clean,
  // which is the safe default (nothing unsaved to warn about).
  if (fileState.isDirty) markDirty();
  else markClean();
}

/** Restore all stores from a saved chart. Throws on unexpected errors. */
function restoreStateFromChart(savedChart: TabChartData): void {
  // Always restore tasks — even an empty array is valid saved state (user
  // cleared all tasks).  Skipping the restore when tasks is [] would leave
  // any default/demo tasks visible on reload, which would be incorrect.
  useTaskStore.getState().setTasks(savedChart.tasks);

  // dependencies may be absent in very old saves that predate the field; fall
  // back to [] so a previously-cleared dependency list is also restored correctly.
  useDependencyStore.getState().setDependencies(savedChart.dependencies ?? []);
  restoreTableState(savedChart.tableState);
  restoreChartState(savedChart.chartState);
  restoreFileState(savedChart.fileState);
}

/**
 * Build the full save payload from current store state.
 * NOTE: Keep in sync with restoreChartState — every ChartState field added here
 * must also be restored there (use applyIfDefined for optional/sprint-gated fields).
 */
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
    // Set before try so the finally block always resets it and calls
    // setHydrated — even if loadTabChart throws unexpectedly.
    isRestoringRef.current = true;
    try {
      const savedChart = loadTabChart(tabId);
      if (savedChart) {
        restoreStateFromChart(savedChart);
      }
    } catch (error) {
      // intentional: surface restore failures in the browser console for
      // debugging; the app continues with default state after the toast above.
      console.error(
        "[useMultiTabPersistence] Failed to restore state for tab:",
        tabId,
        error
      );
      // Inform the user that their previous session could not be restored.
      // The app continues with default state; the next autosave will overwrite
      // the corrupted entry so future loads will be clean.
      toast.error("Could not restore your previous session. Starting fresh.");
    } finally {
      isRestoringRef.current = false;
      // Mark as hydrated after restoration attempt (success or partial failure)
      useUIStore.getState().setHydrated();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabIdRef and isRestoringRef are stable refs
  }, []);
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
    const unsubscribeAll = subscribePersistedStores(saveCurrentState);

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
      unsubscribeAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabIdRef, isRestoringRef, saveTimerRef are stable refs
  }, []);
}

function useTabHeartbeat(tabIdRef: { current: string }): void {
  useEffect(() => {
    const tabId = tabIdRef.current;

    const interval = setInterval(() => {
      updateTabActivity(tabId);
    }, ACTIVITY_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabIdRef is a stable ref
  }, []);
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
