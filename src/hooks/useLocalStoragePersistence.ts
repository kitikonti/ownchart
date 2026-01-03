/**
 * Hook to persist and restore app state from localStorage
 * Automatically saves state on changes and restores on app load
 */

import { useEffect } from "react";
import { useTaskStore } from "../store/slices/taskSlice";
import { useChartStore } from "../store/slices/chartSlice";
import { useFileStore } from "../store/slices/fileSlice";

const STORAGE_KEY = "gantt-app-state";
const STORAGE_VERSION = 1;

interface PersistedState {
  version: number;
  timestamp: number;
  tasks: ReturnType<typeof useTaskStore.getState>["tasks"];
  chartState: {
    zoom: number;
    panOffset: { x: number; y: number };
    showWeekends: boolean;
    showTodayMarker: boolean;
  };
  fileState: {
    fileName: string | null;
    chartId: string | null;
    lastSaved: string | null; // ISO string
  };
}

/**
 * Save current state to localStorage
 */
function saveToLocalStorage(): void {
  try {
    const taskState = useTaskStore.getState();
    const chartState = useChartStore.getState();
    const fileState = useFileStore.getState();

    const state: PersistedState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      tasks: taskState.tasks,
      chartState: {
        zoom: chartState.zoom,
        panOffset: chartState.panOffset,
        showWeekends: chartState.showWeekends,
        showTodayMarker: chartState.showTodayMarker,
      },
      fileState: {
        fileName: fileState.fileName,
        chartId: fileState.chartId,
        lastSaved: fileState.lastSaved?.toISOString() ?? null,
      },
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
  }
}

/**
 * Load state from localStorage
 */
function loadFromLocalStorage(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as PersistedState;

    // Version check
    if (state.version !== STORAGE_VERSION) {
      console.warn("localStorage version mismatch, clearing old data");
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
    return null;
  }
}

/**
 * Clear localStorage (used when opening a new file)
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage:", error);
  }
}

/**
 * Hook to manage localStorage persistence
 */
export function useLocalStoragePersistence(): void {
  // Restore state on mount
  useEffect(() => {
    const state = loadFromLocalStorage();
    if (!state) return;

    // Restore tasks
    if (state.tasks.length > 0) {
      useTaskStore.getState().setTasks(state.tasks);
    }

    // Restore chart state
    const { setZoom, setPanOffset, setShowWeekends, setShowTodayMarker } =
      useChartStore.getState();
    setZoom(state.chartState.zoom);
    setPanOffset(state.chartState.panOffset);
    setShowWeekends(state.chartState.showWeekends);
    setShowTodayMarker(state.chartState.showTodayMarker);

    // Restore file state
    const { setFileName, setChartId, setLastSaved } = useFileStore.getState();
    if (state.fileState.fileName) {
      setFileName(state.fileState.fileName);
    }
    if (state.fileState.chartId) {
      setChartId(state.fileState.chartId);
    }
    if (state.fileState.lastSaved) {
      setLastSaved(new Date(state.fileState.lastSaved));
    }

    console.info("✓ State restored from localStorage");
  }, []);

  // Subscribe to state changes and save to localStorage
  useEffect(() => {
    // Subscribe to task store changes
    const unsubscribeTasks = useTaskStore.subscribe(() => {
      saveToLocalStorage();
    });

    // Subscribe to chart store changes
    const unsubscribeChart = useChartStore.subscribe(() => {
      saveToLocalStorage();
    });

    // Subscribe to file store changes
    const unsubscribeFile = useFileStore.subscribe(() => {
      saveToLocalStorage();
    });

    return () => {
      unsubscribeTasks();
      unsubscribeChart();
      unsubscribeFile();
    };
  }, []);
}
