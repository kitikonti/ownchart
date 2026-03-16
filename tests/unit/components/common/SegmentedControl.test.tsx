/**
 * Unit tests for SegmentedControl component.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "@/components/common/SegmentedControl";

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
      expect(unselectedButton?.className).toContain("text-slate-700");
    });

    it("renders with role=radiogroup and aria-label", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={vi.fn()}
          ariaLabel="My group"
        />
      );

      expect(
        screen.getByRole("radiogroup", { name: "My group" })
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

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute("type", "button");
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

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio.className).toContain("flex-1");
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

      const group = screen.getByRole("radiogroup", { name: "Grid test" });
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

      const group = screen.getByRole("radiogroup", { name: "Grid test" });
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
      expect(unselectedButton?.className).toContain("border-slate-300");
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

      const radios = screen.getAllByRole("radio");
      radios.forEach((radio) => {
        expect(radio).toHaveAttribute("type", "button");
      });
    });
  });

  describe("aria-checked state", () => {
    it("sets aria-checked=true on selected option in inline layout", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="b"
          onChange={vi.fn()}
          ariaLabel="Test"
        />
      );

      const selectedButton = screen.getByText("Option B").closest("button");
      expect(selectedButton).toHaveAttribute("aria-checked", "true");
    });

    it("sets aria-checked=false on unselected options in inline layout", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="b"
          onChange={vi.fn()}
          ariaLabel="Test"
        />
      );

      const unselectedButton = screen.getByText("Option A").closest("button");
      expect(unselectedButton).toHaveAttribute("aria-checked", "false");
    });

    it("sets aria-checked=true on selected option in grid layout", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="c"
          onChange={vi.fn()}
          ariaLabel="Grid test"
          layout="grid"
        />
      );

      const selectedButton = screen.getByText("Option C").closest("button");
      expect(selectedButton).toHaveAttribute("aria-checked", "true");
    });

    it("sets aria-checked=false on unselected options in grid layout", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="c"
          onChange={vi.fn()}
          ariaLabel="Grid test"
          layout="grid"
        />
      );

      const unselectedButton = screen.getByText("Option A").closest("button");
      expect(unselectedButton).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("keyboard navigation — inline layout", () => {
    it("ArrowRight moves selection to the next option", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Test"
        />
      );
      const selected = screen.getByText("Option A").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("ArrowLeft moves selection to the previous option", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={basicOptions}
          value="b"
          onChange={onChange}
          ariaLabel="Test"
        />
      );
      const selected = screen.getByText("Option B").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith("a");
    });

    it("ArrowRight wraps from last to first option", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={basicOptions}
          value="c"
          onChange={onChange}
          ariaLabel="Test"
        />
      );
      const selected = screen.getByText("Option C").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith("a");
    });

    it("ArrowLeft wraps from first to last option", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={basicOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Test"
        />
      );
      const selected = screen.getByText("Option A").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowLeft" });
      expect(onChange).toHaveBeenCalledWith("c");
    });

    it("selected option has tabIndex=0, others have tabIndex=-1", () => {
      render(
        <SegmentedControl
          options={basicOptions}
          value="b"
          onChange={vi.fn()}
          ariaLabel="Test"
        />
      );
      const radios = screen.getAllByRole("radio");
      expect(radios[0]).toHaveAttribute("tabindex", "-1");
      expect(radios[1]).toHaveAttribute("tabindex", "0");
      expect(radios[2]).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("keyboard navigation — grid layout", () => {
    const gridOptions = [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
      { value: "c", label: "C" },
      { value: "d", label: "D" },
    ];

    it("ArrowRight moves to next option in the row", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={gridOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Grid"
          layout="grid"
          columns={2}
        />
      );
      const selected = screen.getByText("A").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowRight" });
      expect(onChange).toHaveBeenCalledWith("b");
    });

    it("ArrowDown moves to the option in the next row", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={gridOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Grid"
          layout="grid"
          columns={2}
        />
      );
      const selected = screen.getByText("A").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowDown" });
      expect(onChange).toHaveBeenCalledWith("c"); // index 0 + 2 columns = index 2
    });

    it("ArrowUp moves to the option in the previous row", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={gridOptions}
          value="c"
          onChange={onChange}
          ariaLabel="Grid"
          layout="grid"
          columns={2}
        />
      );
      const selected = screen.getByText("C").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowUp" });
      expect(onChange).toHaveBeenCalledWith("a"); // index 2 - 2 columns = index 0
    });

    it("ArrowDown wraps from last row to first row", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={gridOptions}
          value="c"
          onChange={onChange}
          ariaLabel="Grid"
          layout="grid"
          columns={2}
        />
      );
      const selected = screen.getByText("C").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowDown" });
      // index 2 + 2 = 4 % 4 = 0 → wraps to "a"
      expect(onChange).toHaveBeenCalledWith("a");
    });

    it("ArrowUp wraps from first row to last row", () => {
      const onChange = vi.fn();
      render(
        <SegmentedControl
          options={gridOptions}
          value="a"
          onChange={onChange}
          ariaLabel="Grid"
          layout="grid"
          columns={2}
        />
      );
      const selected = screen.getByText("A").closest("button")!;
      fireEvent.keyDown(selected, { key: "ArrowUp" });
      // index 0 - 2 + 4 = 2 % 4 = 2 → wraps to "c"
      expect(onChange).toHaveBeenCalledWith("c");
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
