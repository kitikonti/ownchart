/**
 * Unit tests for Checkbox component.
 * Verifies checked/indeterminate/disabled states, onChange callback, and
 * the imperative `indeterminate` DOM property set via useEffect.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Checkbox } from "../../../src/components/common/Checkbox";

describe("Checkbox", () => {
  describe("rendering", () => {
    it("renders a checkbox input", () => {
      render(<Checkbox checked={false} onChange={vi.fn()} />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("reflects checked state on the native input", () => {
      render(<Checkbox checked={true} onChange={vi.fn()} />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("reflects unchecked state on the native input", () => {
      render(<Checkbox checked={false} onChange={vi.fn()} />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("applies aria-label when provided", () => {
      render(
        <Checkbox checked={false} onChange={vi.fn()} aria-label="Enable feature" />
      );
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-label",
        "Enable feature"
      );
    });

    it("applies id to the native input when provided", () => {
      render(<Checkbox checked={false} onChange={vi.fn()} id="my-checkbox" />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("id", "my-checkbox");
    });
  });

  describe("indeterminate state", () => {
    it("sets the indeterminate DOM property via useEffect when indeterminate=true", () => {
      render(<Checkbox checked={false} onChange={vi.fn()} indeterminate={true} />);
      const input = screen.getByRole("checkbox") as HTMLInputElement;
      // The indeterminate property is only set imperatively — verify it on the DOM node.
      expect(input.indeterminate).toBe(true);
    });

    it("clears the indeterminate DOM property when indeterminate=false", () => {
      const { rerender } = render(
        <Checkbox checked={false} onChange={vi.fn()} indeterminate={true} />
      );
      rerender(<Checkbox checked={false} onChange={vi.fn()} indeterminate={false} />);
      const input = screen.getByRole("checkbox") as HTMLInputElement;
      expect(input.indeterminate).toBe(false);
    });

    it("shows Minus icon when indeterminate", () => {
      const { container } = render(
        <Checkbox checked={false} onChange={vi.fn()} indeterminate={true} />
      );
      // The visual div is aria-hidden; verify the icon SVG exists inside it.
      const visualDiv = container.querySelector("[aria-hidden='true']");
      expect(visualDiv).toBeInTheDocument();
      expect(visualDiv?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows Check icon when checked and not indeterminate", () => {
      const { container } = render(
        <Checkbox checked={true} onChange={vi.fn()} indeterminate={false} />
      );
      const visualDiv = container.querySelector("[aria-hidden='true']");
      expect(visualDiv?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows no icon when unchecked and not indeterminate", () => {
      const { container } = render(
        <Checkbox checked={false} onChange={vi.fn()} indeterminate={false} />
      );
      const visualDiv = container.querySelector("[aria-hidden='true']");
      expect(visualDiv?.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("marks the native input as disabled", () => {
      render(<Checkbox checked={false} onChange={vi.fn()} disabled={true} />);
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("does not disable the input when disabled=false", () => {
      render(<Checkbox checked={false} onChange={vi.fn()} disabled={false} />);
      expect(screen.getByRole("checkbox")).not.toBeDisabled();
    });
  });

  describe("onChange callback", () => {
    it("calls onChange with true when unchecked input is clicked", () => {
      const onChange = vi.fn();
      render(<Checkbox checked={false} onChange={onChange} />);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("calls onChange with false when checked input is clicked", () => {
      const onChange = vi.fn();
      render(<Checkbox checked={true} onChange={onChange} />);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("calls onChange exactly once per click", () => {
      const onChange = vi.fn();
      render(<Checkbox checked={false} onChange={onChange} />);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenCalledOnce();
    });
  });
});
