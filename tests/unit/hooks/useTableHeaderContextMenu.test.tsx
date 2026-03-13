/**
 * Unit tests for useTableHeaderContextMenu hook.
 *
 * Tests context menu item construction:
 * - "Size to Fit" enabled/disabled logic for different column types
 * - Column visibility checkmarks (checked = visible)
 * - "Show All Columns" disabled when no columns are hidden
 * - Separator placement after the last column toggle item
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableHeaderContextMenu } from "@/hooks/useTableHeaderContextMenu";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";

// Suppress React act() warnings from renderHook in test output
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

/** Helper to fire a synthetic right-click event on a column header. */
function fakeRightClick(x = 100, y = 200): React.MouseEvent {
  return {
    preventDefault: vi.fn(),
    clientX: x,
    clientY: y,
  } as unknown as React.MouseEvent;
}

describe("useTableHeaderContextMenu", () => {
  beforeEach(() => {
    useChartStore.setState({ hiddenColumns: [] });
    useTaskStore.setState({ columnWidths: {} });
  });

  describe("contextMenu state", () => {
    it("should be null initially", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());
      expect(result.current.contextMenu).toBeNull();
    });

    it("should set contextMenu when handleHeaderContextMenu is called", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(150, 250), "name");
      });

      expect(result.current.contextMenu).toEqual({
        position: { x: 150, y: 250 },
        columnId: "name",
      });
    });

    it("should clear contextMenu when closeContextMenu is called", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });
      act(() => {
        result.current.closeContextMenu();
      });

      expect(result.current.contextMenu).toBeNull();
    });

    it("should call preventDefault on the event", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());
      const event = fakeRightClick();

      act(() => {
        result.current.handleHeaderContextMenu(event, "name");
      });

      expect(event.preventDefault).toHaveBeenCalledOnce();
    });
  });

  describe("contextMenuItems — menu closed", () => {
    it("should return empty array when contextMenu is null", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());
      expect(result.current.contextMenuItems).toEqual([]);
    });
  });

  describe("contextMenuItems — Size to Fit", () => {
    it("should enable Size to Fit for the name column", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const sizeToFit = result.current.contextMenuItems.find(
        (item) => item.id === "sizeToFit"
      );
      expect(sizeToFit).toBeDefined();
      expect(sizeToFit?.disabled).toBe(false);
    });

    it("should disable Size to Fit for the rowNumber column", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "rowNumber");
      });

      const sizeToFit = result.current.contextMenuItems.find(
        (item) => item.id === "sizeToFit"
      );
      expect(sizeToFit?.disabled).toBe(true);
    });

    it("should disable Size to Fit for the color column", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "color");
      });

      const sizeToFit = result.current.contextMenuItems.find(
        (item) => item.id === "sizeToFit"
      );
      expect(sizeToFit?.disabled).toBe(true);
    });

    it("should always include Size All Columns to Fit item", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "startDate");
      });

      const sizeAll = result.current.contextMenuItems.find(
        (item) => item.id === "sizeAllToFit"
      );
      expect(sizeAll).toBeDefined();
      expect(sizeAll?.disabled).toBeUndefined();
    });
  });

  describe("contextMenuItems — column visibility checkmarks", () => {
    it("should mark all hideable columns as checked (visible) when none are hidden", () => {
      useChartStore.setState({ hiddenColumns: [] });
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const toggleItems = result.current.contextMenuItems.filter((item) =>
        item.id.startsWith("toggle_")
      );
      expect(toggleItems.length).toBeGreaterThan(0);
      expect(toggleItems.every((item) => item.checked === true)).toBe(true);
    });

    it("should mark a hidden column as unchecked", () => {
      useChartStore.setState({ hiddenColumns: ["progress"] });
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const progressToggle = result.current.contextMenuItems.find(
        (item) => item.id === "toggle_progress"
      );
      expect(progressToggle?.checked).toBe(false);
    });

    it("should mark visible columns as checked even when some are hidden", () => {
      useChartStore.setState({ hiddenColumns: ["progress"] });
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const startDateToggle = result.current.contextMenuItems.find(
        (item) => item.id === "toggle_startDate"
      );
      expect(startDateToggle?.checked).toBe(true);
    });

    it("should place separator after the last column toggle item", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const toggleItems = result.current.contextMenuItems.filter((item) =>
        item.id.startsWith("toggle_")
      );
      const lastToggle = toggleItems[toggleItems.length - 1];
      expect(lastToggle?.separator).toBe(true);

      // Non-last toggle items should not have separator
      if (toggleItems.length > 1) {
        expect(toggleItems[0].separator).toBeFalsy();
      }
    });
  });

  describe("contextMenuItems — Show All Columns", () => {
    it("should disable Show All Columns when no columns are hidden", () => {
      useChartStore.setState({ hiddenColumns: [] });
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const showAll = result.current.contextMenuItems.find(
        (item) => item.id === "showAllColumns"
      );
      expect(showAll?.disabled).toBe(true);
    });

    it("should enable Show All Columns when at least one column is hidden", () => {
      useChartStore.setState({ hiddenColumns: ["progress"] });
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const showAll = result.current.contextMenuItems.find(
        (item) => item.id === "showAllColumns"
      );
      expect(showAll?.disabled).toBe(false);
    });
  });

  describe("contextMenuItems — item structure", () => {
    it("should return items in order: sizeToFit, sizeAllToFit, toggles…, showAllColumns", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const ids = result.current.contextMenuItems.map((item) => item.id);
      expect(ids[0]).toBe("sizeToFit");
      expect(ids[1]).toBe("sizeAllToFit");
      expect(ids[ids.length - 1]).toBe("showAllColumns");
    });

    it("should use column menuLabel when available for toggle items", () => {
      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      // progress column has menuLabel: "Progress" (label is "%")
      const progressToggle = result.current.contextMenuItems.find(
        (item) => item.id === "toggle_progress"
      );
      expect(progressToggle?.label).toBe("Progress");
    });
  });

  describe("contextMenuItems — onClick callbacks", () => {
    it("should call autoFitColumn with the correct columnId when sizeToFit is clicked", () => {
      const mockAutoFitColumn = vi.fn();
      useTaskStore.setState({ autoFitColumn: mockAutoFitColumn });

      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "startDate");
      });

      const sizeToFit = result.current.contextMenuItems.find(
        (item) => item.id === "sizeToFit"
      );
      expect(sizeToFit).toBeDefined();

      act(() => {
        sizeToFit!.onClick();
      });

      expect(mockAutoFitColumn).toHaveBeenCalledOnce();
      expect(mockAutoFitColumn).toHaveBeenCalledWith("startDate");
    });

    it("should call autoFitAllColumns when sizeAllToFit is clicked", () => {
      const mockAutoFitAllColumns = vi.fn();
      useTaskStore.setState({ autoFitAllColumns: mockAutoFitAllColumns });

      const { result } = renderHook(() => useTableHeaderContextMenu());

      act(() => {
        result.current.handleHeaderContextMenu(fakeRightClick(), "name");
      });

      const sizeAll = result.current.contextMenuItems.find(
        (item) => item.id === "sizeAllToFit"
      );
      expect(sizeAll).toBeDefined();

      act(() => {
        sizeAll!.onClick();
      });

      expect(mockAutoFitAllColumns).toHaveBeenCalledOnce();
    });
  });
});
