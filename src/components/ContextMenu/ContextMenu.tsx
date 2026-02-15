/**
 * ContextMenu - Reusable portal-based context menu component.
 * Positioned at mouse cursor, accessible with keyboard navigation.
 * Future-proof: can be extended with Cut/Copy/Paste, Delete, Indent/Outdent, etc.
 */

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  /** Visual separator after this item */
  separator?: boolean;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: ContextMenuPosition;
  onClose: () => void;
}

export function ContextMenu({
  items,
  position,
  onClose,
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(0);

  // Find first non-disabled item
  const getFirstEnabledIndex = useCallback((): number => {
    return items.findIndex((item) => !item.disabled);
  }, [items]);

  // Focus management
  const focusItem = useCallback((index: number): void => {
    const el = menuRef.current?.querySelector(
      `[data-index="${index}"]`
    ) as HTMLElement | null;
    el?.focus();
    focusedIndexRef.current = index;
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
      x = viewportWidth - rect.width - 4;
    }
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 4;
    }

    el.style.left = `${Math.max(0, x)}px`;
    el.style.top = `${Math.max(0, y)}px`;
    el.style.visibility = "visible";

    // Focus first enabled item
    const firstEnabled = getFirstEnabledIndex();
    if (firstEnabled >= 0) {
      focusItem(firstEnabled);
    }
  }, [position, getFirstEnabledIndex, focusItem]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use setTimeout to avoid the same click that opened the menu closing it
    // Use capture phase so DnD libraries can't swallow the event
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick, true);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick, true);
    };
  }, [onClose]);

  // Close on Escape, handle arrow keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        let next = focusedIndexRef.current + 1;
        while (next < items.length && items[next].disabled) next++;
        if (next < items.length) focusItem(next);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        let prev = focusedIndexRef.current - 1;
        while (prev >= 0 && items[prev].disabled) prev--;
        if (prev >= 0) focusItem(prev);
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
    [items, focusItem, onClose]
  );

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu-container fixed z-[1000] min-w-[180px]"
      style={{
        left: position.x,
        top: position.y,
        visibility: "hidden",
      }}
      role="menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        <div key={item.id}>
          <button
            data-index={index}
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
            className="context-menu-item text-left outline-none"
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
          >
            {item.icon && (
              <span className="context-menu-item-icon">{item.icon}</span>
            )}
            <span className="context-menu-item-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-item-shortcut">
                {item.shortcut}
              </span>
            )}
          </button>
          {item.separator && <div className="context-menu-separator" />}
        </div>
      ))}
    </div>,
    document.body
  );
}
