/**
 * Unit tests for LabeledCheckbox component.
 * Verifies rendering, label association, disabled state, indeterminate
 * forwarding, and auto-generated vs. provided id behaviour.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LabeledCheckbox } from "@/components/common/LabeledCheckbox";

describe("LabeledCheckbox", () => {
  describe("rendering", () => {
    it("renders the title text", () => {
      render(<LabeledCheckbox checked={false} onChange={vi.fn()} title="Enable feature" />);
      expect(screen.getByText("Enable feature")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(
        <LabeledCheckbox
          checked={false}
          onChange={vi.fn()}
          title="Feature"
          description="This enables the feature"
        />
      );
      expect(screen.getByText("This enables the feature")).toBeInTheDocument();
    });

    it("does not render description element when omitted", () => {
      render(<LabeledCheckbox checked={false} onChange={vi.fn()} title="Feature" />);
      expect(screen.queryByText("This enables the feature")).not.toBeInTheDocument();
    });

    it("renders a checkbox input", () => {
      render(<LabeledCheckbox checked={false} onChange={vi.fn()} title="Feature" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });
  });

  describe("label association", () => {
    it("label htmlFor matches the checkbox id (auto-generated)", () => {
      const { container } = render(
        <LabeledCheckbox checked={false} onChange={vi.fn()} title="Feature" />
      );
      const label = container.querySelector("label");
      const checkbox = screen.getByRole("checkbox");
      expect(label).toHaveAttribute("for", checkbox.id);
    });

    it("uses provided id for the checkbox input", () => {
      render(
        <LabeledCheckbox
          checked={false}
          onChange={vi.fn()}
          title="Feature"
          id="my-feature"
        />
      );
      expect(screen.getByRole("checkbox")).toHaveAttribute("id", "my-feature");
    });

    it("label for attribute matches provided id", () => {
      const { container } = render(
        <LabeledCheckbox
          checked={false}
          onChange={vi.fn()}
          title="Feature"
          id="my-feature"
        />
      );
      const label = container.querySelector("label");
      expect(label).toHaveAttribute("for", "my-feature");
    });
  });

  describe("checked state", () => {
    it("reflects checked=true on the native input", () => {
      render(<LabeledCheckbox checked={true} onChange={vi.fn()} title="Feature" />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("reflects checked=false on the native input", () => {
      render(<LabeledCheckbox checked={false} onChange={vi.fn()} title="Feature" />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("disabled state", () => {
    it("disables the checkbox when disabled=true", () => {
      render(
        <LabeledCheckbox checked={false} onChange={vi.fn()} title="Feature" disabled={true} />
      );
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("does not disable the checkbox when disabled=false", () => {
      render(
        <LabeledCheckbox checked={false} onChange={vi.fn()} title="Feature" disabled={false} />
      );
      expect(screen.getByRole("checkbox")).not.toBeDisabled();
    });
  });

  describe("indeterminate state", () => {
    it("forwards indeterminate=true to the Checkbox input", () => {
      render(
        <LabeledCheckbox
          checked={false}
          onChange={vi.fn()}
          title="Feature"
          indeterminate={true}
        />
      );
      const input = screen.getByRole("checkbox") as HTMLInputElement;
      expect(input.indeterminate).toBe(true);
    });

    it("does not set indeterminate when prop is false", () => {
      render(
        <LabeledCheckbox
          checked={false}
          onChange={vi.fn()}
          title="Feature"
          indeterminate={false}
        />
      );
      const input = screen.getByRole("checkbox") as HTMLInputElement;
      expect(input.indeterminate).toBe(false);
    });
  });

  describe("onChange callback", () => {
    it("calls onChange with true when unchecked input is clicked", () => {
      const onChange = vi.fn();
      render(<LabeledCheckbox checked={false} onChange={onChange} title="Feature" />);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("calls onChange exactly once per click", () => {
      const onChange = vi.fn();
      render(<LabeledCheckbox checked={false} onChange={onChange} title="Feature" />);
      fireEvent.click(screen.getByRole("checkbox"));
      expect(onChange).toHaveBeenCalledOnce();
    });
  });
});
