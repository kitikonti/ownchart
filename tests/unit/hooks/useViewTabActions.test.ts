/**
 * Unit tests for useViewTabActions hook.
 *
 * Tests zoomOptions computation, zoom boundary conditions, handleFitToView
 * lazy task access, and toggleTaskTableCollapsed.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useViewTabActions } from "../../../src/hooks/useViewTabActions";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import { MIN_ZOOM, MAX_ZOOM } from "../../../src/utils/timelineUtils";
import type { Task } from "../../../src/types/chart.types";

// Mock useZoom helpers — tested separately
vi.mock("../../../src/hooks/useZoom", () => ({
  getViewportCenterAnchor: vi.fn(() => ({ scrollLeft: 0, clientX: 400 })),
  applyScrollLeft: vi.fn(),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id,
    name,
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: "#0F6CBD",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

describe("useViewTabActions", () => {
  beforeEach(() => {
    useChartStore.setState({
      zoom: 1.0,
      showTodayMarker: true,
      showWeekends: true,
      showHolidays: false,
      showDependencies: true,
      showProgress: true,
      isTaskTableCollapsed: false,
    });
    useTaskStore.setState({
      tasks: [
        createTask("t1", "Task 1", { order: 0 }),
        createTask("t2", "Task 2", { order: 1 }),
      ],
    });
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Show/Hide toggle passthrough
  // -------------------------------------------------------------------------
  describe("show/hide toggles", () => {
    it("should reflect current toggle states from store", () => {
      const { result } = renderHook(() => useViewTabActions());

      expect(result.current.showTodayMarker).toBe(true);
      expect(result.current.showWeekends).toBe(true);
      expect(result.current.showHolidays).toBe(false);
      expect(result.current.showDependencies).toBe(true);
      expect(result.current.showProgress).toBe(true);
    });

    it("should toggle todayMarker via store action", () => {
      const { result } = renderHook(() => useViewTabActions());

      act(() => {
        result.current.toggleTodayMarker();
      });

      expect(useChartStore.getState().showTodayMarker).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Zoom percentage and boundaries
  // -------------------------------------------------------------------------
  describe("zoomPercentage", () => {
    it("should return zoom as rounded percentage", () => {
      useChartStore.setState({ zoom: 0.75 });
      const { result } = renderHook(() => useViewTabActions());
      expect(result.current.zoomPercentage).toBe(75);
    });

    it("should round fractional zoom values", () => {
      useChartStore.setState({ zoom: 0.333 });
      const { result } = renderHook(() => useViewTabActions());
      expect(result.current.zoomPercentage).toBe(33);
    });
  });

  describe("canZoomIn / canZoomOut", () => {
    it("should allow zoom in when below MAX_ZOOM", () => {
      useChartStore.setState({ zoom: 1.0 });
      const { result } = renderHook(() => useViewTabActions());
      expect(result.current.canZoomIn).toBe(true);
    });

    it("should disallow zoom in at MAX_ZOOM", () => {
      useChartStore.setState({ zoom: MAX_ZOOM });
      const { result } = renderHook(() => useViewTabActions());
      expect(result.current.canZoomIn).toBe(false);
    });

    it("should allow zoom out when above MIN_ZOOM", () => {
      useChartStore.setState({ zoom: 1.0 });
      const { result } = renderHook(() => useViewTabActions());
      expect(result.current.canZoomOut).toBe(true);
    });

    it("should disallow zoom out at MIN_ZOOM", () => {
      useChartStore.setState({ zoom: MIN_ZOOM });
      const { result } = renderHook(() => useViewTabActions());
      expect(result.current.canZoomOut).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // zoomOptions
  // -------------------------------------------------------------------------
  describe("zoomOptions", () => {
    it("should return preset levels when zoom matches a preset", () => {
      useChartStore.setState({ zoom: 1.0 }); // 100%
      const { result } = renderHook(() => useViewTabActions());

      expect(result.current.zoomOptions).toEqual([
        5, 10, 25, 50, 75, 100, 150, 200, 300,
      ]);
    });

    it("should insert current zoom level in sorted position when not a preset", () => {
      useChartStore.setState({ zoom: 0.42 }); // 42%
      const { result } = renderHook(() => useViewTabActions());

      expect(result.current.zoomOptions).toEqual([
        5, 10, 25, 42, 50, 75, 100, 150, 200, 300,
      ]);
    });

    it("should append current zoom at end if larger than all presets", () => {
      useChartStore.setState({ zoom: 4.0 }); // 400%
      const { result } = renderHook(() => useViewTabActions());

      expect(result.current.zoomOptions).toEqual([
        5, 10, 25, 50, 75, 100, 150, 200, 300, 400,
      ]);
    });

    it("should insert current zoom at start if smaller than all presets", () => {
      useChartStore.setState({ zoom: 0.02 }); // 2%
      const { result } = renderHook(() => useViewTabActions());

      expect(result.current.zoomOptions).toEqual([
        2, 5, 10, 25, 50, 75, 100, 150, 200, 300,
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // handleZoomIn / handleZoomOut
  // -------------------------------------------------------------------------
  describe("handleZoomIn / handleZoomOut", () => {
    it("should call store zoomIn with viewport center anchor", () => {
      const zoomInSpy = vi.fn(() => ({ newScrollLeft: 0 }));
      useChartStore.setState({ zoomIn: zoomInSpy } as never);

      const { result } = renderHook(() => useViewTabActions());
      result.current.handleZoomIn();

      expect(zoomInSpy).toHaveBeenCalledOnce();
    });

    it("should call store zoomOut with viewport center anchor", () => {
      const zoomOutSpy = vi.fn(() => ({ newScrollLeft: 0 }));
      useChartStore.setState({ zoomOut: zoomOutSpy } as never);

      const { result } = renderHook(() => useViewTabActions());
      result.current.handleZoomOut();

      expect(zoomOutSpy).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // handleFitToView
  // -------------------------------------------------------------------------
  describe("handleFitToView", () => {
    it("should call fitToView with tasks from taskStore.getState()", () => {
      const fitToViewSpy = vi.fn();
      useChartStore.setState({ fitToView: fitToViewSpy } as never);

      const tasks = useTaskStore.getState().tasks;
      const { result } = renderHook(() => useViewTabActions());
      result.current.handleFitToView();

      expect(fitToViewSpy).toHaveBeenCalledWith(tasks);
    });

    it("should read tasks lazily via getState, not via subscription", () => {
      const fitToViewSpy = vi.fn();
      useChartStore.setState({ fitToView: fitToViewSpy } as never);

      const { result } = renderHook(() => useViewTabActions());

      // Add a task after hook render — fitToView should see the updated list
      const newTask = createTask("t3", "Task 3", { order: 2 });
      useTaskStore.setState({
        tasks: [
          ...useTaskStore.getState().tasks,
          newTask,
        ],
      });

      result.current.handleFitToView();

      const calledWith = fitToViewSpy.mock.calls[0][0];
      expect(calledWith).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  // handleZoomLevelSelect
  // -------------------------------------------------------------------------
  describe("handleZoomLevelSelect", () => {
    it('should delegate to handleFitToView when level is "fit"', () => {
      const fitToViewSpy = vi.fn();
      useChartStore.setState({ fitToView: fitToViewSpy } as never);

      const { result } = renderHook(() => useViewTabActions());
      result.current.handleZoomLevelSelect("fit");

      expect(fitToViewSpy).toHaveBeenCalledOnce();
    });

    it("should call setZoom with level / 100 for numeric levels", () => {
      const setZoomSpy = vi.fn(() => ({ newScrollLeft: 0 }));
      useChartStore.setState({ setZoom: setZoomSpy } as never);

      const { result } = renderHook(() => useViewTabActions());
      result.current.handleZoomLevelSelect(75);

      expect(setZoomSpy).toHaveBeenCalledWith(0.75, expect.anything());
    });
  });

  // -------------------------------------------------------------------------
  // toggleTaskTableCollapsed
  // -------------------------------------------------------------------------
  describe("toggleTaskTableCollapsed", () => {
    it("should collapse the task table when currently expanded", () => {
      useChartStore.setState({ isTaskTableCollapsed: false });

      const { result } = renderHook(() => useViewTabActions());

      act(() => {
        result.current.toggleTaskTableCollapsed();
      });

      expect(useChartStore.getState().isTaskTableCollapsed).toBe(true);
    });

    it("should expand the task table when currently collapsed", () => {
      useChartStore.setState({ isTaskTableCollapsed: true });

      const { result } = renderHook(() => useViewTabActions());

      act(() => {
        result.current.toggleTaskTableCollapsed();
      });

      expect(useChartStore.getState().isTaskTableCollapsed).toBe(false);
    });
  });
});
