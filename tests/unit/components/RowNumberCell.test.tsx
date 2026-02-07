/**
 * Unit tests for RowNumberCell component
 * Focus: Shift+click range selection anchor behavior (#29)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  RowNumberCell,
  dragState,
} from "../../../src/components/TaskList/RowNumberCell";

// Reset dragState between tests
function resetDragState(): void {
  dragState.isDragging = false;
  dragState.startTaskId = null;
  dragState.onDragSelect = null;
}

describe("RowNumberCell", () => {
  const defaultProps = {
    rowNumber: 1,
    taskId: "task-1",
    isSelected: false,
    onSelectRow: vi.fn(),
    rowHeight: "32px",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetDragState();
  });

  it("should render the row number", () => {
    render(<RowNumberCell {...defaultProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should have correct aria-label", () => {
    render(<RowNumberCell {...defaultProps} />);
    expect(
      screen.getByRole("gridcell", { name: "Row 1" })
    ).toBeInTheDocument();
  });

  it("should show selected aria-label when selected", () => {
    render(<RowNumberCell {...defaultProps} isSelected={true} />);
    expect(
      screen.getByRole("gridcell", { name: "Row 1, selected" })
    ).toBeInTheDocument();
  });

  describe("mousedown behavior", () => {
    it("should set dragState.startTaskId on normal click", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseDown(cell, { button: 0 });

      expect(dragState.startTaskId).toBe("task-1");
      expect(dragState.isDragging).toBe(true);
    });

    it("should NOT set dragState.startTaskId on shift+click", () => {
      // Simulate a previous anchor from a normal click
      dragState.startTaskId = "task-0";

      render(<RowNumberCell {...defaultProps} taskId="task-3" />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseDown(cell, { button: 0, shiftKey: true });

      // Should preserve the existing anchor, not override it
      expect(dragState.startTaskId).toBe("task-0");
      expect(dragState.isDragging).toBe(true);
    });

    it("should set dragState.startTaskId on ctrl+click (not shift)", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseDown(cell, { button: 0, ctrlKey: true });

      expect(dragState.startTaskId).toBe("task-1");
    });

    it("should call onSelectRow with correct modifier keys", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      // Normal click
      fireEvent.mouseDown(cell, { button: 0 });
      expect(defaultProps.onSelectRow).toHaveBeenCalledWith(
        "task-1",
        false,
        false
      );

      vi.clearAllMocks();

      // Shift+click
      fireEvent.mouseDown(cell, { button: 0, shiftKey: true });
      expect(defaultProps.onSelectRow).toHaveBeenCalledWith(
        "task-1",
        true,
        false
      );

      vi.clearAllMocks();

      // Ctrl+click
      fireEvent.mouseDown(cell, { button: 0, ctrlKey: true });
      expect(defaultProps.onSelectRow).toHaveBeenCalledWith(
        "task-1",
        false,
        true
      );
    });

    it("should ignore right mouse button clicks", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseDown(cell, { button: 2 });

      expect(dragState.isDragging).toBe(false);
      expect(dragState.startTaskId).toBeNull();
      expect(defaultProps.onSelectRow).not.toHaveBeenCalled();
    });
  });

  describe("drag selection", () => {
    it("should call onDragSelect when mouse enters during drag", () => {
      const onSelectRow = vi.fn();
      render(
        <RowNumberCell
          {...defaultProps}
          taskId="task-2"
          rowNumber={2}
          onSelectRow={onSelectRow}
        />
      );
      const cell = screen.getByRole("gridcell");

      // Simulate an ongoing drag from another row
      dragState.isDragging = true;
      dragState.startTaskId = "task-1";
      dragState.onDragSelect = vi.fn();

      fireEvent.mouseEnter(cell);

      expect(dragState.onDragSelect).toHaveBeenCalledWith("task-2");
    });

    it("should not call onDragSelect when not dragging", () => {
      const mockDragSelect = vi.fn();
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      dragState.isDragging = false;
      dragState.onDragSelect = mockDragSelect;

      fireEvent.mouseEnter(cell);

      expect(mockDragSelect).not.toHaveBeenCalled();
    });
  });

  describe("mouseup cleanup", () => {
    it("should reset dragState on mouseup", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      // Start a drag
      fireEvent.mouseDown(cell, { button: 0 });
      expect(dragState.isDragging).toBe(true);
      expect(dragState.startTaskId).toBe("task-1");

      // End drag via global mouseup
      fireEvent.mouseUp(window);
      expect(dragState.isDragging).toBe(false);
      expect(dragState.startTaskId).toBeNull();
      expect(dragState.onDragSelect).toBeNull();
    });
  });
});
