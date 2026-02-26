/**
 * Tests for TaskTypeIcon component.
 * Verifies rendering, accessibility, and keyboard interaction.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskTypeIcon } from "../../../src/components/TaskList/TaskTypeIcon";

describe("TaskTypeIcon", () => {
  it("renders without crashing for each type", () => {
    const { rerender } = render(<TaskTypeIcon type="task" />);
    expect(document.querySelector("svg")).toBeInTheDocument();

    rerender(<TaskTypeIcon type="summary" />);
    expect(document.querySelector("svg")).toBeInTheDocument();

    rerender(<TaskTypeIcon type="milestone" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("defaults to task type when no type is provided", () => {
    render(<TaskTypeIcon />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  describe("when not interactive (no onClick)", () => {
    it("does not render a button wrapper", () => {
      render(<TaskTypeIcon type="task" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders the icon with aria-hidden", () => {
      render(<TaskTypeIcon type="task" />);
      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden");
    });
  });

  describe("when interactive (onClick provided)", () => {
    it("wraps icon in a button role element", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="task" onClick={onClick} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has an accessible aria-label with current type", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="summary" onClick={onClick} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Summary")
      );
    });

    it("is focusable via tabIndex", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="task" onClick={onClick} />);
      expect(screen.getByRole("button")).toHaveAttribute("tabIndex", "0");
    });

    it("calls onClick on click", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="task" onClick={onClick} />);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("calls onClick on Enter key", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="task" onClick={onClick} />);
      fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("calls onClick on Space key", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="task" onClick={onClick} />);
      fireEvent.keyDown(screen.getByRole("button"), { key: " " });
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not call onClick on other keys", () => {
      const onClick = vi.fn();
      render(<TaskTypeIcon type="task" onClick={onClick} />);
      fireEvent.keyDown(screen.getByRole("button"), { key: "a" });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("stops propagation on click", () => {
      const onClick = vi.fn();
      const parentClick = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div onClick={parentClick}>
          <TaskTypeIcon type="task" onClick={onClick} />
        </div>
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
      expect(parentClick).not.toHaveBeenCalled();
    });
  });
});
