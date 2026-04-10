import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMultiTabPersistence } from "@/hooks/useMultiTabPersistence";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { useUIStore } from "@/store/slices/uiSlice";
import { useFileStore } from "@/store/slices/fileSlice";
import type { Task } from "@/types/chart.types";
import { toTaskId } from "@/types/branded.types";

function makeTask(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id: toTaskId(id),
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 9,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    ...overrides,
  };
}
import {
  saveTabChart,
  STORAGE_KEY,
  TAB_ID_KEY,
  type ChartState,
  type FileState,
  type TableState,
} from "@/utils/multiTabStorage";
import { DEFAULT_COLOR_MODE_STATE } from "@/config/colorModeDefaults";
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
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.clear();
    sessionStorage.clear();

    // Reset all stores to defaults
    useChartStore.setState({
      zoom: 1,
      viewAnchorDate: null,
      showWeekends: true,
      showTodayMarker: true,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      colorModeState: { ...DEFAULT_COLOR_MODE_STATE },
      hiddenColumns: [],
      isTaskTableCollapsed: false,
      hiddenTaskIds: [],
      workingDaysMode: false,
      workingDaysConfig: {
        excludeSaturday: false,
        excludeSunday: false,
        excludeHolidays: false,
      },
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

      seedTabStorage("tab-1111111111-test001", { colorModeState: themeColorMode });

      renderHook(() => useMultiTabPersistence());

      const restored = useChartStore.getState().colorModeState;
      expect(restored.mode).toBe("theme");
      expect(restored).toEqual(themeColorMode);
    });

    it("should keep default colorModeState when not in saved data", () => {
      // Seed without colorModeState (backward compat)
      seedTabStorage("tab-1111111111-test001", {});

      renderHook(() => useMultiTabPersistence());

      const restored = useChartStore.getState().colorModeState;
      expect(restored.mode).toBe("manual");
    });

    it("should restore basic chart settings", () => {
      seedTabStorage("tab-1111111111-test001", {
        zoom: 2.5,
        panOffset: { x: 100, y: 50 },
        viewAnchorDate: "2025-03-15",
        showWeekends: false,
      });

      renderHook(() => useMultiTabPersistence());

      const state = useChartStore.getState();
      expect(state.zoom).toBe(2.5);
      expect(state.viewAnchorDate).toBe("2025-03-15");
      expect(state.showWeekends).toBe(false);
    });

    it("should mark hydrated even when no saved state exists", () => {
      renderHook(() => useMultiTabPersistence());
      expect(useUIStore.getState().isHydrated).toBe(true);
    });

    it("should mark hydrated even when restore throws an error", () => {
      seedTabStorage("tab-error");

      // Force setZoom to throw so we can verify finally-block runs
      vi.spyOn(useChartStore.getState(), "setZoom").mockImplementation(() => {
        throw new Error("simulated restore failure");
      });

      // Should not throw — error is caught, hydrated is still set
      expect(() => renderHook(() => useMultiTabPersistence())).not.toThrow();
      expect(useUIStore.getState().isHydrated).toBe(true);
    });

    it("should restore tableState column widths from localStorage", () => {
      const tabId = "tab-1000000001-col0001";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      const columnWidths = { name: 220, startDate: 100, endDate: 100 };
      const data = {
        version: 2,
        charts: {
          [tabId]: {
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
            } as FileState,
            tableState: {
              columnWidths,
              taskTableWidth: null,
            } as TableState,
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      renderHook(() => useMultiTabPersistence());

      const restored = useTaskStore.getState().columnWidths;
      expect(restored["name"]).toBe(220);
      expect(restored["startDate"]).toBe(100);
      expect(restored["endDate"]).toBe(100);
    });

    it("should restore an empty task list, clearing any pre-existing tasks", () => {
      // Regression: restoreStateFromChart previously had a `tasks.length > 0`
      // guard that skipped setTasks([]) — leaving default/demo tasks visible
      // after the user had cleared them in a previous session.
      const tabId = "tab-1000000002-tsk0001";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      // Pre-populate the store to simulate default/demo tasks being present
      useTaskStore.getState().setTasks([makeTask("default-1")]);
      expect(useTaskStore.getState().tasks).toHaveLength(1);

      // Seed storage with an explicitly empty task list (user cleared all tasks)
      seedTabStorage(tabId); // tasks: [] is the default in seedTabStorage

      renderHook(() => useMultiTabPersistence());

      // The empty saved state must overwrite the default tasks
      expect(useTaskStore.getState().tasks).toHaveLength(0);
    });

    it("should restore empty dependencies, clearing any pre-existing ones", () => {
      // Regression: the `dependencies && dependencies.length > 0` guard would
      // skip setDependencies([]) — leaving stale dependencies after the user
      // had cleared them in a previous session.
      const tabId = "tab-1000000003-dep0001";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      // Pre-populate the dependency store
      useTaskStore.getState().setTasks([makeTask("t1"), makeTask("t2")]);
      useDependencyStore
        .getState()
        .addDependency(toTaskId("t1"), toTaskId("t2"));
      expect(useDependencyStore.getState().dependencies).toHaveLength(1);

      // Seed storage with an explicitly empty dependency list
      seedTabStorage(tabId); // dependencies: [] is the default in seedTabStorage

      renderHook(() => useMultiTabPersistence());

      // The empty saved state must clear the pre-existing dependency
      expect(useDependencyStore.getState().dependencies).toHaveLength(0);
    });

    it("should restore fileName, chartId, and isDirty from fileState", () => {
      const tabId = "tab-1000000004-fil0001";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      // Reset fileStore so previous test state doesn't bleed through
      useFileStore.setState({
        fileName: null,
        chartId: null,
        isDirty: false,
        lastSaved: null,
        chartCreatedAt: null,
      });

      const data = {
        version: 2,
        charts: {
          [tabId]: {
            tabId,
            lastActive: Date.now(),
            tasks: [],
            dependencies: [],
            chartState: createChartState(),
            fileState: {
              fileName: "my-chart.ownchart",
              chartId: "chart-abc123",
              lastSaved: null,
              isDirty: true,
            } as FileState,
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      renderHook(() => useMultiTabPersistence());

      const fileState = useFileStore.getState();
      expect(fileState.fileName).toBe("my-chart.ownchart");
      expect(fileState.chartId).toBe("chart-abc123");
      expect(fileState.isDirty).toBe(true);
    });

    it("should skip invalid lastSaved date without crashing", () => {
      const tabId = "tab-bad-date";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      useFileStore.setState({
        fileName: null,
        chartId: null,
        isDirty: false,
        lastSaved: null,
        chartCreatedAt: null,
      });

      const data = {
        version: 2,
        charts: {
          [tabId]: {
            tabId,
            lastActive: Date.now(),
            tasks: [],
            dependencies: [],
            chartState: createChartState(),
            fileState: {
              fileName: null,
              chartId: null,
              lastSaved: "not-a-valid-date",
              isDirty: false,
            } as FileState,
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      expect(() => renderHook(() => useMultiTabPersistence())).not.toThrow();
      expect(useUIStore.getState().isHydrated).toBe(true);
      // setLastSaved should not have been called — lastSaved stays null
      expect(useFileStore.getState().lastSaved).toBeNull();
    });

    it("should not call setTaskTableWidth when taskTableWidth is null", () => {
      const tabId = "tab-null-width";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      const setWidthSpy = vi.spyOn(
        useTaskStore.getState(),
        "setTaskTableWidth"
      );

      const data = {
        version: 2,
        charts: {
          [tabId]: {
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
            } as FileState,
            tableState: {
              columnWidths: {},
              taskTableWidth: null,
            } as TableState,
          },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      renderHook(() => useMultiTabPersistence());

      // taskTableWidth null coerces to undefined via ?? — applyIfDefined skips it
      expect(setWidthSpy).not.toHaveBeenCalled();
    });

    it("should mark hydrated and not throw when loadTabChart itself throws", async () => {
      // Simulate an unexpected error thrown by loadTabChart (e.g. from
      // loadMultiTabStorage in a future code path that doesn't swallow errors).
      // Before F001 fix: loadTabChart was called outside the try-catch, so this
      // would leave the app permanently unhydrated with an uncaught error.
      const storageModule = await import(
        "../../../src/utils/multiTabStorage"
      );
      vi.spyOn(storageModule, "loadTabChart").mockImplementationOnce(() => {
        throw new Error("Unexpected storage error");
      });

      expect(() => renderHook(() => useMultiTabPersistence())).not.toThrow();
      expect(useUIStore.getState().isHydrated).toBe(true);
    });

    it("should not block saves when restore throws an error", async () => {
      const tabId = "tab-1000000005-err0001";
      sessionStorage.setItem(TAB_ID_KEY, tabId);
      seedTabStorage(tabId);

      vi.spyOn(useChartStore.getState(), "setZoom").mockImplementationOnce(
        () => {
          throw new Error("simulated restore failure");
        }
      );

      renderHook(() => useMultiTabPersistence());

      // Change state — should be saved (isRestoringRef was reset in finally)
      act(() => {
        useChartStore.getState().setShowWeekends(false);
      });

      await vi.waitFor(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) throw new Error("not saved yet");
        const parsed = JSON.parse(stored);
        const chart = parsed.charts[tabId];
        if (!chart) throw new Error("tab not saved yet");
        expect(chart.chartState.showWeekends).toBe(false);
      });
    });
  });

  describe("save on state change", () => {
    it("should persist colorModeState when it changes", async () => {
      const tabId = "tab-1234567890-abcdef7";
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

    it("should debounce rapid saves into a single write", async () => {
      const tabId = "tab-debounce-test";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      const saveTabChartSpy = vi.spyOn(
        await import("@/utils/multiTabStorage"),
        "saveTabChart"
      );

      renderHook(() => useMultiTabPersistence());

      // Wait for initial save
      await vi.waitFor(() => expect(saveTabChartSpy).toHaveBeenCalled());
      const callsAfterInit = saveTabChartSpy.mock.calls.length;

      // Trigger multiple rapid state changes
      act(() => {
        useChartStore.getState().setShowWeekends(false);
        useChartStore.getState().setShowWeekends(true);
        useChartStore.getState().setShowWeekends(false);
        useChartStore.getState().setShowTodayMarker(false);
      });

      // Wait for debounce to flush
      await vi.waitFor(
        () => {
          expect(saveTabChartSpy.mock.calls.length).toBeGreaterThan(
            callsAfterInit
          );
        },
        { timeout: 500 }
      );

      // The 4 rapid changes should have been coalesced into fewer saves
      const callsFromChanges =
        saveTabChartSpy.mock.calls.length - callsAfterInit;
      expect(callsFromChanges).toBeLessThan(4);
    });
  });

  describe("colorModeState round-trip", () => {
    it("should survive save → reload → restore cycle", () => {
      const tabId = "tab-9876543210-abc1234";
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

  describe("working-days settings persistence (#82 item 26)", () => {
    it("should auto-derive workingDaysMode=true when config has exclusions", () => {
      // The hook restores workingDaysConfig via setWorkingDaysConfig,
      // which auto-derives workingDaysMode from the exclusion flags.
      const config = {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: false,
      };
      seedTabStorage("tab-1111111111-wdmode", { workingDaysConfig: config });

      renderHook(() => useMultiTabPersistence());

      // Verify config was restored
      const state = useChartStore.getState();
      expect(state.workingDaysConfig.excludeSaturday).toBe(true);
      expect(state.workingDaysConfig.excludeSunday).toBe(true);
      // workingDaysMode is auto-derived from config exclusions
      expect(state.workingDaysMode).toBe(true);
    });

    it("should restore workingDaysConfig from localStorage", () => {
      const config = {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      };
      seedTabStorage("tab-1111111111-wdcfg", { workingDaysConfig: config });

      renderHook(() => useMultiTabPersistence());

      expect(useChartStore.getState().workingDaysConfig).toEqual(config);
    });

    it("should restore holidayRegion from localStorage", () => {
      seedTabStorage("tab-1111111111-wdregn", { holidayRegion: "US" });

      renderHook(() => useMultiTabPersistence());

      expect(useChartStore.getState().holidayRegion).toBe("US");
    });

    it("should keep default WD settings when not in saved data", () => {
      seedTabStorage("tab-1111111111-nowd001");

      renderHook(() => useMultiTabPersistence());

      expect(useChartStore.getState().workingDaysMode).toBeFalsy();
    });

    it("should round-trip all WD settings through save and restore", () => {
      const tabId = "tab-1111111111-wdround";
      sessionStorage.setItem(TAB_ID_KEY, tabId);

      const wdConfig = {
        excludeSaturday: true,
        excludeSunday: true,
        excludeHolidays: true,
      };

      saveTabChart(tabId, {
        tasks: [],
        dependencies: [],
        chartState: createChartState({
          workingDaysConfig: wdConfig,
          holidayRegion: "DE",
        }),
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

      renderHook(() => useMultiTabPersistence());

      const state = useChartStore.getState();
      // workingDaysMode is auto-derived from config exclusions
      expect(state.workingDaysMode).toBe(true);
      expect(state.workingDaysConfig).toEqual(wdConfig);
      expect(state.holidayRegion).toBe("DE");
    });
  });
});
