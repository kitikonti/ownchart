/**
 * Unit tests for ToolbarDropdown — covers option rendering, selection,
 * keyboard navigation (ArrowDown/Up/Enter/Space), and ARIA wiring.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RibbonCollapseProvider } from "../../../../src/components/Ribbon/RibbonCollapseContext";
import { ToolbarDropdown } from "../../../../src/components/Toolbar/ToolbarDropdown";
import type { DropdownOption } from "../../../../src/types/ui.types";

const OPTIONS: DropdownOption[] = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];

function renderDropdown(
  value: string = "a",
  onChange: (v: string) => void = vi.fn()
) {
  return render(
    <RibbonCollapseProvider value={0}>
      <ToolbarDropdown
        value={value}
        options={OPTIONS}
        onChange={onChange}
        aria-label="Test Dropdown"
      />
    </RibbonCollapseProvider>
  );
}

// ============================================================================
// Rendering
// ============================================================================

describe("ToolbarDropdown — rendering", () => {
  it("renders the trigger button with aria-label", () => {
    renderDropdown();
    expect(screen.getByRole("button", { name: "Test Dropdown" })).toBeInTheDocument();
  });

  it("does not show options before the dropdown is opened", () => {
    renderDropdown();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows all options after trigger click", () => {
    renderDropdown();
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: /Option A/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Option B/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Option C/ })).toBeInTheDocument();
  });

  it("marks the currently selected option with aria-selected=true", () => {
    renderDropdown("b");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const optionB = screen.getByRole("option", { name: /Option B/ });
    expect(optionB).toHaveAttribute("aria-selected", "true");
  });

  it("trigger has aria-haspopup=listbox and aria-expanded=false when closed", () => {
    renderDropdown();
    const trigger = screen.getByRole("button", { name: "Test Dropdown" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("trigger has aria-expanded=true when open", () => {
    renderDropdown();
    const trigger = screen.getByRole("button", { name: "Test Dropdown" });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

// ============================================================================
// Selection
// ============================================================================

describe("ToolbarDropdown — selection", () => {
  it("calls onChange with the clicked option value", () => {
    const onChange = vi.fn();
    renderDropdown("a", onChange);
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    fireEvent.click(screen.getByRole("option", { name: /Option B/ }));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("closes the dropdown after selection", () => {
    const onChange = vi.fn();
    renderDropdown("a", onChange);
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    fireEvent.click(screen.getByRole("option", { name: /Option C/ }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

// ============================================================================
// Keyboard navigation
// ============================================================================

describe("ToolbarDropdown — keyboard navigation", () => {
  it("ArrowDown moves focus to the next option", () => {
    renderDropdown("a");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const container = screen.getByRole("listbox").parentElement!;
    fireEvent.keyDown(container, { key: "ArrowDown" });
    // After one ArrowDown from index 0 (selected "a"), focused index becomes 1.
    // The listbox aria-activedescendant should point to option b.
    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toContain("option-b");
  });

  it("ArrowUp moves focus to the previous option", () => {
    renderDropdown("c");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const container = screen.getByRole("listbox").parentElement!;
    // Initially focused at index 2 (c). One ArrowUp → index 1 (b).
    fireEvent.keyDown(container, { key: "ArrowUp" });
    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toContain("option-b");
  });

  it("ArrowDown does not go past the last option", () => {
    renderDropdown("c");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const container = screen.getByRole("listbox").parentElement!;
    // Already at last option; ArrowDown should clamp.
    fireEvent.keyDown(container, { key: "ArrowDown" });
    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toContain("option-c");
  });

  it("ArrowUp does not go before the first option", () => {
    renderDropdown("a");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const container = screen.getByRole("listbox").parentElement!;
    // Already at first option; ArrowUp should clamp.
    fireEvent.keyDown(container, { key: "ArrowUp" });
    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toContain("option-a");
  });

  it("Enter confirms the keyboard-focused option", () => {
    const onChange = vi.fn();
    renderDropdown("a", onChange);
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const container = screen.getByRole("listbox").parentElement!;
    // Move focus to option B, then confirm.
    fireEvent.keyDown(container, { key: "ArrowDown" });
    fireEvent.keyDown(container, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Space confirms the keyboard-focused option", () => {
    const onChange = vi.fn();
    renderDropdown("a", onChange);
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const container = screen.getByRole("listbox").parentElement!;
    fireEvent.keyDown(container, { key: "ArrowDown" });
    fireEvent.keyDown(container, { key: " " });
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("keyboard events are ignored when dropdown is closed", () => {
    const onChange = vi.fn();
    renderDropdown("a", onChange);
    // Dropdown not open — fire key on wrapper div (no listbox rendered)
    const wrapper = screen
      .getByRole("button", { name: "Test Dropdown" })
      .closest("div")!;
    fireEvent.keyDown(wrapper, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ============================================================================
// ARIA — aria-activedescendant
// ============================================================================

describe("ToolbarDropdown — ARIA", () => {
  it("listbox has aria-activedescendant pointing to selected option when first opened", () => {
    renderDropdown("b");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("aria-activedescendant")).toContain("option-b");
  });

  it("aria-activedescendant is absent when dropdown is closed", () => {
    renderDropdown("a");
    // Trigger not clicked — listbox not mounted.
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    // Trigger itself does not have aria-activedescendant.
    const trigger = screen.getByRole("button", { name: "Test Dropdown" });
    expect(trigger.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("listbox has aria-label matching the dropdown's aria-label", () => {
    renderDropdown("a");
    fireEvent.click(screen.getByRole("button", { name: "Test Dropdown" }));
    expect(screen.getByRole("listbox", { name: "Test Dropdown" })).toBeInTheDocument();
  });
});
