/**
 * Tests for useFlattenedTasks hook.
 * Verifies the two-stage processing:
 *  1. Build full flattened list (respecting collapse) with globalRowNumber
 *  2. Filter out hidden tasks while preserving row number gaps (Excel-style)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFlattenedTasks } from "../../../src/hooks/useFlattenedTasks";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import type { Task } from "../../../src/types/chart.types";

// ─── Helpers ───

function createTask(id: string, options: Partial<Task> = {}): Task {
  return {
    id,
    name: `Task ${id}`,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

// ─── Setup ───

beforeEach(() => {
  useTaskStore.getState().setTasks([]);
  useChartStore.getState().setHiddenTaskIds([]);
});

// ─── Tests ───

describe("useFlattenedTasks", () => {
  it("should return empty lists when no tasks exist", () => {
    const { result } = renderHook(() => useFlattenedTasks());

    expect(result.current.flattenedTasks).toEqual([]);
    expect(result.current.allFlattenedTasks).toEqual([]);
    expect(result.current.orderedTasks).toEqual([]);
  });

  it("should flatten tasks in order and assign 1-based globalRowNumbers", () => {
    const t1 = createTask("t1", { order: 0 });
    const t2 = createTask("t2", { order: 1 });
    const t3 = createTask("t3", { order: 2 });
    useTaskStore.getState().setTasks([t1, t2, t3]);

    const { result } = renderHook(() => useFlattenedTasks());

    expect(result.current.allFlattenedTasks).toHaveLength(3);
    expect(result.current.allFlattenedTasks[0].globalRowNumber).toBe(1);
    expect(result.current.allFlattenedTasks[1].globalRowNumber).toBe(2);
    expect(result.current.allFlattenedTasks[2].globalRowNumber).toBe(3);
  });

  it("should return flattenedTasks equal to allFlattenedTasks when no tasks are hidden", () => {
    const t1 = createTask("t1", { order: 0 });
    const t2 = createTask("t2", { order: 1 });
    useTaskStore.getState().setTasks([t1, t2]);
    useChartStore.getState().setHiddenTaskIds([]);

    const { result } = renderHook(() => useFlattenedTasks());

    expect(result.current.flattenedTasks).toEqual(result.current.allFlattenedTasks);
  });

  it("should filter hidden tasks from flattenedTasks while preserving globalRowNumbers (Excel-style gaps)", () => {
    const t1 = createTask("t1", { order: 0 });
    const t2 = createTask("t2", { order: 1 });
    const t3 = createTask("t3", { order: 2 });
    useTaskStore.getState().setTasks([t1, t2, t3]);
    useChartStore.getState().setHiddenTaskIds(["t2"]);

    const { result } = renderHook(() => useFlattenedTasks());

    // allFlattenedTasks still has all 3
    expect(result.current.allFlattenedTasks).toHaveLength(3);

    // flattenedTasks excludes t2 but preserves row numbers
    expect(result.current.flattenedTasks).toHaveLength(2);
    expect(result.current.flattenedTasks[0].task.id).toBe("t1");
    expect(result.current.flattenedTasks[0].globalRowNumber).toBe(1);
    expect(result.current.flattenedTasks[1].task.id).toBe("t3");
    expect(result.current.flattenedTasks[1].globalRowNumber).toBe(3); // gap at row 2
  });

  it("should return orderedTasks as the visible task objects in order", () => {
    const t1 = createTask("t1", { order: 0 });
    const t2 = createTask("t2", { order: 1 });
    useTaskStore.getState().setTasks([t1, t2]);

    const { result } = renderHook(() => useFlattenedTasks());

    expect(result.current.orderedTasks).toHaveLength(2);
    expect(result.current.orderedTasks[0].id).toBe("t1");
    expect(result.current.orderedTasks[1].id).toBe("t2");
  });

  it("should exclude children of collapsed tasks from allFlattenedTasks", () => {
    // t2 is a child of t1 (via parent field); t1 is collapsed (open=false)
    const t1 = createTask("t1", { order: 0, open: false });
    const t2 = createTask("t2", { order: 1, parent: "t1" as Task["parent"] });
    useTaskStore.getState().setTasks([t1, t2]);

    const { result } = renderHook(() => useFlattenedTasks());

    // Only t1 is visible (t2 is hidden by collapse)
    expect(result.current.allFlattenedTasks).toHaveLength(1);
    expect(result.current.allFlattenedTasks[0].task.id).toBe("t1");
  });

  it("should update reactively when hidden tasks change", () => {
    const t1 = createTask("t1", { order: 0 });
    const t2 = createTask("t2", { order: 1 });
    useTaskStore.getState().setTasks([t1, t2]);

    const { result } = renderHook(() => useFlattenedTasks());

    expect(result.current.flattenedTasks).toHaveLength(2);

    act(() => {
      useChartStore.getState().setHiddenTaskIds(["t1"]);
    });

    expect(result.current.flattenedTasks).toHaveLength(1);
    expect(result.current.flattenedTasks[0].task.id).toBe("t2");
  });

  it("should update reactively when tasks are added", () => {
    const t1 = createTask("t1", { order: 0 });
    useTaskStore.getState().setTasks([t1]);

    const { result } = renderHook(() => useFlattenedTasks());

    expect(result.current.allFlattenedTasks).toHaveLength(1);

    act(() => {
      const t2 = createTask("t2", { order: 1 });
      useTaskStore.getState().setTasks([t1, t2]);
    });

    expect(result.current.allFlattenedTasks).toHaveLength(2);
  });
});
