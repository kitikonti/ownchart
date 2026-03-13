/**
 * Tests for useTaskStatistics hook.
 * Verifies totalTasks, completedTasks, and overdueTasks calculations
 * including edge cases around date comparisons.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTaskStatistics } from "@/hooks/useTaskStatistics";
import type { Task } from "@/types/chart.types";

// ---------------------------------------------------------------------------
// Mock
// ---------------------------------------------------------------------------

let mockTasks: Task[] = [];

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn(
    (selector: (s: { tasks: Task[] }) => unknown) =>
      selector({ tasks: mockTasks })
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: "#000",
    order: 0,
    type: "task",
    parent: undefined,
    open: true,
    metadata: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTaskStatistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTasks = [];
    // Pin "today" to 2025-06-15 for deterministic date comparisons
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zeros when no tasks exist", () => {
    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.totalTasks).toBe(0);
    expect(result.current.completedTasks).toBe(0);
    expect(result.current.overdueTasks).toBe(0);
  });

  it("counts totalTasks correctly", () => {
    mockTasks = [
      makeTask({ id: "t1", endDate: "2025-07-01" }),
      makeTask({ id: "t2", endDate: "2025-07-02" }),
      makeTask({ id: "t3", endDate: "2025-07-03" }),
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.totalTasks).toBe(3);
  });

  it("counts completedTasks (progress === 100)", () => {
    mockTasks = [
      makeTask({ id: "t1", progress: 100, endDate: "2025-01-01" }),
      makeTask({ id: "t2", progress: 50, endDate: "2025-01-01" }),
      makeTask({ id: "t3", progress: 100, endDate: "2025-01-01" }),
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.completedTasks).toBe(2);
  });

  it("does not count completed tasks as overdue even when past end date", () => {
    mockTasks = [
      // Completed + past end date — should NOT count as overdue
      makeTask({ id: "t1", progress: 100, endDate: "2025-01-01" }),
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.overdueTasks).toBe(0);
    expect(result.current.completedTasks).toBe(1);
  });

  it("counts overdueTasks (endDate < today AND progress < 100)", () => {
    mockTasks = [
      makeTask({ id: "t1", progress: 0, endDate: "2025-06-14" }),  // past → overdue
      makeTask({ id: "t2", progress: 50, endDate: "2025-06-14" }), // past → overdue
      makeTask({ id: "t3", progress: 100, endDate: "2025-06-14" }), // past but complete → NOT overdue
      makeTask({ id: "t4", progress: 0, endDate: "2025-06-15" }),  // today → NOT overdue
      makeTask({ id: "t5", progress: 0, endDate: "2025-06-16" }),  // future → NOT overdue
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.overdueTasks).toBe(2);
  });

  it("does not count a task ending today as overdue", () => {
    mockTasks = [
      makeTask({ id: "t1", progress: 0, endDate: "2025-06-15" }),
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.overdueTasks).toBe(0);
  });

  it("counts a task ending yesterday as overdue", () => {
    mockTasks = [
      makeTask({ id: "t1", progress: 0, endDate: "2025-06-14" }),
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.overdueTasks).toBe(1);
  });

  it("returns consistent totalTasks equal to tasks.length", () => {
    mockTasks = Array.from({ length: 10 }, (_, i) =>
      makeTask({ id: `t${i}`, endDate: "2025-07-01" })
    );

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.totalTasks).toBe(10);
  });

  it("does not count a task with an invalid endDate as overdue", () => {
    mockTasks = [
      makeTask({ id: "t1", progress: 0, endDate: "" }),
      makeTask({ id: "t2", progress: 0, endDate: "not-a-date" }),
    ];

    const { result } = renderHook(() => useTaskStatistics());

    expect(result.current.overdueTasks).toBe(0);
  });
});
