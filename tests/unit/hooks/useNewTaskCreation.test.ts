/**
 * Tests for useNewTaskCreation hook.
 * Verifies date calculation, order computation, and addTask calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNewTaskCreation } from "@/hooks/useNewTaskCreation";
import type { Task } from "@/types/chart.types";
import { COLORS } from "@/styles/design-tokens";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAddTask = vi.fn();

vi.mock("@/store/slices/taskSlice", () => ({
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

import { useTaskStore } from "@/store/slices/taskSlice";

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a task with today's date when no tasks exist", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

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
    // Dates should be the pinned "today" and today + 6 days (7-day duration inclusive)
    expect(call.startDate).toBe("2025-06-15");
    expect(call.endDate).toBe("2025-06-21");
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

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
    expect(call.startDate).toBe("2025-06-15");
    expect(call.endDate).toBe("2025-06-21");
    expect(call.order).toBe(4);
  });

  it("uses COLORS.chart.taskDefault as the color", () => {
    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("Colored Task");
    });

    const call = mockAddTask.mock.calls[0][0];
    // Should use design token, not a hardcoded value — import and compare against the token
    expect(call.color).toBe(COLORS.chart.taskDefault);
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
    // Uses the task with the latest endDate (t2: 2025-01-20), not the last by array position
    expect(call.startDate).toBe("2025-01-21");
  });

  it("starts after the task with the latest endDate, not the last by array position", () => {
    const tasks = [
      makeTask({ id: "t1", order: 0, endDate: "2025-06-30" }), // latest endDate
      makeTask({ id: "t2", order: 1, endDate: "2025-03-15" }),
      makeTask({ id: "t3", order: 2, endDate: "2025-01-10" }), // last by array position
    ];
    vi.mocked(useTaskStore.getState).mockReturnValue({
      tasks,
    } as unknown as ReturnType<typeof useTaskStore.getState>);

    const { result } = renderHook(() => useNewTaskCreation());

    act(() => {
      result.current.createTask("After Latest");
    });

    const call = mockAddTask.mock.calls[0][0];
    // Must start after t1 (latest endDate), not after t3 (last in array)
    expect(call.startDate).toBe("2025-07-01");
    expect(call.endDate).toBe("2025-07-07");
    expect(call.order).toBe(3);
  });
});
