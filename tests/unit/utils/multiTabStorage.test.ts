import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateTabId,
  getTabId,
  loadMultiTabStorage,
  saveMultiTabStorage,
  loadTabChart,
  saveTabChart,
  updateTabActivity,
  removeTab,
  cleanupInactiveTabs,
  getActiveTabs,
  clearAllStorage,
  STORAGE_KEY,
  TAB_ID_KEY,
  LEGACY_V1_STORAGE_KEY,
  STORAGE_VERSION,
  type ChartState,
  type TabChartData,
  type MultiTabStorage,
} from "@/utils/multiTabStorage";
import type { ColorModeState } from "@/types/colorMode.types";

function createChartState(overrides?: Partial<ChartState>): ChartState {
  return {
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    showWeekends: true,
    showTodayMarker: true,
    ...overrides,
  };
}

function createTabChartData(
  tabId: string,
  overrides?: Partial<TabChartData>
): TabChartData {
  return {
    tabId,
    lastActive: Date.now(),
    tasks: [],
    dependencies: [],
    chartState: createChartState(),
    fileState: {
      fileName: null,
      chartId: null,
      lastSaved: null,
      isDirty: false,
    },
    ...overrides,
  };
}

/** Strip tabId and lastActive (added by saveTabChart) for the save call. */
function chartPayload(
  data: TabChartData
): Omit<TabChartData, "tabId" | "lastActive"> {
  const { tabId, lastActive, ...rest } = data;
  void tabId;
  void lastActive;
  return rest;
}

describe("multiTabStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateTabId", () => {
    it("should generate unique tab IDs", () => {
      const id1 = generateTabId();
      const id2 = generateTabId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^tab-\d+-[a-z0-9]+$/);
    });
  });

  describe("getTabId", () => {
    it("should create and persist a tab ID in sessionStorage", () => {
      const tabId = getTabId();
      expect(tabId).toMatch(/^tab-/);
      expect(sessionStorage.getItem(TAB_ID_KEY)).toBe(tabId);
    });

    it("should return the same tab ID on subsequent calls", () => {
      const first = getTabId();
      const second = getTabId();
      expect(first).toBe(second);
    });

    it("should regenerate tab ID if stored value has an invalid format", () => {
      sessionStorage.setItem(TAB_ID_KEY, "corrupted-id-without-tab-prefix");
      const tabId = getTabId();
      expect(tabId).toMatch(/^tab-/);
      expect(tabId).not.toBe("corrupted-id-without-tab-prefix");
    });
  });

  describe("loadMultiTabStorage / saveMultiTabStorage", () => {
    it("should return empty storage when nothing is saved", () => {
      const storage = loadMultiTabStorage();
      expect(storage).toEqual({ version: 2, charts: {} });
    });

    it("should round-trip storage data", () => {
      const storage: MultiTabStorage = {
        version: 2,
        charts: {
          "tab-1": createTabChartData("tab-1"),
        },
      };
      saveMultiTabStorage(storage);
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual(storage);
    });

    it("should return true on successful save", () => {
      const storage: MultiTabStorage = { version: 2, charts: {} };
      expect(saveMultiTabStorage(storage)).toBe(true);
    });

    it("should clear data on version mismatch and warn unconditionally", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 999, charts: { x: {} } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: STORAGE_VERSION, charts: {} });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("version mismatch")
      );
      warnSpy.mockRestore();
    });

    it("should handle corrupt JSON gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: 2, charts: {} });
    });

    it("should reset when charts field is missing", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2 }));
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: 2, charts: {} });
    });

    it("should reset when charts field is null", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: null })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: 2, charts: {} });
    });

    it("should reset when charts field is an array", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: [] })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: 2, charts: {} });
    });

    it("should discard entries with non-numeric zoom in chartState", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: "not-a-number", panOffset: {} },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries with non-boolean isDirty in fileState", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: 1, panOffset: {} },
        fileState: { isDirty: "yes" },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries with empty tabId", () => {
      const malformed = {
        tabId: "",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: 1, panOffset: {} },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts[""]).toBeUndefined();
    });

    it("should discard entries where tasks contains null items", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [null],
        dependencies: [],
        chartState: { zoom: 1, panOffset: { x: 0, y: 0 } },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where tasks contains primitive items", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: ["not-an-object"],
        dependencies: [],
        chartState: { zoom: 1, panOffset: { x: 0, y: 0 } },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where dependencies contains null items", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [null],
        chartState: { zoom: 1, panOffset: { x: 0, y: 0 } },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where panOffset is an array", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: 1, panOffset: [0, 0] },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where panOffset has non-numeric coordinates", () => {
      const malformed = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: 1, panOffset: { x: "left", y: 0 } },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": malformed } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
    });

    it("should accept entries with valid tasks and dependencies arrays", () => {
      const valid = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [{ id: "task-1", name: "Task 1" }],
        dependencies: [{ id: "dep-1", fromId: "task-1", toId: "task-2" }],
        chartState: {
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          showWeekends: true,
          showTodayMarker: true,
        },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, charts: { "tab-1": valid } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeDefined();
    });
  });

  describe("migrateFromV1 (via loadMultiTabStorage)", () => {
    const LEGACY_KEY = LEGACY_V1_STORAGE_KEY;

    it("should migrate valid v1 data to v2 format", () => {
      const v1Data = {
        version: 1,
        timestamp: Date.now(),
        tasks: [{ id: "task-1", name: "Task 1" }],
        chartState: {
          zoom: 2,
          panOffset: { x: 10, y: 0 },
          showWeekends: false,
          showTodayMarker: true,
        },
        fileState: {
          fileName: "test.ownchart",
          chartId: "chart-1",
          lastSaved: "2025-01-01T00:00:00.000Z",
        },
      };
      localStorage.setItem(LEGACY_KEY, JSON.stringify(v1Data));

      const storage = loadMultiTabStorage();

      expect(storage.version).toBe(2);
      const tabs = Object.values(storage.charts);
      expect(tabs).toHaveLength(1);

      const tab = tabs[0];
      expect(tab.tasks).toEqual(v1Data.tasks);
      expect(tab.chartState.zoom).toBe(2);
      expect(tab.chartState.showWeekends).toBe(false);
      expect(tab.fileState.fileName).toBe("test.ownchart");
      expect(tab.fileState.isDirty).toBe(false);
      expect(tab.dependencies).toEqual([]);

      // Old key must be removed after migration
      expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
      // New key must be written
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      // sessionStorage must contain the migrated tab ID
      expect(sessionStorage.getItem(TAB_ID_KEY)).toBe(tab.tabId);
    });

    it("should use defaults for missing tasks in v1 data", () => {
      const v1Data = {
        chartState: {
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          showWeekends: true,
          showTodayMarker: true,
        },
      };
      localStorage.setItem(LEGACY_KEY, JSON.stringify(v1Data));

      const storage = loadMultiTabStorage();
      const tab = Object.values(storage.charts)[0];

      expect(tab.tasks).toEqual([]);
      expect(tab.dependencies).toEqual([]);
    });

    it("should use default chart state when v1 chartState is missing", () => {
      localStorage.setItem(LEGACY_KEY, JSON.stringify({ tasks: [] }));

      const storage = loadMultiTabStorage();
      const tab = Object.values(storage.charts)[0];

      expect(tab.chartState.zoom).toBe(1);
      expect(tab.chartState.showWeekends).toBe(true);
      expect(tab.chartState.showTodayMarker).toBe(true);
    });

    it("should return empty storage when v1 data is corrupt JSON", () => {
      localStorage.setItem(LEGACY_KEY, "not-valid{{{json");

      const storage = loadMultiTabStorage();

      expect(storage).toEqual({ version: 2, charts: {} });
    });

    it("should return empty storage when neither v1 nor v2 data exists", () => {
      const storage = loadMultiTabStorage();
      expect(storage).toEqual({ version: 2, charts: {} });
    });

    it("should preserve v1 data when the migration save fails", () => {
      const v1Data = { tasks: [{ id: "task-1", name: "Task 1" }] };
      localStorage.setItem(LEGACY_KEY, JSON.stringify(v1Data));

      // Make the first setItem call (saveMultiTabStorage) throw
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      const storage = loadMultiTabStorage();

      // Returns empty rather than crashing
      expect(storage).toEqual({ version: 2, charts: {} });
      // v1 data must NOT have been deleted
      expect(localStorage.getItem(LEGACY_KEY)).not.toBeNull();
    });
  });

  describe("loadTabChart / saveTabChart", () => {
    it("should return null for unknown tab", () => {
      expect(loadTabChart("nonexistent")).toBeNull();
    });

    it("should save and load chart data for a tab", () => {
      const chartData = createTabChartData("tab-1");
      saveTabChart("tab-1", chartPayload(chartData));

      const loaded = loadTabChart("tab-1");
      expect(loaded).not.toBeNull();
      expect(loaded!.tabId).toBe("tab-1");
      expect(loaded!.chartState.zoom).toBe(1);
    });

    it("should return true on successful save", () => {
      const chartData = createTabChartData("tab-1");
      const result = saveTabChart("tab-1", chartPayload(chartData));
      expect(result).toBe(true);
    });
  });

  describe("ChartState with colorModeState", () => {
    it("should persist colorModeState through save/load", () => {
      const colorModeState: ColorModeState = {
        mode: "theme",
        themeOptions: {
          selectedPaletteId: null,
          customMonochromeBase: null,
        },
        summaryOptions: {
          useMilestoneAccent: true,
          milestoneAccentColor: "#CA8A04" as `#${string}`,
        },
        taskTypeOptions: {
          summaryColor: "#1a1a1a" as `#${string}`,
          taskColor: "#3b82f6" as `#${string}`,
          milestoneColor: "#CA8A04" as `#${string}`,
        },
        hierarchyOptions: {
          baseColor: "#3b82f6" as `#${string}`,
          lightenPercentPerLevel: 12,
          maxLightenPercent: 36,
        },
      };

      const chartData = createTabChartData("tab-1", {
        chartState: createChartState({ colorModeState }),
      });

      saveTabChart("tab-1", chartPayload(chartData));

      const loaded = loadTabChart("tab-1");
      expect(loaded!.chartState.colorModeState).toEqual(colorModeState);
      expect(loaded!.chartState.colorModeState!.mode).toBe("theme");
    });

    it("should handle missing colorModeState for backward compatibility", () => {
      const chartState = createChartState();
      // colorModeState is undefined by default
      expect(chartState.colorModeState).toBeUndefined();

      const chartData = createTabChartData("tab-1");
      saveTabChart("tab-1", chartPayload(chartData));

      const loaded = loadTabChart("tab-1");
      expect(loaded!.chartState.colorModeState).toBeUndefined();
    });
  });

  describe("updateTabActivity", () => {
    it("should update lastActive timestamp", () => {
      const chartData = createTabChartData("tab-1", {
        lastActive: 1000,
      });
      const storage: MultiTabStorage = {
        version: 2,
        charts: { "tab-1": chartData },
      };
      saveMultiTabStorage(storage);

      updateTabActivity("tab-1");

      const loaded = loadTabChart("tab-1");
      expect(loaded!.lastActive).toBeGreaterThan(1000);
    });

    it("should be a no-op for unknown tab", () => {
      updateTabActivity("nonexistent");
      const storage = loadMultiTabStorage();
      expect(storage.charts).toEqual({});
    });
  });

  describe("removeTab", () => {
    it("should remove a tab from storage", () => {
      const storage: MultiTabStorage = {
        version: 2,
        charts: {
          "tab-1": createTabChartData("tab-1"),
          "tab-2": createTabChartData("tab-2"),
        },
      };
      saveMultiTabStorage(storage);

      removeTab("tab-1");

      const loaded = loadMultiTabStorage();
      expect(loaded.charts["tab-1"]).toBeUndefined();
      expect(loaded.charts["tab-2"]).toBeDefined();
    });
  });

  describe("cleanupInactiveTabs", () => {
    it("should remove tabs older than 24 hours", () => {
      const dayAgo = Date.now() - 25 * 60 * 60 * 1000;
      const storage: MultiTabStorage = {
        version: 2,
        charts: {
          old: createTabChartData("old", { lastActive: dayAgo }),
          recent: createTabChartData("recent", { lastActive: Date.now() }),
        },
      };
      saveMultiTabStorage(storage);

      cleanupInactiveTabs();

      const loaded = loadMultiTabStorage();
      expect(loaded.charts["old"]).toBeUndefined();
      expect(loaded.charts["recent"]).toBeDefined();
    });
  });

  describe("getActiveTabs", () => {
    it("should return all tabs", () => {
      const storage: MultiTabStorage = {
        version: 2,
        charts: {
          "tab-1": createTabChartData("tab-1"),
          "tab-2": createTabChartData("tab-2"),
        },
      };
      saveMultiTabStorage(storage);

      const tabs = getActiveTabs();
      expect(tabs).toHaveLength(2);
    });
  });

  describe("clearAllStorage", () => {
    it("should remove all storage keys", () => {
      localStorage.setItem(STORAGE_KEY, "data");
      sessionStorage.setItem(TAB_ID_KEY, "tab-1");

      clearAllStorage();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(sessionStorage.getItem(TAB_ID_KEY)).toBeNull();
    });
  });

  describe("isValidTabEntry — fileState field types", () => {
    function makeEntry(fileStateOverrides: Record<string, unknown>) {
      return {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: {
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          showWeekends: true,
          showTodayMarker: true,
        },
        fileState: { isDirty: false, ...fileStateOverrides },
      };
    }

    it("should discard entries where fileName is a non-string, non-null value", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          charts: { "tab-1": makeEntry({ fileName: 42 }) },
        })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where chartId is a non-string, non-null value", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          charts: { "tab-1": makeEntry({ chartId: true }) },
        })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where lastSaved is a non-string, non-null value", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          charts: { "tab-1": makeEntry({ lastSaved: [] }) },
        })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeUndefined();
    });

    it("should accept entries where fileName, chartId, lastSaved are null", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          charts: {
            "tab-1": makeEntry({
              fileName: null,
              chartId: null,
              lastSaved: null,
            }),
          },
        })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeDefined();
    });

    it("should accept entries where fileName, chartId, lastSaved are strings", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: STORAGE_VERSION,
          charts: {
            "tab-1": makeEntry({
              fileName: "project.ownchart",
              chartId: "abc-123",
              lastSaved: "2025-01-01T00:00:00.000Z",
            }),
          },
        })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeDefined();
    });
  });

  describe("isValidTabEntry — chartState required boolean flags", () => {
    it("should discard entries where chartState is missing showWeekends", () => {
      const entry = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: 1, panOffset: { x: 0, y: 0 }, showTodayMarker: true },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, charts: { "tab-1": entry } })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeUndefined();
    });

    it("should discard entries where chartState is missing showTodayMarker", () => {
      const entry = {
        tabId: "tab-1",
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState: { zoom: 1, panOffset: { x: 0, y: 0 }, showWeekends: true },
        fileState: { isDirty: false },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, charts: { "tab-1": entry } })
      );
      expect(loadMultiTabStorage().charts["tab-1"]).toBeUndefined();
    });
  });

  describe("save failure handling", () => {
    it("updateTabActivity should not throw when save fails", () => {
      saveMultiTabStorage({
        version: STORAGE_VERSION,
        charts: { "tab-1": createTabChartData("tab-1") },
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => updateTabActivity("tab-1")).not.toThrow();
    });

    it("removeTab should not throw when save fails", () => {
      saveMultiTabStorage({
        version: STORAGE_VERSION,
        charts: { "tab-1": createTabChartData("tab-1") },
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => removeTab("tab-1")).not.toThrow();
    });

    it("cleanupInactiveTabs should not throw when save fails", () => {
      const dayAgo = Date.now() - 25 * 60 * 60 * 1000;
      saveMultiTabStorage({
        version: STORAGE_VERSION,
        charts: { old: createTabChartData("old", { lastActive: dayAgo }) },
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => cleanupInactiveTabs()).not.toThrow();
    });
  });
});
