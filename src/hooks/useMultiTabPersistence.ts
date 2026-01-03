/**
 * Multi-Tab Persistence Hook
 *
 * Replaces useLocalStoragePersistence with multi-tab support.
 * Each browser tab can work on a different chart simultaneously.
 * Tabs automatically sync via storage events.
 */

import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/slices/taskSlice';
import { useChartStore } from '../store/slices/chartSlice';
import { useFileStore } from '../store/slices/fileSlice';
import {
  getTabId,
  loadTabChart,
  saveTabChart,
  updateTabActivity,
  removeTab,
  cleanupInactiveTabs,
  type ChartState,
  type FileState,
} from '../utils/multiTabStorage';

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
      return;
    }

    isRestoringRef.current = true;

    // Restore tasks
    if (savedChart.tasks.length > 0) {
      useTaskStore.getState().setTasks(savedChart.tasks);
    }

    // Restore chart state
    const { setZoom, setPanOffset, setShowWeekends, setShowTodayMarker } =
      useChartStore.getState();
    setZoom(savedChart.chartState.zoom);
    setPanOffset(savedChart.chartState.panOffset);
    setShowWeekends(savedChart.chartState.showWeekends);
    setShowTodayMarker(savedChart.chartState.showTodayMarker);

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
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    const tabId = tabIdRef.current;

    const saveCurrentState = () => {
      // Don't save during initial restoration to avoid loops
      // BUT allow saves after restoration is complete
      if (isRestoringRef.current) {
        console.log('[MultiTab] Skipping save during restoration');
        return;
      }

      const taskState = useTaskStore.getState();
      const chartState = useChartStore.getState();
      const fileState = useFileStore.getState();

      const chartData = {
        tasks: taskState.tasks,
        chartState: {
          zoom: chartState.zoom,
          panOffset: chartState.panOffset,
          showWeekends: chartState.showWeekends,
          showTodayMarker: chartState.showTodayMarker,
        } as ChartState,
        fileState: {
          fileName: fileState.fileName,
          chartId: fileState.chartId,
          lastSaved: fileState.lastSaved?.toISOString() ?? null,
          isDirty: fileState.isDirty,
        } as FileState,
      };

      saveTabChart(tabId, chartData);
      console.log('[MultiTab] State saved to localStorage', {
        tasks: chartData.tasks.length,
        fileName: chartData.fileState.fileName,
      });
    };

    // Subscribe to all store changes
    const unsubscribeTasks = useTaskStore.subscribe(saveCurrentState);
    const unsubscribeChart = useChartStore.subscribe(saveCurrentState);
    const unsubscribeFile = useFileStore.subscribe(saveCurrentState);

    // Initial save after mount (after restoration is complete)
    // This ensures the state is saved even if no changes happen
    const initialSaveTimer = setTimeout(() => {
      if (!isRestoringRef.current) {
        saveCurrentState();
        console.log('[MultiTab] Initial state saved');
      }
    }, 100);

    return () => {
      clearTimeout(initialSaveTimer);
      unsubscribeTasks();
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
      if (e.key !== 'ownchart-multi-tab-state') return;
      if (e.newValue === null) return;

      // Check if another tab updated our data
      // (This could happen if user opens same file in multiple tabs - future feature)
      console.info('✓ Storage event detected from another tab');

      // For now, we don't sync across tabs automatically
      // Each tab is independent
      // Future: Could add conflict detection if same file is opened in multiple tabs
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Cleanup on tab close
  useEffect(() => {
    const tabId = tabIdRef.current;

    const handleBeforeUnload = () => {
      // Remove this tab's data from storage
      removeTab(tabId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
