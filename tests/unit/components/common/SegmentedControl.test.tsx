/**
 * Unit tests for SegmentedControl component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "../../../../src/components/common/SegmentedControl";

const basicOptions = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

describe("SegmentedControl", () => {
  describe("inline layout (default)", () => {
    it("renders all options", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Test control"
        />
      );

      expect(screen.getByText("Option A")).toBeInTheDocument();
      expect(screen.getByText("Option B")).toBeInTheDocument();
      expect(screen.getByText("Option C")).toBeInTheDocument();
    });

    it("calls onChange with selected value", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Test control"
        />
      );

      fireEvent.click(screen.getByText("Option B"));
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("applies active styles to selected option", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="b"
          onChange={vi.fn()}
          ariaLabel="Test control"
        />
      );

      const selectedButton = screen.getByText("Option B").closest("button");
      expect(selectedButton?.className).toContain("bg-brand-600");
      expect(selectedButton?.className).toContain("text-white");
    });

    it("applies inactive styles to unselected options", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="b"
          onChange={vi.fn()}
          ariaLabel="Test control"
        />
      );

      const unselectedButton = screen.getByText("Option A").closest("button");
      expect(unselectedButton?.className).toContain("bg-white");
      expect(unselectedButton?.className).toContain("text-neutral-700");
    });

    it("renders with role=group and aria-label", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="My group"
        />
      );

      expect(
        screen.getByRole("group", { name: "My group" })
      ).toBeInTheDocument();
    });

    it("renders all buttons with type=button", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Test"
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });

    it("applies flex-1 when fullWidth is true", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Test"
          fullWidth
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button.className).toContain("flex-1");
      });
    });

    it("renders icons when provided", () => {
      const optionsWithIcon = [
        {
          value: "x",
          label: "With Icon",
          icon: <span data-testid="icon">*</span>,
        },
        { value: "y", label: "No Icon" },
      ];

      render(
        <SegmentedControl
          options={optionsWithIcon}
          value="x"
          onChange={vi.fn()}
          ariaLabel="Test"
        />
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });
  });

  describe("grid layout", () => {
    it("renders grid with correct column class", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Grid test"
          layout="grid"
          columns={3}
        />
      );

      const group = screen.getByRole("group", { name: "Grid test" });
      expect(group.className).toContain("grid-cols-3");
    });

    it("defaults to 2 columns in grid layout", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Grid test"
          layout="grid"
        />
      );

      const group = screen.getByRole("group", { name: "Grid test" });
      expect(group.className).toContain("grid-cols-2");
    });

    it("applies border styles to grid items", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Grid test"
          layout="grid"
        />
      );

      const selectedButton = screen.getByText("Option A").closest("button");
      expect(selectedButton?.className).toContain("border-brand-600");

      const unselectedButton = screen.getByText("Option B").closest("button");
      expect(unselectedButton?.className).toContain("border-neutral-300");
    });

    it("calls onChange with selected value", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Grid test"
          layout="grid"
        />
      );

      fireEvent.click(screen.getByText("Option C"));
      expect(onChange).toHaveBeenCalledWith("c");
    });

    it("renders all buttons with type=button", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Grid test"
          layout="grid"
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });
  });

  describe("focus-visible styles", () => {
    it("includes focus-visible classes on inline buttons", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Test"
        />
      );

      const button = screen.getByText("Option A").closest("button");
      expect(button?.className).toContain("focus-visible:ring-2");
    });

    it("includes focus-visible classes on grid buttons", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="Test"
          layout="grid"
        />
      );

      const button = screen.getByText("Option A").closest("button");
      expect(button?.className).toContain("focus-visible:ring-2");
    });
  });
});
