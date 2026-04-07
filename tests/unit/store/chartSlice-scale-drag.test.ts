/**
 * Unit tests for chartSlice scale, dateRange extension, drag state,
 * and file load signal.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useChartStore } from "@/store/slices/chartSlice";
import type { Task } from "@/types/chart.types";

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
      viewAnchorDate: null,
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

  // ─── Lag-delta indicator (#82 stage 4) ────────────────────────────────────

  describe("setLagDelta", () => {
    it("sets the lag-delta state", () => {
      const { setLagDelta } = useChartStore.getState();
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 6 });
      expect(useChartStore.getState().lagDelta).toEqual({
        depId: "dep-1",
        oldLag: 4,
        newLag: 6,
      });
    });

    it("clears the lag-delta state when null is passed", () => {
      const { setLagDelta } = useChartStore.getState();
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 6 });
      setLagDelta(null);
      expect(useChartStore.getState().lagDelta).toBeNull();
    });

    it("structurally short-circuits identical values to avoid re-renders", () => {
      const { setLagDelta } = useChartStore.getState();
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 6 });
      const refBefore = useChartStore.getState().lagDelta;
      // Set with a structurally identical (but different reference) object.
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 6 });
      const refAfter = useChartStore.getState().lagDelta;
      // Same object reference proves the setter early-returned.
      expect(refAfter).toBe(refBefore);
    });

    it("updates when any field differs", () => {
      const { setLagDelta } = useChartStore.getState();
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 6 });
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 7 });
      expect(useChartStore.getState().lagDelta?.newLag).toBe(7);
    });

    it("clearDragState also clears lagDelta", () => {
      const { setLagDelta, setDragState, clearDragState } =
        useChartStore.getState();
      setDragState(5, "task-1");
      setLagDelta({ depId: "dep-1", oldLag: 4, newLag: 6 });
      clearDragState();
      expect(useChartStore.getState().lagDelta).toBeNull();
      expect(useChartStore.getState().dragState).toBeNull();
    });

    it("noop when clearing an already-null state (no spurious re-render)", () => {
      const { setLagDelta } = useChartStore.getState();
      setLagDelta(null);
      const refBefore = useChartStore.getState().lagDelta;
      setLagDelta(null);
      const refAfter = useChartStore.getState().lagDelta;
      expect(refAfter).toBe(refBefore);
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

  describe("resetView", () => {
    it("should clear dateRange and scale to null", () => {
      const store = useChartStore.getState();
      store.updateScale([
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
      ]);
      expect(useChartStore.getState().dateRange).not.toBeNull();
      expect(useChartStore.getState().scale).not.toBeNull();

      store.resetView();

      const state = useChartStore.getState();
      expect(state.dateRange).toBeNull();
      expect(state.scale).toBeNull();
      expect(state.zoom).toBe(1.0);
      expect(state.viewAnchorDate).toBeNull();
    });

    it("should increment fileLoadCounter so scroll repositions", () => {
      const before = useChartStore.getState().fileLoadCounter;

      useChartStore.getState().resetView();

      expect(useChartStore.getState().fileLoadCounter).toBe(before + 1);
    });

    it("should allow updateScale to recalculate dateRange from scratch", () => {
      const store = useChartStore.getState();

      // Set wide dateRange from old project
      store.updateScale([
        makeTask({
          id: "1",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
        }),
      ]);
      const oldRange = useChartStore.getState().dateRange!;

      // File > New: resetView then updateScale with empty tasks
      store.resetView();
      store.updateScale([]);

      const newRange = useChartStore.getState().dateRange!;
      // dateRange should be recalculated (centered on today, not old range)
      expect(newRange.min).not.toBe(oldRange.min);
      expect(newRange.max).not.toBe(oldRange.max);
    });
  });

  describe("scrollTargetDate", () => {
    it("should set scrollTargetDate via requestScrollToDate", () => {
      expect(useChartStore.getState().scrollTargetDate).toBeNull();

      useChartStore.getState().requestScrollToDate("2025-06-15");

      expect(useChartStore.getState().scrollTargetDate).toBe("2025-06-15");
    });

    it("should clear scrollTargetDate via clearScrollTarget", () => {
      useChartStore.getState().requestScrollToDate("2025-06-15");
      expect(useChartStore.getState().scrollTargetDate).not.toBeNull();

      useChartStore.getState().clearScrollTarget();

      expect(useChartStore.getState().scrollTargetDate).toBeNull();
    });
  });

  describe("viewAnchorDate", () => {
    it("should set viewAnchorDate via setViewAnchorDate", () => {
      expect(useChartStore.getState().viewAnchorDate).toBeNull();

      useChartStore.getState().setViewAnchorDate("2025-06-15");

      expect(useChartStore.getState().viewAnchorDate).toBe("2025-06-15");
    });

    it("should clear viewAnchorDate via setViewAnchorDate(null)", () => {
      useChartStore.getState().setViewAnchorDate("2025-06-15");

      useChartStore.getState().setViewAnchorDate(null);

      expect(useChartStore.getState().viewAnchorDate).toBeNull();
    });

    it("should be set by setViewSettings", () => {
      useChartStore.getState().setViewSettings({
        viewAnchorDate: "2025-09-01",
      });

      expect(useChartStore.getState().viewAnchorDate).toBe("2025-09-01");
    });

    it("should be cleared to null by resetView", () => {
      useChartStore.getState().setViewAnchorDate("2025-06-15");

      useChartStore.getState().resetView();

      expect(useChartStore.getState().viewAnchorDate).toBeNull();
    });

    it("should be cleared to null by fitToView", () => {
      useChartStore.getState().setViewAnchorDate("2025-06-15");

      useChartStore.getState().fitToView([
        makeTask({ id: "1", startDate: "2025-03-01", endDate: "2025-03-10" }),
      ]);

      expect(useChartStore.getState().viewAnchorDate).toBeNull();
    });
  });
});
