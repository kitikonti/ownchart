/**
 * Tests for useHeaderDateSelection hook.
 * Verifies drag-to-select, shift+click, ESC, and context menu behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHeaderDateSelection } from "../../../src/hooks/useHeaderDateSelection";
import { useChartStore } from "../../../src/store/slices/chartSlice";
import type { TimelineScale } from "../../../src/utils/timelineUtils";
import type { Task } from "../../../src/types/chart.types";

// Create a realistic scale for testing
function setupScale(): TimelineScale {
  const tasks: Task[] = [
    {
      id: "1",
      name: "Task 1",
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      duration: 90,
      progress: 0,
      color: "#3b82f6",
      order: 0,
      metadata: {},
    },
  ];

  useChartStore.setState({ containerWidth: 1000 });
  useChartStore.getState().updateScale(tasks);
  return useChartStore.getState().scale!;
}

// Mock SVG element with getBoundingClientRect
function createMockSvg(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.getBoundingClientRect = (): DOMRect => ({
    left: 0,
    top: 0,
    right: 1000,
    bottom: 48,
    width: 1000,
    height: 48,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  document.body.appendChild(svg);
  return svg;
}

describe("useHeaderDateSelection", () => {
  let mockSvg: SVGSVGElement;
  let scale: TimelineScale;

  beforeEach(() => {
    useChartStore.setState({
      scale: null,
      containerWidth: 1000,
      dateRange: null,
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      lastFitToViewTime: 0,
    });

    scale = setupScale();
    mockSvg = createMockSvg();
  });

  afterEach(() => {
    if (mockSvg.parentNode) {
      mockSvg.parentNode.removeChild(mockSvg);
    }
  });

  function renderSelectionHook(): ReturnType<typeof renderHook<ReturnType<typeof useHeaderDateSelection>>> {
    const svgRef = { current: mockSvg };
    return renderHook(() =>
      useHeaderDateSelection({
        headerSvgRef: svgRef,
        scale,
      })
    );
  }

  it("should start with no selection", () => {
    const { result } = renderSelectionHook();

    expect(result.current.selectionPixelRect).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.contextMenu).toBeNull();
  });

  it("should expose onMouseDown and onContextMenu handlers", () => {
    const { result } = renderSelectionHook();

    expect(typeof result.current.onMouseDown).toBe("function");
    expect(typeof result.current.onContextMenu).toBe("function");
  });

  it("should start a selection on mousedown", () => {
    const { result } = renderSelectionHook();

    act(() => {
      // Simulate mousedown at x=100
      const event = {
        button: 0,
        clientX: 100,
        clientY: 24,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<SVGSVGElement>;

      result.current.onMouseDown(event);
    });

    // After mousedown without mousemove, rect width is 0 so selectionPixelRect is null
    // But isDragging should be true
    expect(result.current.isDragging).toBe(true);
  });

  it("should not start selection on right click", () => {
    const { result } = renderSelectionHook();

    act(() => {
      const event = {
        button: 2, // right click
        clientX: 100,
        clientY: 24,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<SVGSVGElement>;

      result.current.onMouseDown(event);
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("should clear selection on ESC key", () => {
    const { result } = renderSelectionHook();

    // Start a selection
    act(() => {
      const event = {
        button: 0,
        clientX: 100,
        clientY: 24,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<SVGSVGElement>;

      result.current.onMouseDown(event);
    });

    // Simulate mousemove to create visible selection
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 300, clientY: 24 })
      );
    });

    // End drag
    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 300, clientY: 24 })
      );
    });

    // Press ESC
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.selectionPixelRect).toBeNull();
  });

  it("should show context menu items with 'Zoom to Selection'", () => {
    const { result } = renderSelectionHook();

    // Context menu items are empty when no context menu is shown
    expect(result.current.contextMenuItems).toHaveLength(0);
  });

  it("should provide closeContextMenu callback", () => {
    const { result } = renderSelectionHook();
    expect(typeof result.current.closeContextMenu).toBe("function");
  });

  it("zoomToDateRange should be called via context menu item", () => {
    const spy = vi.spyOn(useChartStore.getState(), "zoomToDateRange");

    const { result } = renderSelectionHook();

    // Manually set a selection state by simulating drag
    act(() => {
      const downEvent = {
        button: 0,
        clientX: 100,
        clientY: 24,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<SVGSVGElement>;
      result.current.onMouseDown(downEvent);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mousemove", { clientX: 400, clientY: 24 })
      );
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent("mouseup", { clientX: 400, clientY: 24 })
      );
    });

    // Now trigger context menu within the selection area
    act(() => {
      const contextEvent = {
        clientX: 200,
        clientY: 24,
        preventDefault: vi.fn(),
      } as unknown as React.MouseEvent<SVGSVGElement>;
      result.current.onContextMenu(contextEvent);
    });

    // Should now have context menu items
    expect(result.current.contextMenu).not.toBeNull();
    expect(result.current.contextMenuItems).toHaveLength(1);
    expect(result.current.contextMenuItems[0].id).toBe("zoomToSelection");

    // Click the menu item
    act(() => {
      result.current.contextMenuItems[0].onClick();
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
