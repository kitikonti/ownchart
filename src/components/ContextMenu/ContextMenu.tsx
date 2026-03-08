/**
 * ContextMenu - Reusable portal-based context menu component.
 * Positioned at mouse cursor, accessible with keyboard navigation.
 * Future-proof: can be extended with Cut/Copy/Paste, Delete, Indent/Outdent, etc.
 */

import { useEffect, useRef, useCallback, memo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "@phosphor-icons/react";
import { CONTEXT_MENU } from "../../styles/design-tokens";

/** CSS class applied to the menu root div; exported so callers can exclude it from outside-click detection. */
export const CONTEXT_MENU_CONTAINER_CLASS = "context-menu-container";

/** Pixel gap kept between the menu edge and the viewport boundary. */
const VIEWPORT_EDGE_MARGIN_PX = 4;

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Visual separator after this item */
  separator?: boolean;
  /** When defined, renders a checkmark area instead of icon. true = Check icon, false = empty spacer */
  checked?: boolean;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: ContextMenuPosition;
  onClose: () => void;
  /** Accessible label describing the purpose of this menu (read by screen readers). */
  ariaLabel: string;
}

export const ContextMenu = memo(function ContextMenu({
  items,
  position,
  onClose,
  ariaLabel,
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(0);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Keep a ref to onClose so the outside-click handler never captures a stale closure.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus management
  const focusItem = useCallback((index: number): void => {
    const el = menuRef.current?.querySelector(
      `[data-index="${index}"]`
    ) as HTMLElement | null;
    el?.focus();
    focusedIndexRef.current = index;
  }, []);

  // Save the element focused before the menu opened and restore it on unmount.
  // This keeps keyboard users oriented after closing the menu (same pattern as Modal).
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  // Position the menu within viewport bounds
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - VIEWPORT_EDGE_MARGIN_PX;
    }
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - VIEWPORT_EDGE_MARGIN_PX;
    }

    el.style.left = `${Math.max(0, x)}px`;
    el.style.top = `${Math.max(0, y)}px`;
    el.style.visibility = "visible";

    // Focus first enabled item for keyboard navigation.
    // No visible focus ring — CSS uses :focus-visible (keyboard only).
    const firstEnabled = items.findIndex((item) => !item.disabled);
    if (firstEnabled >= 0) {
      focusItem(firstEnabled);
    } else {
      el.focus();
    }
  }, [position, items, focusItem]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseRef.current();
      }
    };
    // Use setTimeout to avoid the same click that opened the menu closing it.
    // Use capture phase so DnD libraries can't swallow the event.
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick, true);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick, true);
    };
  }, []);

  // Unified click handler — keeps mouse and keyboard paths consistent.
  const handleItemClick = useCallback(
    (item: ContextMenuItem): void => {
      if (!item.disabled) {
        item.onClick();
        onClose();
      }
    },
    [onClose]
  );

  /** Returns the index of the next enabled item after `from`, wrapping around. */
  const findNextEnabled = useCallback(
    (from: number): number => {
      let next = from + 1;
      while (next < items.length && items[next].disabled) next++;
      if (next >= items.length) {
        // Wrap around: find first enabled item from the beginning
        next = items.findIndex((item) => !item.disabled);
      }
      return next;
    },
    [items]
  );

  /** Returns the index of the previous enabled item before `from`, wrapping around. */
  const findPrevEnabled = useCallback(
    (from: number): number => {
      let prev = from - 1;
      while (prev >= 0 && items[prev].disabled) prev--;
      if (prev < 0) {
        // Wrap around: find last enabled item from the end
        prev = items.length - 1;
        while (prev >= 0 && items[prev].disabled) prev--;
      }
      return prev;
    },
    [items]
  );

  // Close on Escape, handle arrow keys (WAI-ARIA menu keyboard pattern).
  // Tab closes the menu and restores focus — standard context menu behaviour.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // WAI-ARIA: Tab closes the menu and returns focus to the trigger element.
      if (e.key === "Tab") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = findNextEnabled(focusedIndexRef.current);
        if (next >= 0) focusItem(next);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = findPrevEnabled(focusedIndexRef.current);
        if (prev >= 0) focusItem(prev);
        return;
      }

      if (e.key === "Home") {
        e.preventDefault();
        const first = items.findIndex((item) => !item.disabled);
        if (first >= 0) focusItem(first);
        return;
      }

      if (e.key === "End") {
        e.preventDefault();
        let last = items.length - 1;
        while (last >= 0 && items[last].disabled) last--;
        if (last >= 0) focusItem(last);
        return;
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const item = items[focusedIndexRef.current];
        if (item && !item.disabled) {
          item.onClick();
          onClose();
        }
        return;
      }
    },
    [items, focusItem, findNextEnabled, findPrevEnabled, onClose]
  );

  return createPortal(
    <div
      ref={menuRef}
      className={`${CONTEXT_MENU_CONTAINER_CLASS} fixed z-[1000] min-w-[180px]`}
      style={{
        left: position.x,
        top: position.y,
        visibility: "hidden",
      }}
      role="menu"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        <div key={item.id} role="none">
          <button
            data-index={index}
            role={item.checked !== undefined ? "menuitemcheckbox" : "menuitem"}
            aria-checked={item.checked !== undefined ? item.checked : undefined}
            tabIndex={-1}
            disabled={item.disabled}
            className="context-menu-item text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
            onClick={() => handleItemClick(item)}
          >
            {item.checked !== undefined ? (
              <span className="context-menu-item-check">
                {item.checked && (
                  <Check
                    size={CONTEXT_MENU.iconSize}
                    weight={CONTEXT_MENU.iconWeight}
                  />
                )}
              </span>
            ) : (
              item.icon && (
                <span className="context-menu-item-icon">{item.icon}</span>
              )
            )}
            <span className="context-menu-item-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-item-shortcut">
                {item.shortcut}
              </span>
            )}
          </button>
          {item.separator && (
            <div role="separator" className="context-menu-separator" />
          )}
        </div>
      ))}
    </div>,
    document.body
  );
});
