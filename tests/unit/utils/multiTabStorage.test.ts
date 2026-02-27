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
  type ChartState,
  type TabChartData,
  type MultiTabStorage,
} from "../../../src/utils/multiTabStorage";
import type { ColorModeState } from "../../../src/types/colorMode.types";

const STORAGE_KEY = "ownchart-multi-tab-state";
const TAB_ID_KEY = "ownchart-tab-id";

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

    it("should clear data on version mismatch", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 999, charts: { x: {} } })
      );
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: 2, charts: {} });
    });

    it("should handle corrupt JSON gracefully", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
      const loaded = loadMultiTabStorage();
      expect(loaded).toEqual({ version: 2, charts: {} });
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
});
