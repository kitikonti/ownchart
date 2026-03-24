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

import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import type { ColorModeState } from "@/types/colorMode.types";
import type { Dependency } from "@/types/dependency.types";
import type { ProjectLogo } from "@/types/logo.types";

export const STORAGE_KEY = "ownchart-multi-tab-state";
export const LEGACY_V1_STORAGE_KEY = "gantt-app-state";
/**
 * Bump this only when the storage schema changes in a breaking way.
 *
 * Migration checklist for bumping STORAGE_VERSION (e.g. 2 → 3):
 *  1. Implement `migrateFromV2(oldData, tabId)` mirroring `buildV2FromV1`.
 *  2. Add a `data.version === 2` branch inside `validateStorageRoot` that calls
 *     it; only reset storage for truly unknown versions (< 2 or > CURRENT).
 *  3. Add tests for the new migration path.
 *  4. Keep old migration helpers for reference — never delete them.
 */
export const STORAGE_VERSION = 2;
export const TAB_ID_KEY = "ownchart-tab-id";
const TAB_TIMEOUT_MS = 1000 * 60 * 60 * 24; // 24 hours - cleanup inactive tabs
const TAB_ID_SUFFIX_LENGTH = 7; // random alphanumeric chars appended to tab ID
// Pre-compiled regex for tab ID validation (matches the output of generateTabId)
const TAB_ID_REGEX = /^tab-\d+-[a-z0-9]+$/;

export interface ChartState {
  zoom: number;
  // DEPRECATED: pixel-based, device-dependent. Kept for reading old localStorage entries.
  panOffset: { x: number; y: number };
  // ISO date at left viewport edge — device-independent scroll position restore
  viewAnchorDate?: string;
  // Vertical scroll position in pixels (restored on outer scroll container)
  scrollTop?: number;
  showWeekends: boolean;
  showTodayMarker: boolean;
  // Additional view settings (Sprint 1.5.9)
  showHolidays?: boolean;
  showDependencies?: boolean;
  showProgress?: boolean;
  autoScheduling?: boolean;
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
  projectLogo?: ProjectLogo | null;
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
  // Skip "0." prefix of toString(36) and take TAB_ID_SUFFIX_LENGTH random alphanumeric chars
  return `tab-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 2 + TAB_ID_SUFFIX_LENGTH)}`;
}

/**
 * Get or create tab ID for this browser tab.
 * Tab ID is stored in sessionStorage (persists across page refreshes in same tab).
 * Validates the stored ID format before returning to guard against corruption.
 */
export function getTabId(): string {
  const stored = sessionStorage.getItem(TAB_ID_KEY);

  if (stored && TAB_ID_REGEX.test(stored)) {
    return stored;
  }

  if (stored && import.meta.env.DEV) {
    console.warn(
      `getTabId: stored tab ID "${stored}" failed format validation — regenerating`
    );
  }

  const tabId = generateTabId();
  sessionStorage.setItem(TAB_ID_KEY, tabId);
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
 * Returns true if every item in the array is a non-null plain object.
 * Guards against null, primitive, or nested-array items in tasks/dependencies.
 */
function arePlainObjects(arr: unknown[]): boolean {
  return arr.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item)
  );
}

/**
 * Returns true if the chartState record has the required structural shape,
 * including a valid panOffset with numeric x/y coordinates.
 */
function isValidChartStateShape(cs: Record<string, unknown>): boolean {
  if (typeof cs.zoom !== "number") return false;
  if (typeof cs.showWeekends !== "boolean") return false;
  if (typeof cs.showTodayMarker !== "boolean") return false;
  if (
    !cs.panOffset ||
    typeof cs.panOffset !== "object" ||
    Array.isArray(cs.panOffset)
  ) {
    return false;
  }
  const po = cs.panOffset as Record<string, unknown>;
  if (typeof po.x !== "number" || typeof po.y !== "number") return false;
  // viewAnchorDate is optional — if present, must be a string (ISO date)
  if (cs.viewAnchorDate != null && typeof cs.viewAnchorDate !== "string") {
    return false;
  }
  return true;
}

/**
 * Type guard for a single TabChartData entry read from localStorage.
 * Guards against corrupt or manually-edited storage reaching callers.
 * Validates the outer shape, required inner fields of chartState/fileState,
 * and that tasks/dependencies contain only plain objects — so callers can
 * safely access all of these without further checks.
 */
function isValidTabEntry(entry: unknown): entry is TabChartData {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
  const e = entry as Record<string, unknown>;

  if (
    typeof e.tabId !== "string" ||
    e.tabId.length === 0 ||
    typeof e.lastActive !== "number" ||
    !Array.isArray(e.tasks) ||
    !Array.isArray(e.dependencies)
  ) {
    return false;
  }

  // Validate array items are plain objects (guards against null/primitive items)
  if (
    !arePlainObjects(e.tasks as unknown[]) ||
    !arePlainObjects(e.dependencies as unknown[])
  ) {
    return false;
  }

  // Validate required inner fields of chartState
  if (
    !e.chartState ||
    typeof e.chartState !== "object" ||
    Array.isArray(e.chartState) ||
    !isValidChartStateShape(e.chartState as Record<string, unknown>)
  ) {
    return false;
  }

  // Validate required inner fields of fileState
  if (
    !e.fileState ||
    typeof e.fileState !== "object" ||
    Array.isArray(e.fileState)
  ) {
    return false;
  }
  const fs = e.fileState as Record<string, unknown>;
  if (typeof fs.isDirty !== "boolean") return false;
  // Validate string | null fields — wrong types (e.g. numbers) pass JSON parse
  // but would cause runtime errors if callers invoke string methods on them.
  // Use loose != null so that missing fields (undefined) are also accepted for
  // backwards-compatibility with storage written before these fields existed.
  if (fs.fileName != null && typeof fs.fileName !== "string") return false;
  if (fs.chartId != null && typeof fs.chartId !== "string") return false;
  if (fs.lastSaved != null && typeof fs.lastSaved !== "string") return false;
  return true;
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
      if (import.meta.env.DEV) {
        console.warn("v1 storage data could not be parsed — starting fresh");
      }
      return { version: STORAGE_VERSION, charts: {} };
    }

    const migratedTabId = generateTabId();
    const newStorage = buildV2FromV1(oldData, migratedTabId);

    if (import.meta.env.DEV) {
      console.info("✓ Migrating from v1 storage to v2 multi-tab storage");
    }

    // Guard deletion on a successful save: if the write fails (e.g. quota
    // exceeded) we must NOT delete the v1 data — it's the only copy.
    const saved = saveMultiTabStorage(newStorage);
    if (!saved) {
      console.error("Migration save failed — v1 data preserved in place");
      return { version: STORAGE_VERSION, charts: {} };
    }

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
 * Filter the raw charts map to only valid entries, discarding malformed ones.
 * Extracted to keep loadMultiTabStorage under the 50-line guideline.
 */
function filterValidTabEntries(
  rawCharts: Record<string, unknown>
): Record<string, TabChartData> {
  const validated: Record<string, TabChartData> = {};

  for (const [tabId, entry] of Object.entries(rawCharts)) {
    if (isValidTabEntry(entry)) {
      validated[tabId] = entry;
    } else if (import.meta.env.DEV) {
      console.warn(
        `Multi-tab storage: discarding malformed entry for tab "${tabId}"`
      );
    }
  }

  return validated;
}

/**
 * Validates the root structure of parsed localStorage data and returns the
 * raw charts map, or null if the structure is invalid.
 *
 * The version-mismatch warning is unconditional (not DEV-only) because
 * silently discarding all chart data is a significant event that users should
 * be able to observe in production DevTools. See the STORAGE_VERSION migration
 * checklist above before bumping the version number.
 *
 * Callers should return an empty MultiTabStorage when this returns null.
 */
function validateStorageRoot(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    if (import.meta.env.DEV) {
      console.warn(
        "Multi-tab storage: root value is not a plain object — resetting"
      );
    }
    return null;
  }

  const data = parsed as Record<string, unknown>;

  if (data.version !== STORAGE_VERSION) {
    console.warn(
      `Multi-tab storage: version mismatch (expected ${STORAGE_VERSION}, ` +
        `got ${String(data.version)}) — resetting. ` +
        "If you recently updated the app, this is expected."
    );
    return null;
  }

  // Structural guard — corrupt or tampered data must not crash callers that
  // call Object.keys/values on charts (getActiveTabs, cleanupInactiveTabs, etc.)
  if (
    !data.charts ||
    typeof data.charts !== "object" ||
    Array.isArray(data.charts)
  ) {
    // Unconditional (not DEV-only) for the same reason as the version-mismatch
    // warning above: silently resetting all chart data is a significant event
    // that users should be able to observe in production DevTools.
    console.warn(
      'Multi-tab storage: "charts" field is invalid — resetting to empty'
    );
    return null;
  }

  return data.charts as Record<string, unknown>;
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

    // Never trust data from user-controlled storage — parse then validate
    const rawCharts = validateStorageRoot(JSON.parse(stored));
    if (!rawCharts) {
      return { version: STORAGE_VERSION, charts: {} };
    }

    return {
      version: STORAGE_VERSION,
      charts: filterValidTabEntries(rawCharts),
    };
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

  if (!storage.charts[tabId]) {
    if (import.meta.env.DEV) {
      console.warn(`updateTabActivity: tab "${tabId}" not found in storage`);
    }
    return;
  }

  storage.charts[tabId].lastActive = Date.now();
  if (!saveMultiTabStorage(storage)) {
    console.error(
      `updateTabActivity: failed to persist activity for tab "${tabId}"`
    );
  }
}

/**
 * Remove tab from storage (called on tab close)
 */
export function removeTab(tabId: string): void {
  const storage = loadMultiTabStorage();
  delete storage.charts[tabId];
  if (!saveMultiTabStorage(storage)) {
    console.error(
      `removeTab: failed to persist storage after removing tab "${tabId}"`
    );
  }
}

/**
 * Cleanup inactive tabs (older than TAB_TIMEOUT_MS)
 */
export function cleanupInactiveTabs(): void {
  const storage = loadMultiTabStorage();
  const now = Date.now();
  let cleaned = false;

  for (const tabId of Object.keys(storage.charts)) {
    const tab = storage.charts[tabId];
    if (now - tab.lastActive > TAB_TIMEOUT_MS) {
      delete storage.charts[tabId];
      cleaned = true;
    }
  }

  if (cleaned) {
    if (!saveMultiTabStorage(storage)) {
      console.error(
        "cleanupInactiveTabs: failed to persist storage after cleanup"
      );
    } else if (import.meta.env.DEV) {
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
