/**
 * Unit tests for ColumnResizer component.
 * Verifies keyboard navigation, ARIA attributes, and resize callbacks.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnResizer } from "../../../src/components/TaskList/ColumnResizer";

describe("ColumnResizer", () => {
  const defaultProps = {
    columnId: "name",
    onResize: vi.fn(),
    onAutoResize: vi.fn(),
    currentWidth: 200,
    minWidth: 60,
    maxWidth: 800,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ARIA attributes", () => {
    it("renders with correct role and orientation", () => {
      render(<ColumnResizer {...defaultProps} />);
      const resizer = screen.getByRole("separator");
      expect(resizer).toBeInTheDocument();
      expect(resizer).toHaveAttribute("aria-orientation", "vertical");
    });

    it("reflects current width in aria-valuenow", () => {
      render(<ColumnResizer {...defaultProps} />);
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-valuenow",
        "200"
      );
    });

    it("reflects minWidth in aria-valuemin", () => {
      render(<ColumnResizer {...defaultProps} />);
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-valuemin",
        "60"
      );
    });

    it("reflects maxWidth in aria-valuemax", () => {
      render(<ColumnResizer {...defaultProps} />);
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-valuemax",
        "800"
      );
    });

    it("uses MAX_COLUMN_WIDTH fallback for aria-valuemax when maxWidth is not provided", () => {
      render(<ColumnResizer {...defaultProps} maxWidth={undefined} />);
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-valuemax",
        "1200"
      );
    });

    it("includes column id in aria-label", () => {
      render(<ColumnResizer {...defaultProps} />);
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-label",
        expect.stringContaining("name")
      );
    });

    it("is keyboard focusable", () => {
      render(<ColumnResizer {...defaultProps} />);
      expect(screen.getByRole("separator")).toHaveAttribute("tabIndex", "0");
    });
  });

  describe("keyboard resizing", () => {
    it("calls onResize with decreased width on ArrowLeft", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
      expect(defaultProps.onResize).toHaveBeenCalledWith("name", 195); // 200 - 5
    });

    it("calls onResize with increased width on ArrowRight", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
      expect(defaultProps.onResize).toHaveBeenCalledWith("name", 205); // 200 + 5
    });

    it("uses larger step on Shift+ArrowLeft", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("separator"), {
        key: "ArrowLeft",
        shiftKey: true,
      });
      expect(defaultProps.onResize).toHaveBeenCalledWith("name", 180); // 200 - 20
    });

    it("uses larger step on Shift+ArrowRight", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("separator"), {
        key: "ArrowRight",
        shiftKey: true,
      });
      expect(defaultProps.onResize).toHaveBeenCalledWith("name", 220); // 200 + 20
    });

    it("clamps to minWidth on ArrowLeft when near minimum", () => {
      render(<ColumnResizer {...defaultProps} currentWidth={62} />);
      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
      expect(defaultProps.onResize).toHaveBeenCalledWith("name", 60);
    });
  });

  describe("auto-resize", () => {
    it("calls onAutoResize on double-click", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.doubleClick(screen.getByRole("separator"));
      expect(defaultProps.onAutoResize).toHaveBeenCalledWith("name");
    });

    it("calls onAutoResize on Enter key", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("separator"), { key: "Enter" });
      expect(defaultProps.onAutoResize).toHaveBeenCalledWith("name");
    });

    it("calls onAutoResize on Space key", () => {
      render(<ColumnResizer {...defaultProps} />);
      fireEvent.keyDown(screen.getByRole("separator"), { key: " " });
      expect(defaultProps.onAutoResize).toHaveBeenCalledWith("name");
    });

    it("does not throw when onAutoResize is not provided", () => {
      render(<ColumnResizer {...defaultProps} onAutoResize={undefined} />);
      expect(() =>
        fireEvent.keyDown(screen.getByRole("separator"), { key: "Enter" })
      ).not.toThrow();
    });
  });
});
