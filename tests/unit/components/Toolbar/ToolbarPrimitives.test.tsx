/**
 * Unit tests for ToolbarPrimitives components.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import {
  ToolbarSeparator,
  ToolbarGroup,
  ToolbarButton,
  ToolbarSpacer,
} from "../../../../src/components/Toolbar/ToolbarPrimitives";
import { RibbonCollapseProvider } from "../../../../src/components/Ribbon/RibbonCollapseContext";
import type { CollapseLevel } from "../../../../src/components/Ribbon/RibbonCollapseContext";

/** Renders ui inside a RibbonCollapseProvider at the given collapse level. */
function renderWithCollapse(ui: JSX.Element, level: CollapseLevel = 0) {
  return render(
    <RibbonCollapseProvider value={level}>{ui}</RibbonCollapseProvider>
  );
}

// ============================================================================
// ToolbarSeparator
// ============================================================================

describe("ToolbarSeparator", () => {
  it("renders with role=separator", () => {
    render(<ToolbarSeparator />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("has aria-orientation=vertical", () => {
    render(<ToolbarSeparator />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical"
    );
  });

  it("forwards className prop", () => {
    render(<ToolbarSeparator className="my-class" />);
    expect(screen.getByRole("separator")).toHaveClass("my-class");
  });
});

// ============================================================================
// ToolbarGroup
// ============================================================================

describe("ToolbarGroup", () => {
  it("renders with role=group and the provided label", () => {
    render(<ToolbarGroup label="Edit">content</ToolbarGroup>);
    expect(screen.getByRole("group", { name: "Edit" })).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <ToolbarGroup label="Test">
        <span data-testid="child">child</span>
      </ToolbarGroup>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders a separator when withSeparator=true", () => {
    render(
      <ToolbarGroup label="Test" withSeparator>
        content
      </ToolbarGroup>
    );
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("does not render a separator by default", () => {
    render(<ToolbarGroup label="Test">content</ToolbarGroup>);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });
});

// ============================================================================
// ToolbarButton
// ============================================================================

describe("ToolbarButton", () => {
  it("renders type=button", () => {
    renderWithCollapse(<ToolbarButton aria-label="action" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("shows label text at collapse level 0", () => {
    renderWithCollapse(<ToolbarButton label="Save" labelPriority={1} />, 0);
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("hides label when collapse level exceeds priority", () => {
    renderWithCollapse(<ToolbarButton label="Save" labelPriority={1} />, 2);
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("promotes collapsed label to aria-label", () => {
    renderWithCollapse(<ToolbarButton label="Save" labelPriority={1} />, 2);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Save");
  });

  it("promotes collapsed label to title tooltip", () => {
    renderWithCollapse(<ToolbarButton label="Save" labelPriority={1} />, 2);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Save");
  });

  it("explicit aria-label takes precedence over promoted label", () => {
    renderWithCollapse(
      <ToolbarButton
        label="Save"
        aria-label="Save document"
        labelPriority={1}
      />,
      2
    );
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Save document"
    );
  });

  it("explicit title takes precedence over promoted title when collapsed", () => {
    renderWithCollapse(
      <ToolbarButton label="Save" labelPriority={1} title="Custom tooltip" />,
      2
    );
    expect(screen.getByRole("button")).toHaveAttribute("title", "Custom tooltip");
  });

  it("icon-only button always has its aria-label regardless of collapse level", () => {
    renderWithCollapse(<ToolbarButton aria-label="Close panel" />, 5);
    expect(
      screen.getByRole("button", { name: "Close panel" })
    ).toBeInTheDocument();
  });

  it("label never hides when labelPriority is undefined", () => {
    renderWithCollapse(<ToolbarButton label="Always visible" />, 5);
    expect(screen.getByText("Always visible")).toBeInTheDocument();
  });

  it("does not set aria-pressed for default variant", () => {
    renderWithCollapse(<ToolbarButton aria-label="action" variant="default" />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
  });

  it("sets aria-pressed=false for inactive toggle button", () => {
    renderWithCollapse(
      <ToolbarButton aria-label="toggle" variant="toggle" isActive={false} />
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("sets aria-pressed=true for active toggle button", () => {
    renderWithCollapse(
      <ToolbarButton aria-label="toggle" variant="toggle" isActive={true} />
    );
    expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
  });

  it("renders disabled", () => {
    renderWithCollapse(<ToolbarButton aria-label="action" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders children content", () => {
    renderWithCollapse(
      <ToolbarButton aria-label="action">
        <span data-testid="icon">★</span>
      </ToolbarButton>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("forwards ref to the underlying button element", () => {
    const ref = createRef<HTMLButtonElement>();
    renderWithCollapse(<ToolbarButton ref={ref} aria-label="action" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

// ============================================================================
// ToolbarSpacer
// ============================================================================

describe("ToolbarSpacer", () => {
  it("renders a flex spacer element", () => {
    const { container } = render(<ToolbarSpacer />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
