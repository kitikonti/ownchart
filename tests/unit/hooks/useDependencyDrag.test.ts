/**
 * Tests for useDependencyDrag hook.
 * Verifies drag state management, valid/invalid target classification,
 * dependency creation, and cancellation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDependencyDrag } from "../../../src/hooks/useDependencyDrag";
import { useDependencyStore } from "../../../src/store/slices/dependencySlice";
import { useTaskStore } from "../../../src/store/slices/taskSlice";
import type { Task } from "../../../src/types/chart.types";
import type { TaskId } from "../../../src/types/branded.types";
import { toTaskId } from "../../../src/types/branded.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeMouseEvent(
  x = 100,
  y = 50
): React.MouseEvent {
  return {
    clientX: x,
    clientY: y,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as React.MouseEvent;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TASK_A = makeTask("a");
const TASK_B = makeTask("b");
const TASK_C = makeTask("c");
const DEFAULT_TASKS = [TASK_A, TASK_B, TASK_C];

describe("useDependencyDrag", () => {
  beforeEach(() => {
    // Populate task store so addDependency's task-existence validation passes
    useTaskStore.getState().setTasks([TASK_A, TASK_B, TASK_C]);
    // Clear all dependencies before each test
    useDependencyStore.setState({ dependencies: [] });
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it("returns initial idle state", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.fromTaskId).toBeNull();
    expect(result.current.dragState.fromSide).toBeNull();
    expect(result.current.dragState.validTargets.size).toBe(0);
    expect(result.current.dragState.invalidTargets.size).toBe(0);
  });

  it("exposes all required handlers", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    expect(typeof result.current.startDrag).toBe("function");
    expect(typeof result.current.endDrag).toBe("function");
    expect(typeof result.current.cancelDrag).toBe("function");
    expect(typeof result.current.updateDragPosition).toBe("function");
    expect(typeof result.current.isValidTarget).toBe("function");
    expect(typeof result.current.isInvalidTarget).toBe("function");
    expect(typeof result.current.getHoveredTaskId).toBe("function");
  });

  // -------------------------------------------------------------------------
  // startDrag
  // -------------------------------------------------------------------------

  it("sets isDragging and fromTaskId on startDrag", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    expect(result.current.dragState.isDragging).toBe(true);
    expect(result.current.dragState.fromTaskId).toBe(TASK_A.id);
    expect(result.current.dragState.fromSide).toBe("end");
  });

  it("classifies all other tasks as valid when no dependencies exist", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    // B and C should be valid; A (source) is excluded
    expect(result.current.dragState.validTargets.has(TASK_B.id)).toBe(true);
    expect(result.current.dragState.validTargets.has(TASK_C.id)).toBe(true);
    expect(result.current.dragState.validTargets.has(TASK_A.id)).toBe(false);
    expect(result.current.dragState.invalidTargets.size).toBe(0);
  });

  it("marks task as invalid when dragging would create a cycle", () => {
    // A → B already exists, so dragging B → A would create a cycle
    useDependencyStore.getState().addDependency(TASK_A.id, TASK_B.id);

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    // Drag from B's end — target A would create B → A (cycle since A → B exists)
    act(() => {
      result.current.startDrag(TASK_B.id, "end", makeMouseEvent());
    });

    expect(result.current.dragState.invalidTargets.has(TASK_A.id)).toBe(true);
    expect(result.current.dragState.validTargets.has(TASK_C.id)).toBe(true);
  });

  it("does not start drag when enabled=false", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS, enabled: false })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("captures initial mouse position from event", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent(250, 80));
    });

    expect(result.current.dragState.currentPosition).toEqual({ x: 250, y: 80 });
  });

  // -------------------------------------------------------------------------
  // isValidTarget / isInvalidTarget
  // -------------------------------------------------------------------------

  it("isValidTarget returns true for tasks in validTargets", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    expect(result.current.isValidTarget(TASK_B.id)).toBe(true);
    expect(result.current.isValidTarget(TASK_A.id)).toBe(false);
  });

  it("isInvalidTarget returns true for tasks that would create a cycle", () => {
    useDependencyStore.getState().addDependency(TASK_A.id, TASK_B.id);

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_B.id, "end", makeMouseEvent());
    });

    expect(result.current.isInvalidTarget(TASK_A.id)).toBe(true);
    expect(result.current.isInvalidTarget(TASK_C.id)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // endDrag
  // -------------------------------------------------------------------------

  it("resets drag state when endDrag called with no target", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag();
    });

    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.fromTaskId).toBeNull();
  });

  it("creates dependency when endDrag called with valid target", () => {
    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag(TASK_B.id);
    });

    expect(addDepSpy).toHaveBeenCalledWith(TASK_A.id, TASK_B.id);
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("does not create dependency when endDrag called with invalid target", () => {
    // Create A → B so that B → A would be a cycle
    useDependencyStore.getState().addDependency(TASK_A.id, TASK_B.id);

    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_B.id, "end", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag(TASK_A.id);
    });

    // addDependency should NOT have been called (target is invalid)
    expect(addDepSpy).not.toHaveBeenCalled();
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("resolves direction correctly for start-handle drag (target → source)", () => {
    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    // Dragging from A's START handle — dependency should be B → A
    act(() => {
      result.current.startDrag(TASK_A.id, "start", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag(TASK_B.id);
    });

    // fromId = target (B), toId = source (A) for start-handle drags
    expect(addDepSpy).toHaveBeenCalledWith(TASK_B.id, TASK_A.id);
  });

  // -------------------------------------------------------------------------
  // cancelDrag
  // -------------------------------------------------------------------------

  it("cancelDrag resets state without creating a dependency", () => {
    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    act(() => {
      result.current.cancelDrag();
    });

    expect(addDepSpy).not.toHaveBeenCalled();
    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.fromTaskId).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Escape key
  // -------------------------------------------------------------------------

  it("Escape key cancels an active drag", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    expect(result.current.dragState.isDragging).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("Escape key has no effect when not dragging", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    // No drag started — ESC should silently do nothing
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.dragState.isDragging).toBe(false);
  });

  // -------------------------------------------------------------------------
  // updateDragPosition
  // -------------------------------------------------------------------------

  it("updateDragPosition updates currentPosition", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent(100, 50));
    });

    act(() => {
      result.current.updateDragPosition({
        clientX: 300,
        clientY: 120,
      } as MouseEvent);
    });

    expect(result.current.dragState.currentPosition).toEqual({
      x: 300,
      y: 120,
    });
  });

  // -------------------------------------------------------------------------
  // getHoveredTaskId
  // -------------------------------------------------------------------------

  it("getHoveredTaskId returns taskId when point is inside a task rect", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    const positions = new Map<
      TaskId,
      { x: number; y: number; width: number; height: number }
    >([
      [TASK_A.id, { x: 100, y: 40, width: 200, height: 26 }],
      [TASK_B.id, { x: 100, y: 80, width: 200, height: 26 }],
    ]);

    const hovered = result.current.getHoveredTaskId(150, 50, positions);
    expect(hovered).toBe(TASK_A.id);
  });

  it("getHoveredTaskId returns null when point is outside all task rects", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    const positions = new Map<
      TaskId,
      { x: number; y: number; width: number; height: number }
    >([
      [TASK_A.id, { x: 100, y: 40, width: 200, height: 26 }],
    ]);

    const hovered = result.current.getHoveredTaskId(500, 500, positions);
    expect(hovered).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Global mouse event cleanup
  // -------------------------------------------------------------------------

  it("removes global listeners on unmount during an active drag", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { result, unmount } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    unmount();

    // Should have called removeEventListener for the drag-phase listeners
    const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedEvents).toContain("mousemove");
    expect(removedEvents).toContain("mouseup");
    expect(removedEvents).toContain("keydown");
  });
});
