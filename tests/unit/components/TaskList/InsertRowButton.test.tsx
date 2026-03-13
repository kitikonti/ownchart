/**
 * Unit tests for InsertRowButton component.
 * Verifies rendering, accessibility, interaction, and active/inactive states.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InsertRowButton } from "../../../../src/components/TaskList/InsertRowButton";

const defaultProps = {
  position: "above" as const,
  rowNumber: 3,
  isActive: false,
  onInsert: vi.fn(),
  onHoverStart: vi.fn(),
  onHoverEnd: vi.fn(),
  controlsColor: "#2563eb",
};

describe("InsertRowButton", () => {
  it("renders a button element", () => {
    render(<InsertRowButton {...defaultProps} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has type=button to prevent form submission", () => {
    render(<InsertRowButton {...defaultProps} />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("renders correct aria-label for 'above' position", () => {
    render(<InsertRowButton {...defaultProps} position="above" rowNumber={5} />);
    expect(screen.getByRole("button", { name: "Insert above row 5" })).toBeInTheDocument();
  });

  it("renders correct aria-label for 'below' position", () => {
    render(<InsertRowButton {...defaultProps} position="below" rowNumber={2} />);
    expect(screen.getByRole("button", { name: "Insert below row 2" })).toBeInTheDocument();
  });

  it("calls onInsert when clicked", () => {
    const onInsert = vi.fn();
    render(<InsertRowButton {...defaultProps} onInsert={onInsert} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onInsert).toHaveBeenCalledTimes(1);
  });

  it("does not crash when onInsert is undefined", () => {
    render(<InsertRowButton {...defaultProps} onInsert={undefined} />);
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
  });

  it("calls onHoverStart on mouse enter", () => {
    const onHoverStart = vi.fn();
    render(<InsertRowButton {...defaultProps} onHoverStart={onHoverStart} />);
    fireEvent.mouseEnter(screen.getByRole("button"));
    expect(onHoverStart).toHaveBeenCalledTimes(1);
  });

  it("calls onHoverEnd on mouse leave", () => {
    const onHoverEnd = vi.fn();
    render(<InsertRowButton {...defaultProps} onHoverEnd={onHoverEnd} />);
    fireEvent.mouseLeave(screen.getByRole("button"));
    expect(onHoverEnd).toHaveBeenCalledTimes(1);
  });

  it("stops event propagation on click", () => {
    const parentClickHandler = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- test wrapper only
      <div onClick={parentClickHandler}>
        <InsertRowButton {...defaultProps} />
      </div>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  describe("active (isActive=true) state", () => {
    it("renders an expanded circle with border", () => {
      render(<InsertRowButton {...defaultProps} isActive={true} />);
      // Active state renders a flex div (circle + icon) inside the button
      const button = screen.getByRole("button");
      const innerDiv = button.querySelector("div");
      expect(innerDiv).not.toBeNull();
      // The active circle has an inline border style using controlsColor
      expect(innerDiv?.style.border).toContain("1px solid");
    });

    it("renders a Plus icon inside the active circle", () => {
      const { container } = render(
        <InsertRowButton {...defaultProps} isActive={true} />
      );
      // Phosphor icons render as SVG
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
    });
  });

  describe("inactive (isActive=false) state", () => {
    it("renders a small dot without icon", () => {
      const { container } = render(
        <InsertRowButton {...defaultProps} isActive={false} />
      );
      // Inactive state: a simple div dot, no SVG
      const svg = container.querySelector("svg");
      expect(svg).toBeNull();
    });

    it("renders a div with border using controlsColor", () => {
      render(<InsertRowButton {...defaultProps} isActive={false} />);
      const button = screen.getByRole("button");
      const dot = button.querySelector("div");
      expect(dot?.style.border).toContain("1px solid");
    });
  });

  it("positions button at top when position is 'above'", () => {
    render(<InsertRowButton {...defaultProps} position="above" />);
    const button = screen.getByRole("button");
    expect(button.style.top).toBeTruthy();
    expect(button.style.bottom).toBe("");
  });

  it("positions button at bottom when position is 'below'", () => {
    render(<InsertRowButton {...defaultProps} position="below" />);
    const button = screen.getByRole("button");
    expect(button.style.bottom).toBeTruthy();
    expect(button.style.top).toBe("");
  });
});
