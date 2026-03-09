import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownItem } from "../../../../src/components/Toolbar/DropdownItem";

describe("DropdownItem", () => {
  it("renders children as the label", () => {
    render(<DropdownItem onClick={() => {}}>Task Type</DropdownItem>);
    expect(screen.getByText("Task Type")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<DropdownItem onClick={handleClick}>Action</DropdownItem>);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders type=button to prevent accidental form submission", () => {
    render(<DropdownItem onClick={() => {}}>Item</DropdownItem>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  describe("checkmark", () => {
    it("shows no checkmark icon when not selected", () => {
      render(<DropdownItem onClick={() => {}}>Item</DropdownItem>);
      // Check icon (svg) not present — only the space placeholder is rendered
      expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
    });

    it("renders checkmark when selected", () => {
      render(
        <DropdownItem onClick={() => {}} isSelected>
          Selected Item
        </DropdownItem>
      );
      // The Check phosphor icon renders as an svg inside the span
      const button = screen.getByRole("button");
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("hides checkmark column when showCheckmark=false", () => {
      render(
        <DropdownItem onClick={() => {}} isSelected showCheckmark={false}>
          No check
        </DropdownItem>
      );
      // With showCheckmark=false, no svg even when selected
      const button = screen.getByRole("button");
      expect(button.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("description", () => {
    it("renders description text when provided", () => {
      render(
        <DropdownItem onClick={() => {}} description="Subtitle text">
          Main label
        </DropdownItem>
      );
      expect(screen.getByText("Main label")).toBeInTheDocument();
      expect(screen.getByText("Subtitle text")).toBeInTheDocument();
    });

    it("does not render description element when omitted", () => {
      render(<DropdownItem onClick={() => {}}>Label only</DropdownItem>);
      // Only one text node — the label
      expect(screen.queryByText("Subtitle text")).not.toBeInTheDocument();
    });
  });

  describe("trailing content", () => {
    it("renders trailing content when provided", () => {
      render(
        <DropdownItem
          onClick={() => {}}
          trailing={<span data-testid="swatch">🎨</span>}
        >
          Color
        </DropdownItem>
      );
      expect(screen.getByTestId("swatch")).toBeInTheDocument();
    });
  });

  describe("ARIA attributes", () => {
    it("does not set aria-selected when role is not provided", () => {
      render(<DropdownItem onClick={() => {}}>Item</DropdownItem>);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-selected");
    });

    it("sets aria-selected=true when role is set and item is selected", () => {
      render(
        <DropdownItem onClick={() => {}} role="option" isSelected>
          Option
        </DropdownItem>
      );
      expect(screen.getByRole("option")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("sets aria-selected=false when role is set and item is not selected", () => {
      render(
        <DropdownItem onClick={() => {}} role="option" isSelected={false}>
          Option
        </DropdownItem>
      );
      expect(screen.getByRole("option")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("allows aria-selected override when role is set", () => {
      render(
        <DropdownItem
          onClick={() => {}}
          role="option"
          isSelected={false}
          aria-selected={true}
        >
          Override
        </DropdownItem>
      );
      expect(screen.getByRole("option")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });
});
