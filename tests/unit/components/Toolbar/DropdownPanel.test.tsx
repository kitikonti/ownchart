/**
 * Unit tests for DropdownPanel component.
 * Verifies ARIA attribute forwarding, alignment style, minWidth/width/maxHeight
 * style properties, and data attribute presence.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DropdownPanel } from "../../../../src/components/Toolbar/DropdownPanel";

describe("DropdownPanel", () => {
  describe("rendering", () => {
    it("renders children", () => {
      render(<DropdownPanel>Panel content</DropdownPanel>);
      expect(screen.getByText("Panel content")).toBeInTheDocument();
    });

    it("includes the dropdown-panel CSS class", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      expect(container.firstChild).toHaveClass("dropdown-panel");
    });

    it("renders the data-dropdown-panel attribute", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      expect(container.firstChild).toHaveAttribute("data-dropdown-panel");
    });

    it("merges additional className with dropdown-panel", () => {
      const { container } = render(
        <DropdownPanel className="extra-class">content</DropdownPanel>
      );
      expect(container.firstChild).toHaveClass("dropdown-panel");
      expect(container.firstChild).toHaveClass("extra-class");
    });
  });

  describe("ARIA attributes", () => {
    it("does not render role attribute when role is not provided", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      expect(container.firstChild).not.toHaveAttribute("role");
    });

    it("renders role attribute when provided", () => {
      const { container } = render(
        <DropdownPanel role="menu" aria-label="Options menu">content</DropdownPanel>
      );
      expect(container.firstChild).toHaveAttribute("role", "menu");
    });

    it("renders aria-label when provided with role", () => {
      const { container } = render(
        <DropdownPanel role="listbox" aria-label="Choose option">content</DropdownPanel>
      );
      expect(container.firstChild).toHaveAttribute("aria-label", "Choose option");
    });
  });

  describe("alignment", () => {
    it("applies left-0 class by default", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      expect(container.firstChild).toHaveClass("left-0");
      expect(container.firstChild).not.toHaveClass("right-0");
    });

    it("applies right-0 class when align='right'", () => {
      const { container } = render(
        <DropdownPanel align="right">content</DropdownPanel>
      );
      expect(container.firstChild).toHaveClass("right-0");
      expect(container.firstChild).not.toHaveClass("left-0");
    });

    it("applies left-0 class when align='left'", () => {
      const { container } = render(
        <DropdownPanel align="left">content</DropdownPanel>
      );
      expect(container.firstChild).toHaveClass("left-0");
      expect(container.firstChild).not.toHaveClass("right-0");
    });
  });

  describe("width and minWidth styles", () => {
    it("applies default minWidth of 100%", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      const el = container.firstChild as HTMLElement;
      expect(el.style.minWidth).toBe("100%");
    });

    it("applies custom minWidth when provided", () => {
      const { container } = render(
        <DropdownPanel minWidth="200px">content</DropdownPanel>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.minWidth).toBe("200px");
    });

    it("suppresses minWidth when passed empty string", () => {
      const { container } = render(
        <DropdownPanel minWidth="">content</DropdownPanel>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.minWidth).toBe("");
    });

    it("applies width when provided", () => {
      const { container } = render(
        <DropdownPanel width="320px">content</DropdownPanel>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.width).toBe("320px");
    });

    it("does not apply width when not provided", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      const el = container.firstChild as HTMLElement;
      expect(el.style.width).toBe("");
    });
  });

  describe("maxHeight scroll", () => {
    it("applies maxHeight and overflowY=auto when maxHeight is provided", () => {
      const { container } = render(
        <DropdownPanel maxHeight="300px">content</DropdownPanel>
      );
      const el = container.firstChild as HTMLElement;
      expect(el.style.maxHeight).toBe("300px");
      expect(el.style.overflowY).toBe("auto");
    });

    it("does not apply maxHeight or overflowY when maxHeight is not provided", () => {
      const { container } = render(<DropdownPanel>content</DropdownPanel>);
      const el = container.firstChild as HTMLElement;
      expect(el.style.maxHeight).toBe("");
      expect(el.style.overflowY).toBe("");
    });
  });
});
