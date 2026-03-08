/**
 * ContextMenu - Reusable portal-based context menu component.
 * Positioned at mouse cursor, accessible with keyboard navigation.
 * Future-proof: can be extended with Cut/Copy/Paste, Delete, Indent/Outdent, etc.
 */

import {
  useEffect,
  useRef,
  useCallback,
  memo,
  Fragment,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check } from "@phosphor-icons/react";
import { CONTEXT_MENU, Z_INDEX } from "../../styles/design-tokens";

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
    // `items` is in the dependency array so focus is re-evaluated whenever the
    // item list changes (e.g. async-loaded items or toggled disabled states).
    //
    // NOTE for callers: memoize the `items` array to avoid spurious focus
    // resets on every parent render (this effect re-runs whenever `items` changes).
    const firstEnabled = items.findIndex((item) => !item.disabled);
    if (firstEnabled >= 0) {
      focusItem(firstEnabled);
      // Safety-net: if the button wasn't in the DOM yet (e.g. portal not flushed),
      // fall back to focusing the menu container so keyboard events still land.
      if (
        document.activeElement !== el &&
        !el.contains(document.activeElement)
      ) {
        el.focus();
      }
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
  // Uses onCloseRef to avoid re-creating the callback when the parent
  // re-renders with a new onClose identity (same pattern as outside-click handler).
  const handleItemClick = useCallback((item: ContextMenuItem): void => {
    if (!item.disabled) {
      item.onClick();
      onCloseRef.current();
    }
  }, []);

  /** Returns the index of the next enabled item after `from`, wrapping around.
   *  Returns `from` unchanged when all items are disabled (nothing to navigate to). */
  const findNextEnabled = useCallback(
    (from: number): number => {
      let next = from + 1;
      while (next < items.length && items[next].disabled) next++;
      if (next >= items.length) {
        // Wrap around: find first enabled item from the beginning
        next = items.findIndex((item) => !item.disabled);
        // All items are disabled — stay put.
        if (next < 0) return from;
      }
      return next;
    },
    [items]
  );

  /** Returns the index of the previous enabled item before `from`, wrapping around.
   *  Returns `from` unchanged when all items are disabled (nothing to navigate to). */
  const findPrevEnabled = useCallback(
    (from: number): number => {
      let prev = from - 1;
      while (prev >= 0 && items[prev].disabled) prev--;
      if (prev < 0) {
        // Wrap around: find last enabled item from the end
        prev = items.length - 1;
        while (prev >= 0 && items[prev].disabled) prev--;
        // All items are disabled — stay put.
        if (prev < 0) return from;
      }
      return prev;
    },
    [items]
  );

  // Close on Escape, handle arrow keys (WAI-ARIA menu keyboard pattern).
  // Tab closes the menu and restores focus — standard context menu behaviour.
  // Uses onCloseRef throughout (same pattern as handleItemClick and outside-click
  // handler) so the callback is never recreated when the parent re-renders with
  // a new onClose identity.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      // WAI-ARIA: Both Tab and Shift+Tab close the menu and return focus to
      // the trigger element — there is nothing to tab to inside a context menu.
      if (e.key === "Tab") {
        e.preventDefault();
        onCloseRef.current();
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
          onCloseRef.current();
        }
        return;
      }
    },
    [items, focusItem, findNextEnabled, findPrevEnabled]
  );

  return createPortal(
    <div
      ref={menuRef}
      className={`${CONTEXT_MENU_CONTAINER_CLASS} fixed`}
      // left/top are set imperatively in the positioning useEffect after
      // viewport-clamping; visibility:hidden keeps the menu invisible until
      // the effect runs so there is no flash at an unclamped position.
      // zIndex uses the Z_INDEX token so the stacking order relative to Modal
      // (Z_INDEX.modal = 1100) is explicit and maintained centrally.
      // minWidth uses the CONTEXT_MENU design token rather than an inline magic number.
      style={{
        visibility: "hidden",
        zIndex: Z_INDEX.contextMenu,
        minWidth: CONTEXT_MENU.minWidth,
      }}
      role="menu"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        // WAI-ARIA 1.1 §3.15: role="menu" directly owns menuitem/menuitemcheckbox
        // and separator elements. role="none" on the wrapper suppresses the
        // implicit div role so the owned-element relationship is preserved.
        // Separator is rendered as a sibling (not nested inside role="none") to
        // satisfy the WAI-ARIA requirement that separator be a direct child of
        // role="menu" or role="menubar".
        <Fragment key={item.id}>
          <div role="none">
            <button
              data-index={index}
              role={
                item.checked !== undefined ? "menuitemcheckbox" : "menuitem"
              }
              aria-checked={
                item.checked !== undefined ? item.checked : undefined
              }
              // aria-keyshortcuts surfaces the keyboard shortcut hint to screen
              // readers; the visual <span> is aria-hidden to avoid double-reading.
              aria-keyshortcuts={item.shortcut}
              tabIndex={-1}
              aria-disabled={item.disabled}
              className="context-menu-item text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
              onClick={() => handleItemClick(item)}
            >
              {item.checked !== undefined ? (
                <span className="context-menu-item-check" aria-hidden="true">
                  {item.checked && (
                    <Check
                      size={CONTEXT_MENU.iconSize}
                      weight={CONTEXT_MENU.iconWeight}
                    />
                  )}
                </span>
              ) : (
                item.icon && (
                  <span className="context-menu-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )
              )}
              <span className="context-menu-item-label">{item.label}</span>
              {item.shortcut && (
                // aria-hidden: the shortcut hint is supplementary visual info;
                // screen readers receive it via aria-keyshortcuts on the button.
                <span className="context-menu-item-shortcut" aria-hidden="true">
                  {item.shortcut}
                </span>
              )}
            </button>
          </div>
          {item.separator && (
            // Rendered as a Fragment sibling (not inside role="none") so it is a
            // direct child of role="menu", conforming to WAI-ARIA §6.10.
            <div role="separator" className="context-menu-separator" />
          )}
        </Fragment>
      ))}
    </div>,
    document.body
  );
});
