/**
 * Unit tests for Checkbox component.
 * Verifies rendering, checked/unchecked states, indeterminate DOM property,
 * aria-checked attribute, disabled behaviour, and onChange callback.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Checkbox } from "@/components/common/Checkbox";

describe("Checkbox", () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
  };

  describe("rendering", () => {
    it("renders a checkbox input", () => {
      render(<Checkbox {...defaultProps} />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("forwards the id attribute when provided", () => {
      render(<Checkbox {...defaultProps} id="my-checkbox" />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("id", "my-checkbox");
    });

    it("forwards aria-label when provided", () => {
      render(<Checkbox {...defaultProps} aria-label="Enable feature" />);
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-label",
        "Enable feature"
      );
    });
  });

  describe("checked state", () => {
    it("marks the input as checked when checked=true", () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("marks the input as unchecked when checked=false", () => {
      render(<Checkbox {...defaultProps} checked={false} />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("does not set aria-checked for checked=true (native checked attribute drives AT)", () => {
      render(<Checkbox {...defaultProps} checked={true} />);
      expect(screen.getByRole("checkbox")).not.toHaveAttribute("aria-checked");
    });

    it("does not set aria-checked for checked=false (native checked attribute drives AT)", () => {
      render(<Checkbox {...defaultProps} checked={false} />);
      expect(screen.getByRole("checkbox")).not.toHaveAttribute("aria-checked");
    });
  });

  describe("indeterminate state", () => {
    it("sets the DOM indeterminate property via ref when indeterminate=true", () => {
      render(<Checkbox {...defaultProps} checked={false} indeterminate={true} />);
      const input = screen.getByRole("checkbox") as HTMLInputElement;
      expect(input.indeterminate).toBe(true);
    });

    it("does not set indeterminate when prop is false", () => {
      render(
        <Checkbox {...defaultProps} checked={false} indeterminate={false} />
      );
      const input = screen.getByRole("checkbox") as HTMLInputElement;
      expect(input.indeterminate).toBe(false);
    });

    it("sets aria-checked=mixed when indeterminate=true", () => {
      render(<Checkbox {...defaultProps} checked={false} indeterminate={true} />);
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-checked",
        "mixed"
      );
    });

    it("indeterminate=true overrides checked for aria-checked", () => {
      // Even if checked=true, indeterminate takes precedence visually and for AT
      render(<Checkbox {...defaultProps} checked={true} indeterminate={true} />);
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-checked",
        "mixed"
      );
    });
  });

  describe("disabled state", () => {
    it("disables the input when disabled=true", () => {
      render(<Checkbox {...defaultProps} disabled={true} />);
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("does not disable the input when disabled=false", () => {
      render(<Checkbox {...defaultProps} disabled={false} />);
      expect(screen.getByRole("checkbox")).not.toBeDisabled();
    });

    it("is enabled by default", () => {
      render(<Checkbox {...defaultProps} />);
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
