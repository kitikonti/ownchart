/**
 * Multi-Tab Storage System
 *
 * Allows multiple browser tabs to run OwnChart simultaneously with different charts.
 * Each tab has a unique ID and stores its state in a shared localStorage structure.
 * Tabs synchronize via storage events when one tab updates.
 *
 * Storage Structure:
 * {
 *   version: 2,
 *   charts: {
 *     [tabId]: {
 *       tabId: string,
 *       lastActive: number,
 *       tasks: Task[],
 *       chartState: {...},
 *       fileState: {...}
 *     }
 *   }
 * }
 */

import type { Task } from "../types/chart.types";

const STORAGE_KEY = "ownchart-multi-tab-state";
const STORAGE_VERSION = 2;
const TAB_ID_KEY = "ownchart-tab-id";
const TAB_TIMEOUT_MS = 1000 * 60 * 60 * 24; // 24 hours - cleanup inactive tabs

export interface ChartState {
  zoom: number;
  panOffset: { x: number; y: number };
  showWeekends: boolean;
  showTodayMarker: boolean;
}

export interface FileState {
  fileName: string | null;
  chartId: string | null;
  lastSaved: string | null;
  isDirty: boolean;
}

export interface TabChartData {
  tabId: string;
  lastActive: number;
  tasks: Task[];
  chartState: ChartState;
  fileState: FileState;
}

export interface MultiTabStorage {
  version: number;
  charts: Record<string, TabChartData>;
}

/**
 * Generate a unique tab ID
 */
export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get or create tab ID for this browser tab
 * Tab ID is stored in sessionStorage (persists across page refreshes in same tab)
 */
export function getTabId(): string {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
}

/**
 * Migrate from old single-tab storage (v1) to multi-tab storage (v2)
 */
function migrateFromV1(): MultiTabStorage {
  try {
    // Try to load old storage format
    const oldKey = "gantt-app-state";
    const oldStored = localStorage.getItem(oldKey);

    if (!oldStored) {
      return {
        version: STORAGE_VERSION,
        charts: {},
      };
    }

    const oldData = JSON.parse(oldStored) as {
      version: number;
      timestamp: number;
      tasks: Task[];
      chartState: ChartState;
      fileState: {
        fileName: string | null;
        chartId: string | null;
        lastSaved: string | null;
      };
    };

    console.info("✓ Migrating from v1 storage to v2 multi-tab storage");

    // Create new tab for migrated data
    const migratedTabId = generateTabId();
    const newStorage: MultiTabStorage = {
      version: STORAGE_VERSION,
      charts: {
        [migratedTabId]: {
          tabId: migratedTabId,
          lastActive: Date.now(),
          tasks: oldData.tasks || [],
          chartState: oldData.chartState || {
            zoom: 1,
            panOffset: { x: 0, y: 0 },
            showWeekends: true,
            showTodayMarker: true,
          },
          fileState: {
            fileName: oldData.fileState?.fileName || null,
            chartId: oldData.fileState?.chartId || null,
            lastSaved: oldData.fileState?.lastSaved || null,
            isDirty: false,
          },
        },
      },
    };

    // Save migrated data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStorage));

    // Remove old storage
    localStorage.removeItem(oldKey);

    // Set this tab's ID to the migrated tab
    sessionStorage.setItem(TAB_ID_KEY, migratedTabId);

    console.info(
      `✓ Migration complete - your data is preserved in tab ${migratedTabId}`
    );

    return newStorage;
  } catch (error) {
    console.error("Failed to migrate v1 storage:", error);
    return {
      version: STORAGE_VERSION,
      charts: {},
    };
  }
}

/**
 * Load entire multi-tab storage from localStorage
 */
export function loadMultiTabStorage(): MultiTabStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // Check if old v1 storage exists
      const oldStored = localStorage.getItem("gantt-app-state");
      if (oldStored) {
        return migrateFromV1();
      }

      return {
        version: STORAGE_VERSION,
        charts: {},
      };
    }

    const data = JSON.parse(stored) as MultiTabStorage;

    // Version check
    if (data.version !== STORAGE_VERSION) {
      console.warn("Storage version mismatch, clearing old data");
      return {
        version: STORAGE_VERSION,
        charts: {},
      };
    }

    return data;
  } catch (error) {
    console.error("Failed to load multi-tab storage:", error);
    return {
      version: STORAGE_VERSION,
      charts: {},
    };
  }
}

/**
 * Save entire multi-tab storage to localStorage
 */
export function saveMultiTabStorage(storage: MultiTabStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save multi-tab storage:", error);
  }
}

/**
 * Load chart data for current tab
 */
export function loadTabChart(tabId: string): TabChartData | null {
  const storage = loadMultiTabStorage();
  return storage.charts[tabId] || null;
}

/**
 * Save chart data for current tab
 */
export function saveTabChart(
  tabId: string,
  chartData: Omit<TabChartData, "tabId" | "lastActive">
): void {
  const storage = loadMultiTabStorage();

  storage.charts[tabId] = {
    tabId,
    lastActive: Date.now(),
    ...chartData,
  };

  saveMultiTabStorage(storage);
}

/**
 * Update last active timestamp for this tab
 */
export function updateTabActivity(tabId: string): void {
  const storage = loadMultiTabStorage();

  if (storage.charts[tabId]) {
    storage.charts[tabId].lastActive = Date.now();
    saveMultiTabStorage(storage);
  }
}

/**
 * Remove tab from storage (called on tab close)
 */
export function removeTab(tabId: string): void {
  const storage = loadMultiTabStorage();
  delete storage.charts[tabId];
  saveMultiTabStorage(storage);
}

/**
 * Cleanup inactive tabs (older than TAB_TIMEOUT_MS)
 */
export function cleanupInactiveTabs(): void {
  const storage = loadMultiTabStorage();
  const now = Date.now();
  let cleaned = false;

  Object.keys(storage.charts).forEach((tabId) => {
    const tab = storage.charts[tabId];
    if (now - tab.lastActive > TAB_TIMEOUT_MS) {
      delete storage.charts[tabId];
      cleaned = true;
    }
  });

  if (cleaned) {
    saveMultiTabStorage(storage);
    console.info("✓ Cleaned up inactive tabs");
  }
}

/**
 * Get all active tabs
 */
export function getActiveTabs(): TabChartData[] {
  const storage = loadMultiTabStorage();
  return Object.values(storage.charts);
}

/**
 * Clear all storage (development/debugging)
 */
export function clearAllStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TAB_ID_KEY);
}
