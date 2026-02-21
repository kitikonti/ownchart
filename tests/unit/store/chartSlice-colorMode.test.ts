/**
 * Unit tests for chartSlice color mode actions
 * Smart Color Management: setColorMode, option setters, applyColorsToManual
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useHistoryStore } from "../../../src/store/slices/historySlice";
import { useFileStore } from "../../../src/store/slices/fileSlice";
import { DEFAULT_COLOR_MODE_STATE } from "../../../src/config/colorModeDefaults";
import { DEFAULT_PALETTE_ID } from "../../../src/utils/colorPalettes";
import { CommandType } from "../../../src/types/command.types";
import type { Task } from "../../../src/types/chart.types";

describe("Chart Store - Color Mode", () => {
  beforeEach(() => {
    useChartStore.setState({
      colorModeState: structuredClone(DEFAULT_COLOR_MODE_STATE),
    });
  });

  describe("setColorMode", () => {
    it("should set mode to theme", () => {
      act(() => {
        useChartStore.getState().setColorMode("theme");
      });
      expect(useChartStore.getState().colorModeState.mode).toBe("theme");
    });

    it("should auto-select default palette when switching to theme without selection", () => {
      act(() => {
        useChartStore.getState().setColorMode("theme");
      });
      expect(
        useChartStore.getState().colorModeState.themeOptions.selectedPaletteId
      ).toBe(DEFAULT_PALETTE_ID);
    });

    it("should not overwrite existing palette when switching to theme", () => {
      // Pre-set a palette
      act(() => {
        useChartStore.getState().setThemeOptions({
          selectedPaletteId: "d3-category10",
        });
      });

      act(() => {
        useChartStore.getState().setColorMode("theme");
      });
      expect(
        useChartStore.getState().colorModeState.themeOptions.selectedPaletteId
      ).toBe("d3-category10");
    });

    it("should not overwrite custom monochrome base when switching to theme", () => {
      act(() => {
        useChartStore.getState().setThemeOptions({
          customMonochromeBase: "#ff0000",
        });
      });

      act(() => {
        useChartStore.getState().setColorMode("theme");
      });
      // Should not set default palette since custom base is already set
      expect(
        useChartStore.getState().colorModeState.themeOptions.selectedPaletteId
      ).toBeNull();
    });

    it("should set mode to manual", () => {
      act(() => {
        useChartStore.getState().setColorMode("manual");
      });
      expect(useChartStore.getState().colorModeState.mode).toBe("manual");
    });

    it("should set mode to summary", () => {
      act(() => {
        useChartStore.getState().setColorMode("summary");
      });
      expect(useChartStore.getState().colorModeState.mode).toBe("summary");
    });

    it("should set mode to taskType", () => {
      act(() => {
        useChartStore.getState().setColorMode("taskType");
      });
      expect(useChartStore.getState().colorModeState.mode).toBe("taskType");
    });

    it("should set mode to hierarchy", () => {
      act(() => {
        useChartStore.getState().setColorMode("hierarchy");
      });
      expect(useChartStore.getState().colorModeState.mode).toBe("hierarchy");
    });
  });

  describe("setThemeOptions", () => {
    it("should merge partial theme options", () => {
      act(() => {
        useChartStore
          .getState()
          .setThemeOptions({ selectedPaletteId: "echarts" });
      });

      const opts = useChartStore.getState().colorModeState.themeOptions;
      expect(opts.selectedPaletteId).toBe("echarts");
      // Other field untouched
      expect(opts.customMonochromeBase).toBeNull();
    });

    it("should update customMonochromeBase", () => {
      act(() => {
        useChartStore
          .getState()
          .setThemeOptions({ customMonochromeBase: "#123456" });
      });

      expect(
        useChartStore.getState().colorModeState.themeOptions.customMonochromeBase
      ).toBe("#123456");
    });
  });

  describe("setSummaryOptions", () => {
    it("should merge partial summary options", () => {
      act(() => {
        useChartStore
          .getState()
          .setSummaryOptions({ useMilestoneAccent: false });
      });

      const opts = useChartStore.getState().colorModeState.summaryOptions;
      expect(opts.useMilestoneAccent).toBe(false);
      // Other field untouched
      expect(opts.milestoneAccentColor).toBe("#CA8A04");
    });

    it("should update milestone accent color", () => {
      act(() => {
        useChartStore
          .getState()
          .setSummaryOptions({ milestoneAccentColor: "#FF0000" });
      });

      expect(
        useChartStore.getState().colorModeState.summaryOptions
          .milestoneAccentColor
      ).toBe("#FF0000");
    });
  });

  describe("setTaskTypeOptions", () => {
    it("should merge partial task type options", () => {
      act(() => {
        useChartStore
          .getState()
          .setTaskTypeOptions({ summaryColor: "#111111" });
      });

      const opts = useChartStore.getState().colorModeState.taskTypeOptions;
      expect(opts.summaryColor).toBe("#111111");
      // Other fields untouched
      expect(opts.taskColor).toBe("#0F6CBD");
      expect(opts.milestoneColor).toBe("#CA8A04");
    });
  });

  describe("setHierarchyOptions", () => {
    it("should merge partial hierarchy options", () => {
      act(() => {
        useChartStore
          .getState()
          .setHierarchyOptions({ baseColor: "#AABBCC" });
      });

      const opts = useChartStore.getState().colorModeState.hierarchyOptions;
      expect(opts.baseColor).toBe("#AABBCC");
      // Other fields untouched
      expect(opts.lightenPercentPerLevel).toBe(12);
      expect(opts.maxLightenPercent).toBe(36);
    });

    it("should update lighten settings", () => {
      act(() => {
        useChartStore.getState().setHierarchyOptions({
          lightenPercentPerLevel: 8,
          maxLightenPercent: 48,
        });
      });

      const opts = useChartStore.getState().colorModeState.hierarchyOptions;
      expect(opts.lightenPercentPerLevel).toBe(8);
      expect(opts.maxLightenPercent).toBe(48);
    });
  });

  describe("applyColorsToManual", () => {
    const testTasks: Task[] = [
      {
        id: "t1",
        name: "Task 1",
        startDate: "2025-01-01",
        endDate: "2025-01-05",
        duration: 5,
        progress: 50,
        color: "#3b82f6",
        order: 0,
        metadata: {},
      },
      {
        id: "t2",
        name: "Task 2",
        startDate: "2025-01-06",
        endDate: "2025-01-10",
        duration: 5,
        progress: 0,
        color: "#ef4444",
        order: 1,
        metadata: {},
      },
    ];

    beforeEach(() => {
      // Set up task store with test tasks
      useTaskStore.setState({ tasks: testTasks });
      // Clear history
      useHistoryStore.getState().clearHistory();
      // Set chart to a non-manual mode
      useChartStore.setState({
        colorModeState: {
          ...DEFAULT_COLOR_MODE_STATE,
          mode: "taskType",
        },
      });
    });

    it("should switch mode to manual", () => {
      act(() => {
        useChartStore.getState().applyColorsToManual();
      });

      expect(useChartStore.getState().colorModeState.mode).toBe("manual");
    });

    it("should set task colors based on computed values", () => {
      act(() => {
        useChartStore.getState().applyColorsToManual();
      });

      const tasks = useTaskStore.getState().tasks;
      // Tasks should have colors set (not necessarily the same as original)
      expect(tasks[0].color).toBeDefined();
      expect(tasks[1].color).toBeDefined();
    });

    it("should clear colorOverride on tasks", () => {
      // Give a task a colorOverride
      useTaskStore.setState({
        tasks: testTasks.map((t) => ({
          ...t,
          colorOverride: "#ffffff",
        })),
      });

      act(() => {
        useChartStore.getState().applyColorsToManual();
      });

      const tasks = useTaskStore.getState().tasks;
      expect(tasks[0].colorOverride).toBeUndefined();
      expect(tasks[1].colorOverride).toBeUndefined();
    });

    it("should record history command", () => {
      act(() => {
        useChartStore.getState().applyColorsToManual();
      });

      const history = useHistoryStore.getState();
      expect(history.undoStack.length).toBe(1);
      expect(history.undoStack[0].type).toBe(
        CommandType.APPLY_COLORS_TO_MANUAL
      );
    });

    it("should mark file as dirty", () => {
      useFileStore.getState().markClean();

      act(() => {
        useChartStore.getState().applyColorsToManual();
      });

      expect(useFileStore.getState().isDirty).toBe(true);
    });

    it("should no-op when already in manual mode", () => {
      // Set to manual mode
      useChartStore.setState({
        colorModeState: { ...DEFAULT_COLOR_MODE_STATE, mode: "manual" },
      });

      // Spy on history recording
      const recordSpy = vi.spyOn(
        useHistoryStore.getState(),
        "recordCommand"
      );

      act(() => {
        useChartStore.getState().applyColorsToManual();
      });

      // Should not record any command
      expect(recordSpy).not.toHaveBeenCalled();
      recordSpy.mockRestore();
    });
  });
});
