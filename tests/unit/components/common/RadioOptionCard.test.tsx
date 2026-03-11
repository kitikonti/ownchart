/**
 * Unit tests for RadioOptionCard component.
 * Verifies rendering, selected state styling, children visibility,
 * badge, alignment, and onChange callback.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RadioOptionCard } from "../../../../src/components/common/RadioOptionCard";

describe("RadioOptionCard", () => {
  const defaultProps = {
    name: "testGroup",
    selected: false,
    onChange: vi.fn(),
    title: "Option A",
  };

  describe("rendering", () => {
    it("renders the title", () => {
      render(<RadioOptionCard {...defaultProps} />);
      expect(screen.getByText("Option A")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(<RadioOptionCard {...defaultProps} description="Some description" />);
      expect(screen.getByText("Some description")).toBeInTheDocument();
    });

    it("does not render description element when omitted", () => {
      render(<RadioOptionCard {...defaultProps} />);
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });

    it("renders badge when provided", () => {
      render(<RadioOptionCard {...defaultProps} badge="100%" />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("does not render badge when omitted", () => {
      render(<RadioOptionCard {...defaultProps} />);
      expect(screen.queryByText("100%")).not.toBeInTheDocument();
    });

    it("renders a radio input", () => {
      render(<RadioOptionCard {...defaultProps} />);
      expect(screen.getByRole("radio")).toBeInTheDocument();
    });

    it("radio input name matches the name prop", () => {
      render(<RadioOptionCard {...defaultProps} />);
      expect(screen.getByRole("radio")).toHaveAttribute("name", "testGroup");
    });

    it("uses title as radio value by default", () => {
      render(<RadioOptionCard {...defaultProps} />);
      expect(screen.getByRole("radio")).toHaveAttribute("value", "Option A");
    });

    it("uses provided value prop over title when given", () => {
      render(<RadioOptionCard {...defaultProps} value="option-a" />);
      expect(screen.getByRole("radio")).toHaveAttribute("value", "option-a");
    });
  });

  describe("selected state", () => {
    it("marks radio as checked when selected=true", () => {
      render(<RadioOptionCard {...defaultProps} selected={true} />);
      expect(screen.getByRole("radio")).toBeChecked();
    });

    it("marks radio as unchecked when selected=false", () => {
      render(<RadioOptionCard {...defaultProps} selected={false} />);
      expect(screen.getByRole("radio")).not.toBeChecked();
    });

    it("does not set aria-current on the label (selection is conveyed by the native radio checked state)", () => {
      const { container } = render(
        <RadioOptionCard {...defaultProps} selected={true} />
      );
      expect(container.querySelector("label")).not.toHaveAttribute(
        "aria-current"
      );
    });
  });

  describe("children visibility", () => {
    it("shows children when selected=true", () => {
      render(
        <RadioOptionCard {...defaultProps} selected={true}>
          <span>Expanded content</span>
        </RadioOptionCard>
      );
      expect(screen.getByText("Expanded content")).toBeInTheDocument();
    });

    it("hides children when selected=false", () => {
      render(
        <RadioOptionCard {...defaultProps} selected={false}>
          <span>Expanded content</span>
        </RadioOptionCard>
      );
      expect(screen.queryByText("Expanded content")).not.toBeInTheDocument();
    });
  });

  describe("onChange callback", () => {
    it("calls onChange when the radio input changes", () => {
      const onChange = vi.fn();
      render(<RadioOptionCard {...defaultProps} onChange={onChange} />);
      fireEvent.click(screen.getByRole("radio"));
      expect(onChange).toHaveBeenCalledOnce();
    });
  });

  describe("aria-label forwarding", () => {
    it("forwards ariaLabel to the radio input when provided", () => {
      render(<RadioOptionCard {...defaultProps} ariaLabel="Custom label" />);
      expect(screen.getByRole("radio")).toHaveAttribute("aria-label", "Custom label");
    });
  });
});
