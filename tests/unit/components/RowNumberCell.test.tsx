/**
 * Unit tests for RowNumberCell component
 * Focus: Shift+click range selection anchor behavior (#29)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RowNumberCell } from "../../../src/components/TaskList/RowNumberCell";
import {
  dragState,
  resetDragState,
} from "../../../src/components/TaskList/dragSelectionState";

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

  describe("hover and focus controls", () => {
    it("should show insert buttons on mouse hover", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseEnter(cell);

      expect(
        screen.getByRole("button", { name: "Insert row above row 1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Insert row below row 1" })
      ).toBeInTheDocument();
    });

    it("should hide controls on mouse leave", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseEnter(cell);
      expect(
        screen.getByRole("button", { name: "Insert row above row 1" })
      ).toBeInTheDocument();

      fireEvent.mouseLeave(cell);
      expect(
        screen.queryByRole("button", { name: "Insert row above row 1" })
      ).not.toBeInTheDocument();
    });

    it("should show controls on keyboard focus", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.focus(cell);

      expect(
        screen.getByRole("button", { name: "Insert row above row 1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Insert row below row 1" })
      ).toBeInTheDocument();
    });

    it("should hide controls when focus leaves cell entirely", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.focus(cell);
      expect(
        screen.getByRole("button", { name: "Insert row above row 1" })
      ).toBeInTheDocument();

      // Focus leaves to an element outside the cell
      fireEvent.blur(cell, { relatedTarget: document.body });

      expect(
        screen.queryByRole("button", { name: "Insert row above row 1" })
      ).not.toBeInTheDocument();
    });

    it("should keep controls visible when focus moves between child elements", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.focus(cell);
      const insertBtn = screen.getByRole("button", {
        name: "Insert row above row 1",
      });

      // Focus moves to a child button inside the cell
      fireEvent.blur(cell, { relatedTarget: insertBtn });

      expect(
        screen.getByRole("button", { name: "Insert row above row 1" })
      ).toBeInTheDocument();
    });

    it("should show drag handle with correct aria-label", () => {
      render(<RowNumberCell {...defaultProps} taskName="Design phase" />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseEnter(cell);

      expect(
        screen.getByRole("button", { name: "Drag to reorder Design phase" })
      ).toBeInTheDocument();
    });

    it("should use fallback drag handle label when no taskName", () => {
      render(<RowNumberCell {...defaultProps} />);
      const cell = screen.getByRole("gridcell");

      fireEvent.mouseEnter(cell);

      expect(
        screen.getByRole("button", { name: "Drag to reorder row 1" })
      ).toBeInTheDocument();
    });
  });

  describe("resetDragState", () => {
    it("should reset all drag state fields", () => {
      dragState.isDragging = true;
      dragState.startTaskId = "task-1";
      dragState.onDragSelect = vi.fn();

      resetDragState();

      expect(dragState.isDragging).toBe(false);
      expect(dragState.startTaskId).toBeNull();
      expect(dragState.onDragSelect).toBeNull();
    });
  });
});
