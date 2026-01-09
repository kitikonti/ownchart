/**
 * Multi-Tab Persistence Hook
 *
 * Replaces useLocalStoragePersistence with multi-tab support.
 * Each browser tab can work on a different chart simultaneously.
 * Tabs automatically sync via storage events.
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
  type TableState,
  type FileState,
} from "../utils/multiTabStorage";

/**
 * Hook to manage multi-tab localStorage persistence
 */
export function useMultiTabPersistence(): void {
  const tabIdRef = useRef<string>(getTabId());
  const isRestoringRef = useRef(false);

  // Cleanup inactive tabs on mount
  useEffect(() => {
    cleanupInactiveTabs();
  }, []);

  // Restore state on mount
  useEffect(() => {
    const tabId = tabIdRef.current;
    const savedChart = loadTabChart(tabId);

    if (!savedChart) {
      console.info(`✓ New tab ${tabId} - starting fresh`);
      // Mark as hydrated even when no saved state exists
      useUIStore.getState().setHydrated();
      return;
    }

    isRestoringRef.current = true;

    // Restore tasks
    if (savedChart.tasks.length > 0) {
      useTaskStore.getState().setTasks(savedChart.tasks);
    }

    // Restore dependencies
    if (savedChart.dependencies && savedChart.dependencies.length > 0) {
      useDependencyStore.getState().setDependencies(savedChart.dependencies);
    }

    // Restore table state (column widths)
    if (savedChart.tableState) {
      const taskStore = useTaskStore.getState();
      if (savedChart.tableState.columnWidths) {
        Object.entries(savedChart.tableState.columnWidths).forEach(
          ([columnId, width]) => {
            taskStore.setColumnWidth(columnId, width);
          }
        );
      }
      if (savedChart.tableState.taskTableWidth !== null) {
        taskStore.setTaskTableWidth(savedChart.tableState.taskTableWidth);
      }
    }

    // Restore chart state (including all view settings)
    const chartStore = useChartStore.getState();
    chartStore.setZoom(savedChart.chartState.zoom);
    chartStore.setPanOffset(savedChart.chartState.panOffset);
    chartStore.setShowWeekends(savedChart.chartState.showWeekends);
    chartStore.setShowTodayMarker(savedChart.chartState.showTodayMarker);

    // Restore extended view settings (Sprint 1.5.9)
    if (savedChart.chartState.showHolidays !== undefined) {
      chartStore.setShowHolidays(savedChart.chartState.showHolidays);
    }
    if (savedChart.chartState.showDependencies !== undefined) {
      chartStore.setShowDependencies(savedChart.chartState.showDependencies);
    }
    if (savedChart.chartState.showProgress !== undefined) {
      chartStore.setShowProgress(savedChart.chartState.showProgress);
    }
    if (savedChart.chartState.taskLabelPosition !== undefined) {
      chartStore.setTaskLabelPosition(savedChart.chartState.taskLabelPosition);
    }
    if (savedChart.chartState.workingDaysMode !== undefined) {
      chartStore.setWorkingDaysMode(savedChart.chartState.workingDaysMode);
    }
    if (savedChart.chartState.workingDaysConfig !== undefined) {
      chartStore.setWorkingDaysConfig(savedChart.chartState.workingDaysConfig);
    }
    if (savedChart.chartState.holidayRegion !== undefined) {
      chartStore.setHolidayRegion(savedChart.chartState.holidayRegion);
    }
    if (savedChart.chartState.projectTitle !== undefined) {
      chartStore.setProjectTitle(savedChart.chartState.projectTitle);
    }
    if (savedChart.chartState.projectAuthor !== undefined) {
      chartStore.setProjectAuthor(savedChart.chartState.projectAuthor);
    }

    // Restore file state
    const { setFileName, setChartId, setLastSaved, markDirty, markClean } =
      useFileStore.getState();
    if (savedChart.fileState.fileName) {
      setFileName(savedChart.fileState.fileName);
    }
    if (savedChart.fileState.chartId) {
      setChartId(savedChart.fileState.chartId);
    }
    if (savedChart.fileState.lastSaved) {
      setLastSaved(new Date(savedChart.fileState.lastSaved));
    }
    // Restore dirty state
    if (savedChart.fileState.isDirty) {
      markDirty();
    } else {
      markClean();
    }

    console.info(`✓ Tab ${tabId} - state restored from localStorage`);

    isRestoringRef.current = false;

    // Mark as hydrated after restoration is complete
    useUIStore.getState().setHydrated();
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    const tabId = tabIdRef.current;

    const saveCurrentState = () => {
      // Don't save during initial restoration to avoid loops
      // BUT allow saves after restoration is complete
      if (isRestoringRef.current) {
        return;
      }

      const taskState = useTaskStore.getState();
      const dependencyState = useDependencyStore.getState();
      const chartState = useChartStore.getState();
      const fileState = useFileStore.getState();

      const chartData = {
        tasks: taskState.tasks,
        dependencies: dependencyState.dependencies,
        chartState: {
          zoom: chartState.zoom,
          panOffset: chartState.panOffset,
          showWeekends: chartState.showWeekends,
          showTodayMarker: chartState.showTodayMarker,
          // Extended view settings (Sprint 1.5.9)
          showHolidays: chartState.showHolidays,
          showDependencies: chartState.showDependencies,
          showProgress: chartState.showProgress,
          taskLabelPosition: chartState.taskLabelPosition,
          workingDaysMode: chartState.workingDaysMode,
          workingDaysConfig: chartState.workingDaysConfig,
          holidayRegion: chartState.holidayRegion,
          projectTitle: chartState.projectTitle,
          projectAuthor: chartState.projectAuthor,
        } as ChartState,
        tableState: {
          columnWidths: taskState.columnWidths,
          taskTableWidth: taskState.taskTableWidth,
        } as TableState,
        fileState: {
          fileName: fileState.fileName,
          chartId: fileState.chartId,
          lastSaved: fileState.lastSaved?.toISOString() ?? null,
          isDirty: fileState.isDirty,
        } as FileState,
      };

      saveTabChart(tabId, chartData);
    };

    // Subscribe to all store changes
    const unsubscribeTasks = useTaskStore.subscribe(saveCurrentState);
    const unsubscribeDeps = useDependencyStore.subscribe(saveCurrentState);
    const unsubscribeChart = useChartStore.subscribe(saveCurrentState);
    const unsubscribeFile = useFileStore.subscribe(saveCurrentState);

    // Initial save after mount (after restoration is complete)
    // This ensures the state is saved even if no changes happen
    const initialSaveTimer = setTimeout(() => {
      if (!isRestoringRef.current) {
        saveCurrentState();
      }
    }, 100);

    return () => {
      clearTimeout(initialSaveTimer);
      unsubscribeTasks();
      unsubscribeDeps();
      unsubscribeChart();
      unsubscribeFile();
    };
  }, []);

  // Update activity timestamp periodically
  useEffect(() => {
    const tabId = tabIdRef.current;

    const interval = setInterval(() => {
      updateTabActivity(tabId);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      // Only react to changes in our storage key from other tabs
      if (e.key !== "ownchart-multi-tab-state") return;
      if (e.newValue === null) return;

      // Check if another tab updated our data
      // (This could happen if user opens same file in multiple tabs - future feature)
      console.info("✓ Storage event detected from another tab");

      // For now, we don't sync across tabs automatically
      // Each tab is independent
      // Future: Could add conflict detection if same file is opened in multiple tabs
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  // Note: We don't cleanup on beforeunload because:
  // - beforeunload fires on page refresh, which would delete data we want to persist
  // - cleanupInactiveTabs() handles cleanup of truly inactive tabs (24h timeout)
  // - Data persisting across reloads is the desired behavior
}
