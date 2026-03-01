/**
 * Unit tests for FieldLabel component.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldLabel } from "../../../../src/components/common/FieldLabel";

describe("FieldLabel", () => {
  it("renders children text", () => {
    render(<FieldLabel>My Label</FieldLabel>);
    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("renders as span when no htmlFor is provided", () => {
    render(<FieldLabel>Label Text</FieldLabel>);
    const el = screen.getByText("Label Text");
    expect(el.tagName).toBe("SPAN");
  });

  it("renders as label when htmlFor is provided", () => {
    render(<FieldLabel htmlFor="my-input">Label Text</FieldLabel>);
    const el = screen.getByText("Label Text");
    expect(el.tagName).toBe("LABEL");
    expect(el).toHaveAttribute("for", "my-input");
  });

  it("applies consistent styling classes", () => {
    render(<FieldLabel>Styled</FieldLabel>);
    const el = screen.getByText("Styled");
    expect(el.className).toContain("text-sm");
    expect(el.className).toContain("font-medium");
    expect(el.className).toContain("text-neutral-700");
    expect(el.className).toContain("mb-2");
  });

  it("associates label with input via htmlFor", () => {
    render(
      <>
        <FieldLabel htmlFor="test-input">Test</FieldLabel>
        <input id="test-input" />
      </>
    );
    expect(screen.getByLabelText("Test")).toBeInTheDocument();
  });
});
