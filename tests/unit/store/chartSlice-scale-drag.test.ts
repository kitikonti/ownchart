/**
 * Unit tests for chartSlice scale, dateRange extension, drag state,
 * and file load signal.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import type { Task } from "../../../src/types/chart.types";

/** Helper to create a minimal task */
function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    name: "Task",
    startDate: "2025-03-01",
    endDate: "2025-03-10",
    duration: 10,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    ...overrides,
  };
}

describe("Chart Store - Scale & Date Range", () => {
  beforeEach(() => {
    useChartStore.setState({
      scale: null,
      containerWidth: 800,
      dateRange: null,
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      dragState: null,
      fileLoadCounter: 0,
    });
  });

  describe("updateScale", () => {
    it("should set dateRange and scale from tasks", () => {
      const { updateScale } = useChartStore.getState();
      const tasks = [
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
        makeTask({ id: "2", startDate: "2025-03-15", endDate: "2025-03-25" }),
      ];

      updateScale(tasks);

      const state = useChartStore.getState();
      expect(state.dateRange).not.toBeNull();
      expect(state.scale).not.toBeNull();
      // dateRange should include padding beyond task range
      expect(state.dateRange!.min < "2025-03-01").toBe(true);
      expect(state.dateRange!.max > "2025-03-25").toBe(true);
    });

    it("should not shrink dateRange when tasks contract", () => {
      const { updateScale } = useChartStore.getState();

      // First: wide range
      updateScale([
        makeTask({ id: "1", startDate: "2025-01-01", endDate: "2025-06-30" }),
      ]);
      const wideRange = useChartStore.getState().dateRange!;

      // Second: narrower tasks — dateRange should NOT shrink
      updateScale([
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
      ]);
      const afterNarrow = useChartStore.getState().dateRange!;

      expect(afterNarrow.min).toBe(wideRange.min);
      expect(afterNarrow.max).toBe(wideRange.max);
    });

    it("should expand dateRange when tasks extend beyond it", () => {
      const { updateScale } = useChartStore.getState();

      updateScale([
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
      ]);
      const initialRange = useChartStore.getState().dateRange!;

      // Add task extending past current range
      updateScale([
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
        makeTask({ id: "2", startDate: "2025-12-01", endDate: "2025-12-31" }),
      ]);
      const expandedRange = useChartStore.getState().dateRange!;

      expect(expandedRange.max > initialRange.max).toBe(true);
    });

    it("should always re-derive scale even if dateRange unchanged", () => {
      const { updateScale } = useChartStore.getState();
      const tasks = [
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
      ];

      updateScale(tasks);
      const dateRange1 = useChartStore.getState().dateRange;
      const scale1 = useChartStore.getState().scale;

      // Change zoom (which does NOT auto-derive scale from dateRange),
      // then call updateScale with same tasks — dateRange won't change,
      // but scale should reflect the new zoom.
      useChartStore.setState({ zoom: 2.0, scale: null });
      updateScale(tasks);
      const dateRange2 = useChartStore.getState().dateRange;
      const scale2 = useChartStore.getState().scale;

      // dateRange unchanged (same tasks, no expansion)
      expect(dateRange2).toEqual(dateRange1);
      // Scale re-derived with new zoom
      expect(scale1).not.toBeNull();
      expect(scale2).not.toBeNull();
      expect(scale2!.totalWidth).not.toBe(scale1!.totalWidth);
    });
  });

  describe("extendDateRange", () => {
    beforeEach(() => {
      // Set up an initial dateRange
      const { updateScale } = useChartStore.getState();
      updateScale([
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
      ]);
    });

    it("should extend dateRange into the past", () => {
      const initialMin = useChartStore.getState().dateRange!.min;

      useChartStore.getState().extendDateRange("past");

      const newMin = useChartStore.getState().dateRange!.min;
      expect(newMin < initialMin).toBe(true);
    });

    it("should extend dateRange into the future", () => {
      const initialMax = useChartStore.getState().dateRange!.max;

      useChartStore.getState().extendDateRange("future");

      const newMax = useChartStore.getState().dateRange!.max;
      expect(newMax > initialMax).toBe(true);
    });

    it("should extend by specified number of days", () => {
      const initialMin = useChartStore.getState().dateRange!.min;

      useChartStore.getState().extendDateRange("past", 60);

      const newMin = useChartStore.getState().dateRange!.min;
      // Should extend further than default (30 days)
      const defaultExtend = new Date(initialMin);
      defaultExtend.setDate(defaultExtend.getDate() - 30);
      expect(new Date(newMin) < defaultExtend).toBe(true);
    });

    it("should recalculate scale after extending", () => {
      const scaleBefore = useChartStore.getState().scale;

      useChartStore.getState().extendDateRange("future", 90);

      const scaleAfter = useChartStore.getState().scale;
      expect(scaleAfter).not.toBeNull();
      // Scale totalWidth should increase with wider date range
      expect(scaleAfter!.totalWidth).toBeGreaterThan(scaleBefore!.totalWidth);
    });

    it("should no-op when dateRange is null", () => {
      useChartStore.setState({ dateRange: null, scale: null });

      useChartStore.getState().extendDateRange("past");

      expect(useChartStore.getState().dateRange).toBeNull();
    });
  });

  describe("setDragState / clearDragState", () => {
    it("should set drag state with deltaDays and sourceTaskId", () => {
      const { setDragState } = useChartStore.getState();

      setDragState(5, "task-1");

      const state = useChartStore.getState();
      expect(state.dragState).toEqual({
        deltaDays: 5,
        sourceTaskId: "task-1",
      });
    });

    it("should update drag state on subsequent calls", () => {
      const { setDragState } = useChartStore.getState();

      setDragState(3, "task-1");
      setDragState(-2, "task-1");

      expect(useChartStore.getState().dragState).toEqual({
        deltaDays: -2,
        sourceTaskId: "task-1",
      });
    });

    it("should clear drag state to null", () => {
      const { setDragState, clearDragState } = useChartStore.getState();

      setDragState(5, "task-1");
      expect(useChartStore.getState().dragState).not.toBeNull();

      clearDragState();
      expect(useChartStore.getState().dragState).toBeNull();
    });
  });

  describe("signalFileLoaded", () => {
    it("should increment fileLoadCounter", () => {
      const initial = useChartStore.getState().fileLoadCounter;

      useChartStore.getState().signalFileLoaded();
      expect(useChartStore.getState().fileLoadCounter).toBe(initial + 1);

      useChartStore.getState().signalFileLoaded();
      expect(useChartStore.getState().fileLoadCounter).toBe(initial + 2);
    });
  });

  describe("setViewport", () => {
    it("should set viewport scrollLeft and width", () => {
      const { setViewport } = useChartStore.getState();

      setViewport(250, 1024);

      const state = useChartStore.getState();
      expect(state.viewportScrollLeft).toBe(250);
      expect(state.viewportWidth).toBe(1024);
    });
  });
});
