/**
 * Unit tests for SplitPaneDivider component.
 * Focuses on keyboard interaction and ARIA semantics.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SplitPaneDivider } from "../../../../src/components/Layout/SplitPaneDivider";

const defaultProps = {
  onMouseDown: vi.fn(),
  onResize: vi.fn(),
  isDragging: false,
  currentWidth: 300,
  minWidth: 120,
  maxWidth: 800,
};

describe("SplitPaneDivider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("keyboard resize", () => {
    it("calls onResize with -20 on ArrowLeft", () => {
      const onResize = vi.fn();
      render(<SplitPaneDivider {...defaultProps} onResize={onResize} />);

      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowLeft" });
      expect(onResize).toHaveBeenCalledWith(-20);
    });

    it("calls onResize with +20 on ArrowRight", () => {
      const onResize = vi.fn();
      render(<SplitPaneDivider {...defaultProps} onResize={onResize} />);

      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
      expect(onResize).toHaveBeenCalledWith(20);
    });

    it("does not call onResize for unrelated keys", () => {
      const onResize = vi.fn();
      render(<SplitPaneDivider {...defaultProps} onResize={onResize} />);

      fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowUp" });
      fireEvent.keyDown(screen.getByRole("separator"), { key: "Tab" });
      expect(onResize).not.toHaveBeenCalled();
    });
  });

  describe("expand on Enter when collapsed", () => {
    it("calls onExpand on Enter when isCollapsed is true", () => {
      const onExpand = vi.fn();
      render(
        <SplitPaneDivider
          {...defaultProps}
          isCollapsed={true}
          onExpand={onExpand}
        />
      );

      fireEvent.keyDown(screen.getByRole("separator"), { key: "Enter" });
      expect(onExpand).toHaveBeenCalledTimes(1);
    });

    it("does not call onExpand on Enter when not collapsed", () => {
      const onExpand = vi.fn();
      render(
        <SplitPaneDivider
          {...defaultProps}
          isCollapsed={false}
          onExpand={onExpand}
        />
      );

      fireEvent.keyDown(screen.getByRole("separator"), { key: "Enter" });
      expect(onExpand).not.toHaveBeenCalled();
    });

    it("does not throw on Enter when onExpand is not provided", () => {
      render(
        <SplitPaneDivider {...defaultProps} isCollapsed={true} onExpand={undefined} />
      );

      expect(() =>
        fireEvent.keyDown(screen.getByRole("separator"), { key: "Enter" })
      ).not.toThrow();
    });
  });

  describe("ARIA attributes", () => {
    it("has correct separator role and ARIA attributes", () => {
      render(<SplitPaneDivider {...defaultProps} />);

      const separator = screen.getByRole("separator");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
      expect(separator).toHaveAttribute("aria-valuenow", "300");
      expect(separator).toHaveAttribute("aria-valuemin", "120");
      expect(separator).toHaveAttribute("aria-valuemax", "800");
    });

    it("has expand aria-label when collapsed", () => {
      render(<SplitPaneDivider {...defaultProps} isCollapsed={true} />);

      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-label",
        "Expand task table. Press Enter or drag right."
      );
    });

    it("has resize aria-label when not collapsed", () => {
      render(<SplitPaneDivider {...defaultProps} isCollapsed={false} />);

      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-label",
        "Resize panel. Use left/right arrow keys."
      );
    });

    it("is keyboard focusable", () => {
      render(<SplitPaneDivider {...defaultProps} />);

      expect(screen.getByRole("separator")).toHaveAttribute("tabIndex", "0");
    });
  });
});
