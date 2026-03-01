/**
 * Hook-level tests for useComputedTaskColor and useComputedTaskColors.
 *
 * Focuses on hook concerns: store subscription, correct wiring to
 * computeTaskColor, and reactivity when colorModeState or tasks change.
 * The underlying color-computation logic is covered by the pure-function
 * tests in useComputedTaskColor.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useComputedTaskColor,
  useComputedTaskColors,
} from "../../../src/hooks/useComputedTaskColor";
import type { Task } from "../../../src/types/chart.types";
import type { ColorModeState } from "../../../src/types/colorMode.types";
import { DEFAULT_COLOR_MODE_STATE } from "../../../src/config/colorModeDefaults";

// ---------------------------------------------------------------------------
// Store mocks
// ---------------------------------------------------------------------------

vi.mock("../../../src/store/slices/chartSlice", () => ({
  useChartStore: vi.fn(),
}));

vi.mock("../../../src/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn(),
}));

import { useChartStore } from "../../../src/store/slices/chartSlice";
import { useTaskStore } from "../../../src/store/slices/taskSlice";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
    progress: 0,
    color: "#FF0000",
    order: 0,
    metadata: {},
    type: "task",
    ...overrides,
  };
}

function setupStores(
  tasks: Task[],
  colorModeState: ColorModeState = DEFAULT_COLOR_MODE_STATE
): void {
  vi.mocked(useChartStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ colorModeState }) as never
  );
  vi.mocked(useTaskStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ tasks }) as never
  );
}

// ---------------------------------------------------------------------------
// useComputedTaskColor
// ---------------------------------------------------------------------------

describe("useComputedTaskColor", () => {
  const task = makeTask({ id: "t1", color: "#FF0000" });

  beforeEach(() => {
    vi.clearAllMocks();
    setupStores([task]);
  });

  it("returns the task color in manual mode", () => {
    const state = { ...DEFAULT_COLOR_MODE_STATE, mode: "manual" as const };
    setupStores([task], state);

    const { result } = renderHook(() => useComputedTaskColor(task));
    expect(result.current).toBe("#FF0000");
  });

  it("reads colorModeState from chartStore", () => {
    const state: ColorModeState = {
      ...DEFAULT_COLOR_MODE_STATE,
      mode: "taskType",
      taskTypeOptions: {
        ...DEFAULT_COLOR_MODE_STATE.taskTypeOptions,
        taskColor: "#00AABB",
      },
    };
    setupStores([task], state);

    const { result } = renderHook(() => useComputedTaskColor(task));
    expect(result.current).toBe("#00AABB");
  });

  it("reads tasks from taskStore (summary mode inherits parent color)", () => {
    const summary = makeTask({ id: "s1", type: "summary", color: "#AA0000" });
    const child = makeTask({ id: "c1", type: "task", parent: "s1", color: "#0000FF" });
    const state = { ...DEFAULT_COLOR_MODE_STATE, mode: "summary" as const };
    setupStores([summary, child], state);

    const { result } = renderHook(() => useComputedTaskColor(child));
    // In summary mode, child inherits parent summary color
    expect(result.current).toBe("#AA0000");
  });

  it("recomputes when colorModeState changes", () => {
    const manualState = { ...DEFAULT_COLOR_MODE_STATE, mode: "manual" as const };
    setupStores([task], manualState);

    const { result, rerender } = renderHook(() => useComputedTaskColor(task));
    expect(result.current).toBe("#FF0000"); // task.color in manual mode

    // Switch to taskType mode
    const taskTypeState: ColorModeState = {
      ...DEFAULT_COLOR_MODE_STATE,
      mode: "taskType",
      taskTypeOptions: {
        ...DEFAULT_COLOR_MODE_STATE.taskTypeOptions,
        taskColor: "#123456",
      },
    };
    setupStores([task], taskTypeState);
    rerender();

    expect(result.current).toBe("#123456");
  });

  it("recomputes when the task prop changes", () => {
    setupStores([task]);
    const task2 = makeTask({ id: "t2", color: "#00FF00" });

    const { result, rerender } = renderHook(
      ({ t }: { t: Task }) => useComputedTaskColor(t),
      { initialProps: { t: task } }
    );
    expect(result.current).toBe("#FF0000");

    rerender({ t: task2 });
    expect(result.current).toBe("#00FF00");
  });
});

// ---------------------------------------------------------------------------
// useComputedTaskColors
// ---------------------------------------------------------------------------

describe("useComputedTaskColors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty Map when there are no tasks", () => {
    setupStores([]);
    const { result } = renderHook(() => useComputedTaskColors());
    expect(result.current.size).toBe(0);
  });

  it("returns a Map with one entry per task", () => {
    const t1 = makeTask({ id: "t1", color: "#FF0000" });
    const t2 = makeTask({ id: "t2", color: "#00FF00" });
    setupStores([t1, t2]);

    const { result } = renderHook(() => useComputedTaskColors());
    expect(result.current.size).toBe(2);
    expect(result.current.has("t1" as never)).toBe(true);
    expect(result.current.has("t2" as never)).toBe(true);
  });

  it("maps each task id to its computed color (manual mode)", () => {
    const t1 = makeTask({ id: "t1", color: "#FF0000" });
    const t2 = makeTask({ id: "t2", color: "#00FF00" });
    const state = { ...DEFAULT_COLOR_MODE_STATE, mode: "manual" as const };
    setupStores([t1, t2], state);

    const { result } = renderHook(() => useComputedTaskColors());
    expect(result.current.get("t1" as never)).toBe("#FF0000");
    expect(result.current.get("t2" as never)).toBe("#00FF00");
  });

  it("recomputes the full map when tasks change", () => {
    const t1 = makeTask({ id: "t1", color: "#FF0000" });
    setupStores([t1]);

    const { result, rerender } = renderHook(() => useComputedTaskColors());
    expect(result.current.size).toBe(1);

    // Add a second task
    const t2 = makeTask({ id: "t2", color: "#00FF00" });
    setupStores([t1, t2]);
    rerender();

    expect(result.current.size).toBe(2);
    expect(result.current.get("t2" as never)).toBe("#00FF00");
  });

  it("recomputes when colorModeState changes", () => {
    const task = makeTask({ id: "t1", type: "task", color: "#000000" });
    const manualState = { ...DEFAULT_COLOR_MODE_STATE, mode: "manual" as const };
    setupStores([task], manualState);

    const { result, rerender } = renderHook(() => useComputedTaskColors());
    expect(result.current.get("t1" as never)).toBe("#000000");

    // Switch to taskType mode with a specific color
    const taskTypeState: ColorModeState = {
      ...DEFAULT_COLOR_MODE_STATE,
      mode: "taskType",
      taskTypeOptions: {
        ...DEFAULT_COLOR_MODE_STATE.taskTypeOptions,
        taskColor: "#ABCDEF",
      },
    };
    setupStores([task], taskTypeState);
    rerender();

    expect(result.current.get("t1" as never)).toBe("#ABCDEF");
  });
});
