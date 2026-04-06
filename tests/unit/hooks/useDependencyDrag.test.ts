/**
 * Tests for useDependencyDrag hook.
 * Verifies drag state management, valid/invalid target classification,
 * dependency creation, and cancellation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDependencyDrag } from "@/hooks/useDependencyDrag";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import type { Task } from "@/types/chart.types";
import type { TaskId } from "@/types/branded.types";
import { toTaskId } from "@/types/branded.types";

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

  it("marks cycle correctly for start-handle drag", () => {
    // A → B already exists; dragging from B's start handle targets A → B→A would be a cycle
    useDependencyStore.getState().addDependency(TASK_A.id, TASK_B.id);

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    // Drag from B's start — direction is always source→target (B→X), so B→A creates cycle
    act(() => {
      result.current.startDrag(TASK_B.id, "start", makeMouseEvent());
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

  it("cancels an in-progress drag when enabled changes to false", () => {
    let enabled = true;
    const { result, rerender } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS, enabled })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });
    expect(result.current.dragState.isDragging).toBe(true);

    enabled = false;
    rerender();

    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.fromTaskId).toBeNull();
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

  it("does nothing and resets state when endDrag called with source task as target", () => {
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
      result.current.endDrag(TASK_A.id);
    });

    expect(addDepSpy).not.toHaveBeenCalled();
    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.fromTaskId).toBeNull();
  });

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

  it("creates FS dependency when end→start drag", () => {
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
      result.current.endDrag(TASK_B.id, "start");
    });

    // Both tasks share identical dates → FS lag = -10 (full overlap)
    expect(addDepSpy).toHaveBeenCalledWith(TASK_A.id, TASK_B.id, "FS", -10);
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
      result.current.endDrag(TASK_A.id, "start");
    });

    // addDependency should NOT have been called (target is invalid)
    expect(addDepSpy).not.toHaveBeenCalled();
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("creates SS dependency when start→start drag", () => {
    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "start", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag(TASK_B.id, "start");
    });

    // Direction is always source→target; type inferred from handle combination
    // Both tasks start on same date → SS lag = 0
    expect(addDepSpy).toHaveBeenCalledWith(TASK_A.id, TASK_B.id, "SS", 0);
  });

  it("creates FF dependency when end→end drag", () => {
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
      result.current.endDrag(TASK_B.id, "end");
    });

    // Both tasks end on same date → FF lag = 0
    expect(addDepSpy).toHaveBeenCalledWith(TASK_A.id, TASK_B.id, "FF", 0);
  });

  it("creates SF dependency when start→end drag", () => {
    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "start", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag(TASK_B.id, "end");
    });

    // SF: successor.end(Jan 10) - predecessor.start(Jan 1) = 9
    expect(addDepSpy).toHaveBeenCalledWith(TASK_A.id, TASK_B.id, "SF", 9);
  });

  it("defaults to 'start' target side when endDrag called without side (body drop)", () => {
    const addDepSpy = vi.spyOn(
      useDependencyStore.getState(),
      "addDependency"
    );

    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    // End-handle drag + body drop (no target side) → defaults to start → FS
    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent());
    });

    act(() => {
      result.current.endDrag(TASK_B.id);
    });

    // Body drop defaults to FS; same dates → lag = -10
    expect(addDepSpy).toHaveBeenCalledWith(TASK_A.id, TASK_B.id, "FS", -10);
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
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("Escape key has no effect when not dragging", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    // No drag started — ESC should silently do nothing
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.dragState.isDragging).toBe(false);
  });

  // -------------------------------------------------------------------------
  // updateDragPosition
  // -------------------------------------------------------------------------

  it("updateDragPosition updates currentPosition", async () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    act(() => {
      result.current.startDrag(TASK_A.id, "end", makeMouseEvent(100, 50));
    });

    await act(async () => {
      result.current.updateDragPosition({
        clientX: 300,
        clientY: 120,
      } as MouseEvent);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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

  it("getHoveredTaskId returns null for an empty positions map", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    const hovered = result.current.getHoveredTaskId(
      150,
      50,
      new Map()
    );
    expect(hovered).toBeNull();
  });

  it("getHoveredTaskId matches when point is exactly on the boundary (inclusive)", () => {
    const { result } = renderHook(() =>
      useDependencyDrag({ tasks: DEFAULT_TASKS })
    );

    const positions = new Map<
      TaskId,
      { x: number; y: number; width: number; height: number }
    >([
      [TASK_A.id, { x: 100, y: 40, width: 200, height: 26 }],
    ]);

    // Top-left corner (x === pos.x, y === pos.y)
    expect(result.current.getHoveredTaskId(100, 40, positions)).toBe(TASK_A.id);
    // Bottom-right corner (x === pos.x + width, y === pos.y + height)
    expect(result.current.getHoveredTaskId(300, 66, positions)).toBe(TASK_A.id);
    // One pixel outside right edge
    expect(result.current.getHoveredTaskId(301, 50, positions)).toBeNull();
  });

  it("global mouseup outside a task resets drag state without creating a dependency", () => {
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

    expect(result.current.dragState.isDragging).toBe(true);

    // Dispatch mouseup on document (no task target — simulates drop in empty space)
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.fromTaskId).toBeNull();
    expect(addDepSpy).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Global mouse event cleanup
  // -------------------------------------------------------------------------

  it("removes global listeners on unmount during an active drag", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");

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
