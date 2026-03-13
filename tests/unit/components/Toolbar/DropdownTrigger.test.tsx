/**
 * Unit tests for DropdownTrigger — covers rendering, ARIA attributes,
 * label collapse behaviour, active border state, and triggerRef forwarding.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { RibbonCollapseProvider } from "@/components/Ribbon/RibbonCollapseContext";
import { DropdownTrigger } from "@/components/Toolbar/DropdownTrigger";
import type { CollapseLevel } from "@/components/Ribbon/RibbonCollapseContext";

function renderTrigger(
  props: Partial<React.ComponentProps<typeof DropdownTrigger>> & {
    label?: string;
    isOpen?: boolean;
    onClick?: () => void;
  } = {},
  collapseLevel: CollapseLevel = 0
): RenderResult {
  const {
    label = "Options",
    isOpen = false,
    onClick = vi.fn(),
    ...rest
  } = props;
  return render(
    <RibbonCollapseProvider value={collapseLevel}>
      <DropdownTrigger
        label={label}
        isOpen={isOpen}
        onClick={onClick}
        {...rest}
      />
    </RibbonCollapseProvider>
  );
}

// ============================================================================
// Rendering
// ============================================================================

describe("DropdownTrigger — rendering", () => {
  it("renders a button with type=button", () => {
    renderTrigger();
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("shows the label text at collapse level 0", () => {
    renderTrigger({ label: "Zoom" });
    expect(screen.getByText("Zoom")).toBeInTheDocument();
  });

  it("hides the label span when collapse level exceeds labelPriority", () => {
    renderTrigger({ label: "Zoom", labelPriority: 1 }, 2);
    expect(screen.queryByText("Zoom")).not.toBeInTheDocument();
  });

  it("always shows the label when labelPriority is undefined", () => {
    renderTrigger({ label: "Zoom" }, 5);
    expect(screen.getByText("Zoom")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderTrigger({ onClick });
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

// ============================================================================
// ARIA attributes
// ============================================================================

describe("DropdownTrigger — ARIA", () => {
  it("uses label as aria-label when no aria-label prop is provided", () => {
    renderTrigger({ label: "Labels" });
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Labels");
  });

  it("uses explicit aria-label over label when provided", () => {
    renderTrigger({ label: "Labels", "aria-label": "Task Labels" });
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Task Labels"
    );
  });

  it("sets aria-expanded=false when closed", () => {
    renderTrigger({ isOpen: false });
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("sets aria-expanded=true when open", () => {
    renderTrigger({ isOpen: true });
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("defaults aria-haspopup to 'true'", () => {
    renderTrigger();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-haspopup",
      "true"
    );
  });

  it("accepts custom aria-haspopup value", () => {
    renderTrigger({ "aria-haspopup": "listbox" });
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-haspopup",
      "listbox"
    );
  });
});

// ============================================================================
// Tooltip (title) behaviour
// ============================================================================

describe("DropdownTrigger — title/tooltip", () => {
  it("does not set title when label is visible and no title prop given", () => {
    renderTrigger({ label: "Zoom", labelPriority: 1 }, 0);
    // Label is visible — no tooltip fallback
    expect(screen.getByRole("button")).not.toHaveAttribute("title");
  });

  it("falls back to label as title when label is hidden and no title prop given", () => {
    renderTrigger({ label: "Zoom", labelPriority: 1 }, 2);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Zoom");
  });

  it("uses explicit title prop even when label is visible", () => {
    renderTrigger({ label: "Zoom", title: "Set zoom level" });
    expect(screen.getByRole("button")).toHaveAttribute(
      "title",
      "Set zoom level"
    );
  });

  it("uses explicit title prop when label is hidden (not overridden by fallback)", () => {
    renderTrigger({ label: "Zoom", labelPriority: 1, title: "Set zoom level" }, 2);
    expect(screen.getByRole("button")).toHaveAttribute(
      "title",
      "Set zoom level"
    );
  });
});

// ============================================================================
// Active state
// ============================================================================

describe("DropdownTrigger — active state", () => {
  it("does not apply active class when isActive=false", () => {
    renderTrigger({ isActive: false });
    expect(screen.getByRole("button")).not.toHaveClass(
      "dropdown-trigger-active"
    );
  });

  it("applies active class when isActive=true and dropdown is closed", () => {
    renderTrigger({ isActive: true, isOpen: false });
    expect(screen.getByRole("button")).toHaveClass("dropdown-trigger-active");
  });

  it("does not apply active class when isActive=true but dropdown is open", () => {
    renderTrigger({ isActive: true, isOpen: true });
    expect(screen.getByRole("button")).not.toHaveClass(
      "dropdown-trigger-active"
    );
  });
});

// ============================================================================
// triggerRef forwarding
// ============================================================================

describe("DropdownTrigger — triggerRef", () => {
  it("calls triggerRef with the button element when provided", () => {
    const triggerRef = vi.fn();
    renderTrigger({ triggerRef });
    expect(triggerRef).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement)
    );
  });
});
