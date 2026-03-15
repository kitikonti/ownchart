/**
 * Tests for useMarqueeSelection hook.
 *
 * Pure function tests cover rectsIntersect and normalizeRect directly.
 * Hook integration tests verify state transitions, onSelectionChange callbacks,
 * and guard conditions (button, enabled flag, task-bar target).
 */

import { createRef } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useMarqueeSelection,
  rectsIntersect,
  normalizeRect,
  type TaskGeometry,
} from "@/hooks/useMarqueeSelection";
import type { TaskId } from "@/types/branded.types";

// ---------------------------------------------------------------------------
// Pure function: rectsIntersect
// ---------------------------------------------------------------------------

describe("rectsIntersect", () => {
  it("should return true for overlapping rectangles", () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 5, width: 10, height: 10 }
      )
    ).toBe(true);
  });

  it("should return false for rectangles that are side by side with a gap", () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 11, y: 0, width: 10, height: 10 }
      )
    ).toBe(false);
  });

  it("should return false for rectangles stacked vertically with a gap", () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 0, y: 11, width: 10, height: 10 }
      )
    ).toBe(false);
  });

  it("should return true when one rectangle contains the other", () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 25, y: 25, width: 10, height: 10 }
      )
    ).toBe(true);
  });

  it("should return true for touching edges (boundary contact)", () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 10, y: 0, width: 10, height: 10 }
      )
    ).toBe(true);
  });

  it("should return false when a zero-size rect does not touch the other", () => {
    expect(
      rectsIntersect(
        { x: 0, y: 0, width: 0, height: 0 },
        { x: 5, y: 5, width: 10, height: 10 }
      )
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pure function: normalizeRect
// ---------------------------------------------------------------------------

describe("normalizeRect", () => {
  it("should preserve coordinates when dragging down-right", () => {
    expect(
      normalizeRect({ startX: 10, startY: 20, currentX: 50, currentY: 60 })
    ).toEqual({ x: 10, y: 20, width: 40, height: 40 });
  });

  it("should flip coordinates when dragging up-left", () => {
    expect(
      normalizeRect({ startX: 50, startY: 60, currentX: 10, currentY: 20 })
    ).toEqual({ x: 10, y: 20, width: 40, height: 40 });
  });

  it("should return zero size for a click-in-place (no drag distance)", () => {
    expect(
      normalizeRect({ startX: 30, startY: 30, currentX: 30, currentY: 30 })
    ).toEqual({ x: 30, y: 30, width: 0, height: 0 });
  });

  it("should handle mixed directions (right, up)", () => {
    expect(
      normalizeRect({ startX: 10, startY: 60, currentX: 50, currentY: 20 })
    ).toEqual({ x: 10, y: 20, width: 40, height: 40 });
  });
});

// ---------------------------------------------------------------------------
// Hook integration
// ---------------------------------------------------------------------------

describe("useMarqueeSelection", () => {
  const mockOnSelectionChange = vi.fn();
  let svgRef: React.RefObject<SVGSVGElement | null>;
  let mockSvg: SVGSVGElement;

  function makeMouseDownEvent(
    overrides: Partial<{
      button: number;
      clientX: number;
      clientY: number;
      shiftKey: boolean;
      ctrlKey: boolean;
      metaKey: boolean;
      target: Element;
    }> = {}
  ): React.MouseEvent<SVGSVGElement> {
    return {
      button: 0,
      clientX: 100,
      clientY: 100,
      shiftKey: false,
      ctrlKey: false,
      metaKey: false,
      preventDefault: vi.fn(),
      target: mockSvg,
      ...overrides,
    } as unknown as React.MouseEvent<SVGSVGElement>;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    ) as SVGSVGElement;
    mockSvg.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
    });
    svgRef = createRef<SVGSVGElement | null>();
    (svgRef as React.MutableRefObject<SVGSVGElement | null>).current = mockSvg;
  });

  afterEach(() => {
    // Ensure any lingering document listeners are removed
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
  });

  it("should start with isSelecting=false and null rects", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    expect(result.current.isSelecting).toBe(false);
    expect(result.current.marqueeRect).toBeNull();
    expect(result.current.normalizedRect).toBeNull();
  });

  it("should set isSelecting=true on mousedown and false after mouseup", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.onMouseDown(makeMouseDownEvent());
    });
    expect(result.current.isSelecting).toBe(true);

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 150, clientY: 150, bubbles: true })
      );
    });
    expect(result.current.isSelecting).toBe(false);
  });

  it("should not start selection on non-left-click (button !== 0)", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.onMouseDown(makeMouseDownEvent({ button: 2 }));
    });

    expect(result.current.isSelecting).toBe(false);
  });

  it("should not start selection when enabled=false", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
        enabled: false,
      })
    );

    act(() => {
      result.current.onMouseDown(makeMouseDownEvent());
    });

    expect(result.current.isSelecting).toBe(false);
  });

  it("should not start selection when clicking on a .task-bar element", () => {
    const taskBar = document.createElement("div");
    taskBar.className = "task-bar";
    document.body.appendChild(taskBar);

    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.onMouseDown(makeMouseDownEvent({ target: taskBar }));
    });

    expect(result.current.isSelecting).toBe(false);
    document.body.removeChild(taskBar);
  });

  it("should call onSelectionChange with intersecting task ids on mouseup", () => {
    const taskGeometries: TaskGeometry[] = [
      { id: "t1" as TaskId, x: 50, y: 50, width: 100, height: 30 },
      { id: "t2" as TaskId, x: 300, y: 300, width: 100, height: 30 },
    ];

    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries,
        onSelectionChange: mockOnSelectionChange,
      })
    );

    // Split act() calls: mousedown must flush (updating marqueeRectRef) before
    // mouseup fires, otherwise marqueeRectRef.current is still null at mouseup.
    act(() => {
      result.current.onMouseDown(
        makeMouseDownEvent({ clientX: 0, clientY: 0 })
      );
    });
    // Drag to (200,120) — intersects t1 (50–150, 50–80), not t2 (300–400, 300–330)
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 200, clientY: 120, bubbles: true })
      );
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      ["t1" as TaskId],
      false
    );
  });

  it("should pass addToSelection=true when Shift is held on mousedown", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.onMouseDown(
        makeMouseDownEvent({ clientX: 0, clientY: 0, shiftKey: true })
      );
    });
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 10, clientY: 10, bubbles: true })
      );
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith([], true);
  });

  it("should pass addToSelection=true when Ctrl is held on mousedown", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.onMouseDown(
        makeMouseDownEvent({ clientX: 0, clientY: 0, ctrlKey: true })
      );
    });
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 10, clientY: 10, bubbles: true })
      );
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith([], true);
  });

  it("should update normalizedRect as the mouse moves", () => {
    const { result } = renderHook(() =>
      useMarqueeSelection({
        svgRef,
        taskGeometries: [],
        onSelectionChange: mockOnSelectionChange,
      })
    );

    act(() => {
      result.current.onMouseDown(
        makeMouseDownEvent({ clientX: 10, clientY: 20 })
      );
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 60, clientY: 80, bubbles: true })
      );
    });

    expect(result.current.normalizedRect).toEqual({
      x: 10,
      y: 20,
      width: 50,
      height: 60,
    });
  });
});
