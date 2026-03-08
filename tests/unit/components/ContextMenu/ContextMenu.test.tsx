/**
 * Unit tests for ContextMenu component.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContextMenu } from "../../../../src/components/ContextMenu/ContextMenu";
import type { ContextMenuItem } from "../../../../src/components/ContextMenu/ContextMenu";

const defaultPosition = { x: 100, y: 100 };
const defaultAriaLabel = "Test context menu";

function makeItems(overrides: Partial<ContextMenuItem>[] = []): ContextMenuItem[] {
  return [
    { id: "cut", label: "Cut", onClick: vi.fn(), shortcut: "Ctrl+X" },
    { id: "copy", label: "Copy", onClick: vi.fn() },
    { id: "paste", label: "Paste", onClick: vi.fn(), disabled: true },
    { id: "delete", label: "Delete", onClick: vi.fn(), separator: true },
    ...overrides.map((o, i) => ({
      id: `extra-${i}`,
      label: `Extra ${i}`,
      onClick: vi.fn(),
      ...o,
    })),
  ];
}

describe("ContextMenu", () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
  });

  describe("rendering", () => {
    it("renders all items", () => {
      render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      expect(screen.getByText("Cut")).toBeInTheDocument();
      expect(screen.getByText("Copy")).toBeInTheDocument();
      expect(screen.getByText("Paste")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("renders with role=menu", () => {
      render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("renders items with role=menuitem by default", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Action A", onClick: vi.fn() },
        { id: "b", label: "Action B", onClick: vi.fn() },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    });

    it("renders checkable items with role=menuitemcheckbox and aria-checked", () => {
      const items: ContextMenuItem[] = [
        { id: "show-grid", label: "Show Grid", onClick: vi.fn(), checked: true },
        { id: "show-rulers", label: "Show Rulers", onClick: vi.fn(), checked: false },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      const checkboxItems = screen.getAllByRole("menuitemcheckbox");
      expect(checkboxItems).toHaveLength(2);
      expect(checkboxItems[0]).toHaveAttribute("aria-checked", "true");
      expect(checkboxItems[1]).toHaveAttribute("aria-checked", "false");
    });

    it("renders separator with role=separator", () => {
      render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // The "Delete" item has separator=true
      expect(screen.getByRole("separator")).toBeInTheDocument();
    });

    it("renders shortcut text", () => {
      render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      expect(screen.getByText("Ctrl+X")).toBeInTheDocument();
    });

    it("marks disabled items as disabled", () => {
      render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      const pasteButton = screen.getByText("Paste").closest("button");
      expect(pasteButton).toBeDisabled();
    });
  });

  describe("item interactions", () => {
    it("calls item.onClick and onClose when an item is clicked", () => {
      const onClick = vi.fn();
      const items: ContextMenuItem[] = [
        { id: "action", label: "Action", onClick },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      fireEvent.click(screen.getByText("Action"));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when a disabled item button is clicked (browser prevents it)", () => {
      const onClick = vi.fn();
      const items: ContextMenuItem[] = [
        { id: "disabled", label: "Disabled Action", onClick, disabled: true },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // Disabled buttons do not fire click events
      const button = screen.getByText("Disabled Action").closest("button")!;
      expect(button).toBeDisabled();
    });
  });

  describe("keyboard navigation", () => {
    it("calls onClose when Escape is pressed", () => {
      render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("activates the focused item with Enter", () => {
      const onClick = vi.fn();
      const items: ContextMenuItem[] = [
        { id: "action", label: "Action", onClick },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Enter" });
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("activates the focused item with Space", () => {
      const onClick = vi.fn();
      const items: ContextMenuItem[] = [
        { id: "action", label: "Action", onClick },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      fireEvent.keyDown(screen.getByRole("menu"), { key: " " });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("ArrowDown skips disabled items", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn() },
        { id: "b", label: "Item B", onClick: vi.fn(), disabled: true },
        { id: "c", label: "Item C", onClick: vi.fn() },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // After mount, focusedIndex = 0 (Item A). ArrowDown should skip B and land on C.
      fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
      const itemCButton = screen.getByText("Item C").closest("button");
      expect(document.activeElement).toBe(itemCButton);
    });

    it("ArrowDown wraps around to the first enabled item when at end of list", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn() },
        { id: "b", label: "Item B", onClick: vi.fn() },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // WAI-ARIA menu pattern: ArrowDown wraps around at the end of the list.
      const menu = screen.getByRole("menu");
      fireEvent.keyDown(menu, { key: "ArrowDown" }); // → Item B
      fireEvent.keyDown(menu, { key: "ArrowDown" }); // → wraps back to Item A
      const itemAButton = screen.getByText("Item A").closest("button");
      expect(document.activeElement).toBe(itemAButton);
    });

    it("Home moves to first enabled item", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn(), disabled: true },
        { id: "b", label: "Item B", onClick: vi.fn() },
        { id: "c", label: "Item C", onClick: vi.fn() },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // Move to last item first
      fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
      // Home should jump back to first enabled (B, skipping disabled A)
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Home" });
      expect(document.activeElement).toBe(
        screen.getByText("Item B").closest("button")
      );
    });

    it("End moves to last enabled item", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn() },
        { id: "b", label: "Item B", onClick: vi.fn() },
        { id: "c", label: "Item C", onClick: vi.fn(), disabled: true },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // End should jump to last enabled item (B, skipping disabled C)
      fireEvent.keyDown(screen.getByRole("menu"), { key: "End" });
      expect(document.activeElement).toBe(
        screen.getByText("Item B").closest("button")
      );
    });

    it("ArrowUp skips disabled items", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn() },
        { id: "b", label: "Item B", onClick: vi.fn(), disabled: true },
        { id: "c", label: "Item C", onClick: vi.fn() },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // Move to Item C first
      fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
      // Now ArrowUp: should skip B and land on A
      fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowUp" });
      const itemAButton = screen.getByText("Item A").closest("button");
      expect(document.activeElement).toBe(itemAButton);
    });

    it("ArrowUp wraps around to the last enabled item when at start of list", () => {
      const items: ContextMenuItem[] = [
        { id: "a", label: "Item A", onClick: vi.fn() },
        { id: "b", label: "Item B", onClick: vi.fn() },
      ];
      render(
        <ContextMenu
          items={items}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );
      // WAI-ARIA menu pattern: ArrowUp wraps around at the start of the list.
      // After mount, focus is at Item A (first enabled). ArrowUp should wrap to Item B.
      const menu = screen.getByRole("menu");
      fireEvent.keyDown(menu, { key: "ArrowUp" }); // → wraps to Item B (last)
      const itemBButton = screen.getByText("Item B").closest("button");
      expect(document.activeElement).toBe(itemBButton);
    });
  });

  describe("focus management", () => {
    it("restores focus to the previously focused element when unmounted", () => {
      const trigger = document.createElement("button");
      trigger.textContent = "Open Menu";
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const { unmount } = render(
        <ContextMenu
          items={makeItems()}
          position={defaultPosition}
          onClose={onClose}
          ariaLabel={defaultAriaLabel}
        />
      );

      unmount();

      expect(document.activeElement).toBe(trigger);
      document.body.removeChild(trigger);
    });
  });
});
