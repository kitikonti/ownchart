import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMultiTabPersistence } from "../../../src/hooks/useMultiTabPersistence";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useUIStore } from "../../../src/store/slices/uiSlice";
import {
  saveTabChart,
  type ChartState,
  type FileState,
  type TableState,
} from "../../../src/utils/multiTabStorage";
import { DEFAULT_COLOR_MODE_STATE } from "../../../src/config/colorModeDefaults";
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

function seedTabStorage(
  tabId: string,
  chartStateOverrides?: Partial<ChartState>
): void {
  // Set the tab ID so the hook finds this data
  sessionStorage.setItem(TAB_ID_KEY, tabId);

  const chartState = createChartState(chartStateOverrides);
  const data = {
    version: 2,
    charts: {
      [tabId]: {
        tabId,
        lastActive: Date.now(),
        tasks: [],
        dependencies: [],
        chartState,
        fileState: {
          fileName: null,
          chartId: null,
          lastSaved: null,
          isDirty: false,
        } as FileState,
      },
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

describe("useMultiTabPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    // Reset all stores to defaults
    useChartStore.setState({
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showWeekends: true,
      showTodayMarker: true,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      colorModeState: { ...DEFAULT_COLOR_MODE_STATE },
      hiddenColumns: [],
      isTaskTableCollapsed: false,
      hiddenTaskIds: [],
    });

    useUIStore.setState({ isHydrated: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("restore on mount", () => {
    it("should mark hydrated when no saved state exists", () => {
      renderHook(() => useMultiTabPersistence());
      expect(useUIStore.getState().isHydrated).toBe(true);
    });

    it("should restore colorModeState from localStorage", () => {
      const themeColorMode: ColorModeState = {
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

      seedTabStorage("tab-test", { colorModeState: themeColorMode });

      renderHook(() => useMultiTabPersistence());

      const restored = useChartStore.getState().colorModeState;
      expect(restored.mode).toBe("theme");
      expect(restored).toEqual(themeColorMode);
    });

    it("should keep default colorModeState when not in saved data", () => {
      // Seed without colorModeState (backward compat)
      seedTabStorage("tab-test", {});

      renderHook(() => useMultiTabPersistence());

      const restored = useChartStore.getState().colorModeState;
      expect(restored.mode).toBe("manual");
    });

    it("should restore basic chart settings", () => {
      seedTabStorage("tab-test", {
        zoom: 2.5,
        panOffset: { x: 100, y: 50 },
        showWeekends: false,
      });

      renderHook(() => useMultiTabPersistence());

      const state = useChartStore.getState();
      expect(state.zoom).toBe(2.5);
      expect(state.panOffset).toEqual({ x: 100, y: 50 });
      expect(state.showWeekends).toBe(false);
    });
  });

  describe("save on state change", () => {
    it("should persist colorModeState when it changes", async () => {
      const tabId = "tab-save-test";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      renderHook(() => useMultiTabPersistence());

      // Wait for initial save timer
      await vi.waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).not.toBeNull();
      });

      // Change color mode
      useChartStore.getState().setColorModeState({
        ...DEFAULT_COLOR_MODE_STATE,
        mode: "hierarchy",
      });

      // Verify it was saved
      await vi.waitFor(() => {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        const saved = stored.charts[tabId];
        expect(saved.chartState.colorModeState.mode).toBe("hierarchy");
      });
    });
  });

  describe("colorModeState round-trip", () => {
    it("should survive save → reload → restore cycle", () => {
      const tabId = "tab-roundtrip";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      const customColorMode: ColorModeState = {
        mode: "taskType",
        themeOptions: {
          selectedPaletteId: null,
          customMonochromeBase: null,
        },
        summaryOptions: {
          useMilestoneAccent: false,
          milestoneAccentColor: "#FF0000" as `#${string}`,
        },
        taskTypeOptions: {
          summaryColor: "#111111" as `#${string}`,
          taskColor: "#222222" as `#${string}`,
          milestoneColor: "#333333" as `#${string}`,
        },
        hierarchyOptions: {
          baseColor: "#444444" as `#${string}`,
          lightenPercentPerLevel: 15,
          maxLightenPercent: 45,
        },
      };

      // Simulate a previous session having saved this data
      saveTabChart(tabId, {
        tasks: [],
        dependencies: [],
        chartState: createChartState({ colorModeState: customColorMode }),
        fileState: {
          fileName: null,
          chartId: null,
          lastSaved: null,
          isDirty: false,
        } as FileState,
        tableState: {
          columnWidths: {},
          taskTableWidth: null,
        } as TableState,
      });

      // "Reload" — render the hook, it should restore
      renderHook(() => useMultiTabPersistence());

      const restored = useChartStore.getState().colorModeState;
      expect(restored).toEqual(customColorMode);
      expect(restored.mode).toBe("taskType");
      expect(restored.summaryOptions.useMilestoneAccent).toBe(false);
      expect(restored.taskTypeOptions.taskColor).toBe("#222222");
      expect(restored.hierarchyOptions.lightenPercentPerLevel).toBe(15);
    });
  });
});
