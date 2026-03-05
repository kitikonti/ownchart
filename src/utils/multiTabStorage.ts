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
import type { TaskId } from "../types/branded.types";
import type { ColorModeState } from "../types/colorMode.types";
import type { Dependency } from "../types/dependency.types";

const STORAGE_KEY = "ownchart-multi-tab-state";
const LEGACY_V1_STORAGE_KEY = "gantt-app-state";
const STORAGE_VERSION = 2;
const TAB_ID_KEY = "ownchart-tab-id";
const TAB_TIMEOUT_MS = 1000 * 60 * 60 * 24; // 24 hours - cleanup inactive tabs

export interface ChartState {
  zoom: number;
  panOffset: { x: number; y: number };
  showWeekends: boolean;
  showTodayMarker: boolean;
  // Additional view settings (Sprint 1.5.9)
  showHolidays?: boolean;
  showDependencies?: boolean;
  showProgress?: boolean;
  taskLabelPosition?: "before" | "inside" | "after" | "none";
  workingDaysMode?: boolean;
  workingDaysConfig?: {
    excludeSaturday: boolean;
    excludeSunday: boolean;
    excludeHolidays: boolean;
  };
  holidayRegion?: string;
  projectTitle?: string;
  projectAuthor?: string;
  hiddenColumns?: string[];
  isTaskTableCollapsed?: boolean;
  hiddenTaskIds?: TaskId[];
  colorModeState?: ColorModeState;
}

export interface FileState {
  fileName: string | null;
  chartId: string | null;
  lastSaved: string | null;
  isDirty: boolean;
}

export interface TableState {
  columnWidths: Record<string, number>;
  taskTableWidth: number | null;
}

export interface TabChartData {
  tabId: string;
  lastActive: number;
  tasks: Task[];
  dependencies: Dependency[];
  chartState: ChartState;
  tableState?: TableState; // Optional for backwards compatibility
  fileState: FileState;
}

export interface MultiTabStorage {
  version: number;
  charts: Record<string, TabChartData>;
}

/**
 * Shape of the legacy v1 storage format (gantt-app-state key).
 * All fields are optional since old data may be incomplete.
 */
interface V1StorageData {
  tasks?: Task[];
  chartState?: Partial<ChartState>;
  fileState?: {
    fileName?: string | null;
    chartId?: string | null;
    lastSaved?: string | null;
  };
}

// ─── Tab ID ───────────────────────────────────────────────────────────────────

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

// ─── V1 Migration Helpers ─────────────────────────────────────────────────────

/**
 * Parse the raw v1 localStorage string into a typed structure.
 * Returns null if the string is not valid JSON or not a plain object.
 */
function parseV1StorageData(raw: string): V1StorageData | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as V1StorageData;
  } catch {
    return null;
  }
}

/**
 * Minimal required fields for a fresh chart state.
 * Optional ChartState fields are intentionally omitted — they default to
 * undefined (feature-disabled) and are populated by individual features
 * when first configured by the user.
 */
const DEFAULT_CHART_STATE: ChartState = {
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showWeekends: true,
  showTodayMarker: true,
};

/**
 * Build a fresh v2 MultiTabStorage from parsed v1 data for the given tab ID.
 */
function buildV2FromV1(oldData: V1StorageData, tabId: string): MultiTabStorage {
  return {
    version: STORAGE_VERSION,
    charts: {
      [tabId]: {
        tabId,
        lastActive: Date.now(),
        tasks: oldData.tasks ?? [],
        dependencies: [],
        chartState: oldData.chartState
          ? { ...DEFAULT_CHART_STATE, ...oldData.chartState }
          : { ...DEFAULT_CHART_STATE },
        fileState: {
          fileName: oldData.fileState?.fileName ?? null,
          chartId: oldData.fileState?.chartId ?? null,
          lastSaved: oldData.fileState?.lastSaved ?? null,
          isDirty: false,
        },
      },
    },
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Type guard for a single TabChartData entry read from localStorage.
 * Guards against corrupt or manually-edited storage reaching callers.
 */
function isValidTabEntry(entry: unknown): entry is TabChartData {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.tabId === "string" &&
    typeof e.lastActive === "number" &&
    Array.isArray(e.tasks) &&
    Array.isArray(e.dependencies) &&
    e.chartState !== null &&
    typeof e.chartState === "object" &&
    e.fileState !== null &&
    typeof e.fileState === "object"
  );
}

// ─── Core Storage Operations ──────────────────────────────────────────────────

/**
 * Migrate from old single-tab storage (v1) to multi-tab storage (v2)
 */
function migrateFromV1(): MultiTabStorage {
  try {
    const oldStored = localStorage.getItem(LEGACY_V1_STORAGE_KEY);
    if (!oldStored) {
      return { version: STORAGE_VERSION, charts: {} };
    }

    const oldData = parseV1StorageData(oldStored);
    if (!oldData) {
      console.warn("v1 storage data could not be parsed — starting fresh");
      return { version: STORAGE_VERSION, charts: {} };
    }

    const migratedTabId = generateTabId();
    const newStorage = buildV2FromV1(oldData, migratedTabId);

    if (import.meta.env.DEV) {
      console.info("✓ Migrating from v1 storage to v2 multi-tab storage");
    }

    saveMultiTabStorage(newStorage);
    localStorage.removeItem(LEGACY_V1_STORAGE_KEY);
    sessionStorage.setItem(TAB_ID_KEY, migratedTabId);

    if (import.meta.env.DEV) {
      console.info(
        `✓ Migration complete — data preserved in tab ${migratedTabId}`
      );
    }

    return newStorage;
  } catch (error) {
    console.error("Failed to migrate v1 storage:", error);
    return { version: STORAGE_VERSION, charts: {} };
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
      if (localStorage.getItem(LEGACY_V1_STORAGE_KEY)) {
        return migrateFromV1();
      }

      return { version: STORAGE_VERSION, charts: {} };
    }

    // Parse as unknown first — never trust data from user-controlled storage
    const parsed: unknown = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn(
        "Multi-tab storage: root value is not a plain object — resetting"
      );
      return { version: STORAGE_VERSION, charts: {} };
    }

    const data = parsed as Record<string, unknown>;

    // Version check
    if (data.version !== STORAGE_VERSION) {
      console.warn("Storage version mismatch, clearing old data");
      return { version: STORAGE_VERSION, charts: {} };
    }

    // Structural guard — corrupt or tampered data must not crash callers that
    // call Object.keys/values on charts (getActiveTabs, cleanupInactiveTabs, etc.)
    if (
      !data.charts ||
      typeof data.charts !== "object" ||
      Array.isArray(data.charts)
    ) {
      console.warn(
        'Multi-tab storage: "charts" field is invalid — resetting to empty'
      );
      return { version: STORAGE_VERSION, charts: {} };
    }

    // Per-entry validation — discard malformed entries rather than crashing
    // callers that rely on fields like lastActive, tasks, chartState, etc.
    const rawCharts = data.charts as Record<string, unknown>;
    const validatedCharts: Record<string, TabChartData> = {};

    for (const [tabId, entry] of Object.entries(rawCharts)) {
      if (isValidTabEntry(entry)) {
        validatedCharts[tabId] = entry;
      } else {
        console.warn(
          `Multi-tab storage: discarding malformed entry for tab "${tabId}"`
        );
      }
    }

    return { version: STORAGE_VERSION, charts: validatedCharts };
  } catch (error) {
    console.error("Failed to load multi-tab storage:", error);
    return { version: STORAGE_VERSION, charts: {} };
  }
}

/**
 * Save entire multi-tab storage to localStorage.
 * Returns true on success, false if the write failed (e.g. quota exceeded).
 */
export function saveMultiTabStorage(storage: MultiTabStorage): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    return true;
  } catch (error) {
    console.error("Failed to save multi-tab storage:", error);
    return false;
  }
}

// ─── Per-Tab Operations ───────────────────────────────────────────────────────

/**
 * Load chart data for current tab
 */
export function loadTabChart(tabId: string): TabChartData | null {
  const storage = loadMultiTabStorage();
  return storage.charts[tabId] ?? null;
}

/**
 * Save chart data for current tab.
 * Returns true on success, false if the write failed (e.g. quota exceeded).
 */
export function saveTabChart(
  tabId: string,
  chartData: Omit<TabChartData, "tabId" | "lastActive">
): boolean {
  const storage = loadMultiTabStorage();

  storage.charts[tabId] = {
    tabId,
    lastActive: Date.now(),
    ...chartData,
  };

  return saveMultiTabStorage(storage);
}

/**
 * Update last active timestamp for this tab
 */
export function updateTabActivity(tabId: string): void {
  const storage = loadMultiTabStorage();

  if (storage.charts[tabId]) {
    storage.charts[tabId].lastActive = Date.now();
    saveMultiTabStorage(storage);
  } else if (import.meta.env.DEV) {
    console.warn(`updateTabActivity: tab "${tabId}" not found in storage`);
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
    if (import.meta.env.DEV) {
      console.info("✓ Cleaned up inactive tabs");
    }
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
 * Clear all storage.
 * @internal For use in tests and development tooling only.
 */
export function clearAllStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TAB_ID_KEY);
}
