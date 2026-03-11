/**
 * Unit tests for Radio component.
 * Verifies rendering, checked/unchecked states, disabled behaviour,
 * value/name forwarding, aria-label, and onChange callback.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Radio } from "../../../../src/components/common/Radio";

describe("Radio", () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
    name: "group",
  };

  describe("rendering", () => {
    it("renders a radio input", () => {
      render(<Radio {...defaultProps} />);
      expect(screen.getByRole("radio")).toBeInTheDocument();
    });

    it("forwards the name attribute", () => {
      render(<Radio {...defaultProps} name="myGroup" />);
      expect(screen.getByRole("radio")).toHaveAttribute("name", "myGroup");
    });

    it("forwards the value attribute when provided", () => {
      render(<Radio {...defaultProps} value="option-a" />);
      expect(screen.getByRole("radio")).toHaveAttribute("value", "option-a");
    });

    it("forwards the id attribute when provided", () => {
      render(<Radio {...defaultProps} id="my-radio" />);
      expect(screen.getByRole("radio")).toHaveAttribute("id", "my-radio");
    });

    it("forwards aria-label when provided", () => {
      render(<Radio {...defaultProps} aria-label="Select option A" />);
      expect(screen.getByRole("radio")).toHaveAttribute(
        "aria-label",
        "Select option A"
      );
    });
  });

  describe("checked state", () => {
    it("marks the input as checked when checked=true", () => {
      render(<Radio {...defaultProps} checked={true} />);
      expect(screen.getByRole("radio")).toBeChecked();
    });

    it("marks the input as unchecked when checked=false", () => {
      render(<Radio {...defaultProps} checked={false} />);
      expect(screen.getByRole("radio")).not.toBeChecked();
    });
  });

  describe("disabled state", () => {
    it("disables the input when disabled=true", () => {
      render(<Radio {...defaultProps} disabled={true} />);
      expect(screen.getByRole("radio")).toBeDisabled();
    });

    it("does not disable the input when disabled=false", () => {
      render(<Radio {...defaultProps} disabled={false} />);
      expect(screen.getByRole("radio")).not.toBeDisabled();
    });

    it("is enabled by default", () => {
      render(<Radio {...defaultProps} />);
      expect(screen.getByRole("radio")).not.toBeDisabled();
    });
  });

  describe("onChange callback", () => {
    it("calls onChange when the radio input changes", () => {
      const onChange = vi.fn();
      render(<Radio {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole("radio"));
      expect(onChange).toHaveBeenCalledOnce();
    });
  });
});
