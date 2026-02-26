/**
 * Tests for useNewTaskCreation hook.
 * Verifies date calculation, order computation, and addTask calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNewTaskCreation } from "../../../src/hooks/useNewTaskCreation";
import type { Task } from "../../../src/types/chart.types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAddTask = vi.fn();

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: Object.assign(
    vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        addTask: mockAddTask,
      })
    ),
    {
      getState: vi.fn(() => ({
        tasks: [] as Task[],
      })),
    }
  ),
}));

import { useTaskStore } from "../../../src/store/slices/taskSlice";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    name: "Task 1",
    startDate: "2025-01-10",
    endDate: "2025-01-17",
    duration: 7,
    progress: 0,
    color: "#0F6CBD",
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

describe("useNewTaskCreation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTaskStore.getState).mockReturnValue({
      tasks: [],
    } as unknown as ReturnType<typeof useTaskStore.getState>);
  });

  it("creates a task with today's date when no tasks exist", () => {
    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("New Task");
    });

    expect(mockAddTask).toHaveBeenCalledOnce();
    const call = mockAddTask.mock.calls[0][0];
    expect(call.name).toBe("New Task");
    expect(call.duration).toBe(7);
    expect(call.progress).toBe(0);
    expect(call.type).toBe("task");
    expect(call.order).toBe(0);
    // Dates should be ISO format
    expect(call.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(call.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("creates a task starting one day after the last task ends", () => {
    const lastTask = makeTask({
      id: "t1",
      endDate: "2025-03-15",
      order: 5,
    });
    vi.mocked(useTaskStore.getState).mockReturnValue({
      tasks: [lastTask],
    } as unknown as ReturnType<typeof useTaskStore.getState>);

    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("After Task");
    });

    expect(mockAddTask).toHaveBeenCalledOnce();
    const call = mockAddTask.mock.calls[0][0];
    expect(call.name).toBe("After Task");
    expect(call.startDate).toBe("2025-03-16"); // day after 2025-03-15
    expect(call.endDate).toBe("2025-03-22"); // 7 days inclusive
    expect(call.order).toBe(6); // max(5) + 1
  });

  it("handles last task without endDate by using today", () => {
    const taskNoEnd = makeTask({ id: "t1", endDate: undefined as unknown as string, order: 3 });
    vi.mocked(useTaskStore.getState).mockReturnValue({
      tasks: [taskNoEnd],
    } as unknown as ReturnType<typeof useTaskStore.getState>);

    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("Fallback Task");
    });

    expect(mockAddTask).toHaveBeenCalledOnce();
    const call = mockAddTask.mock.calls[0][0];
    expect(call.name).toBe("Fallback Task");
    expect(call.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(call.order).toBe(4);
  });

  it("uses COLORS.chart.taskDefault as the color", () => {
    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("Colored Task");
    });

    const call = mockAddTask.mock.calls[0][0];
    // Should use design token, not a hardcoded value
    expect(call.color).toBe("#0F6CBD"); // COLORS.chart.taskDefault = brand[600]
  });

  it("computes correct order from multiple tasks", () => {
    const tasks = [
      makeTask({ id: "t1", order: 0, endDate: "2025-01-10" }),
      makeTask({ id: "t2", order: 5, endDate: "2025-01-20" }),
      makeTask({ id: "t3", order: 3, endDate: "2025-01-15" }),
    ];
    vi.mocked(useTaskStore.getState).mockReturnValue({
      tasks,
    } as unknown as ReturnType<typeof useTaskStore.getState>);

    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("Max Order Task");
    });

    const call = mockAddTask.mock.calls[0][0];
    expect(call.order).toBe(6); // max(0, 5, 3) + 1
    // Uses last task's endDate (t3 at index 2), not the one with highest order
    expect(call.startDate).toBe("2025-01-16");
  });
});
