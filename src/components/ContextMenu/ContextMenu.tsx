/**
 * ContextMenu - Reusable portal-based context menu component.
 * Positioned at mouse cursor, accessible with keyboard navigation.
 * Supports single-level submenus (flyout panels) via the `children` property.
 */

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
  Fragment,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, CaretRight } from "@phosphor-icons/react";
import { CONTEXT_MENU, Z_INDEX } from "@/styles/design-tokens";

/** CSS class applied to the menu root div; exported so callers can exclude it from outside-click detection. */
export const CONTEXT_MENU_CONTAINER_CLASS = "context-menu-container";

/** Pixel gap kept between the menu edge and the viewport boundary. */
const VIEWPORT_EDGE_MARGIN_PX = 4;

/** Size of the submenu arrow indicator (CaretRight). */
const SUBMENU_ARROW_SIZE = 12;

/** Delay in ms before a submenu opens/closes on mouse hover. */
const SUBMENU_HOVER_DELAY_MS = 80;

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
  /** Submenu items — when present, this item acts as a submenu trigger (onClick is ignored). */
  children?: ContextMenuItem[];
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

// ─── Shared keyboard navigation helpers ───

/** Returns the index of the next enabled item after `from`, wrapping around.
 *  Returns `from` unchanged when all items are disabled. */
function findNextEnabledIndex(items: ContextMenuItem[], from: number): number {
  let next = from + 1;
  while (next < items.length && items[next].disabled) next++;
  if (next >= items.length) {
    next = items.findIndex((item) => !item.disabled);
    if (next < 0) return from;
  }
  return next;
}

/** Returns the index of the previous enabled item before `from`, wrapping around.
 *  Returns `from` unchanged when all items are disabled. */
function findPrevEnabledIndex(items: ContextMenuItem[], from: number): number {
  let prev = from - 1;
  while (prev >= 0 && items[prev].disabled) prev--;
  if (prev < 0) {
    prev = items.length - 1;
    while (prev >= 0 && items[prev].disabled) prev--;
    if (prev < 0) return from;
  }
  return prev;
}

// ─── Shared item rendering ───

interface MenuItemRowProps {
  item: ContextMenuItem;
  index: number;
  /** data-attribute name used for DOM queries ("data-index" or "data-subindex"). */
  dataAttr: string;
  onItemClick: (item: ContextMenuItem) => void;
  onMouseEnter?: (index: number, item: ContextMenuItem) => void;
  /** Ref callback to capture the button element (used by parent menu for submenu positioning). */
  buttonRef?: (el: HTMLElement | null) => void;
  /** Whether this item's submenu is currently open. */
  isSubmenuOpen?: boolean;
}

/** Renders a single menu item button. Shared between ContextMenu and SubmenuPanel. */
const MenuItemRow = memo(function MenuItemRow({
  item,
  index,
  dataAttr,
  onItemClick,
  onMouseEnter,
  buttonRef,
  isSubmenuOpen,
}: MenuItemRowProps): JSX.Element {
  const dataProps = { [dataAttr]: index };

  return (
    <button
      ref={buttonRef}
      {...dataProps}
      role={
        item.children
          ? "menuitem"
          : item.checked !== undefined
            ? "menuitemcheckbox"
            : "menuitem"
      }
      aria-haspopup={item.children ? "menu" : undefined}
      aria-expanded={item.children ? (isSubmenuOpen ?? false) : undefined}
      aria-checked={item.checked !== undefined ? item.checked : undefined}
      // aria-keyshortcuts surfaces the keyboard shortcut hint to screen
      // readers; the visual <span> is aria-hidden to avoid double-reading.
      aria-keyshortcuts={item.shortcut}
      tabIndex={-1}
      aria-disabled={item.disabled}
      className="context-menu-item text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      onClick={() => onItemClick(item)}
      onMouseEnter={
        onMouseEnter ? (): void => onMouseEnter(index, item) : undefined
      }
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
      {item.children ? (
        <span className="context-menu-item-arrow" aria-hidden="true">
          <CaretRight size={SUBMENU_ARROW_SIZE} weight="bold" />
        </span>
      ) : (
        item.shortcut && (
          // aria-hidden: the shortcut hint is supplementary visual info;
          // screen readers receive it via aria-keyshortcuts on the button.
          <span className="context-menu-item-shortcut" aria-hidden="true">
            {item.shortcut}
          </span>
        )
      )}
    </button>
  );
});

// ─── Submenu Panel ───

interface SubmenuPanelProps {
  items: ContextMenuItem[];
  parentItemEl: HTMLElement | null;
  onClose: () => void;
  /** Called when a leaf item is clicked — closes the entire menu tree. */
  onCloseAll: () => void;
  /** Accessible label for the submenu (read by screen readers). */
  ariaLabel: string;
}

/**
 * Renders a flyout submenu panel positioned to the right of the parent item.
 * Flips to the left if it would overflow the viewport.
 */
const SubmenuPanel = memo(function SubmenuPanel({
  items,
  parentItemEl,
  onClose,
  onCloseAll,
  ariaLabel,
}: SubmenuPanelProps): JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(0);

  const focusItem = useCallback((index: number): void => {
    const el = panelRef.current?.querySelector(
      `[data-subindex="${index}"]`
    ) as HTMLElement | null;
    el?.focus();
    focusedIndexRef.current = index;
  }, []);

  // Position the submenu relative to the parent item
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !parentItemEl) return;

    const parentRect = parentItemEl.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: right of parent, aligned to top
    let left = parentRect.right;
    let top = parentRect.top;

    // Flip left if overflowing right edge
    if (left + panelRect.width > viewportWidth - VIEWPORT_EDGE_MARGIN_PX) {
      left = parentRect.left - panelRect.width;
    }

    // Clamp vertical position
    if (top + panelRect.height > viewportHeight - VIEWPORT_EDGE_MARGIN_PX) {
      top = viewportHeight - panelRect.height - VIEWPORT_EDGE_MARGIN_PX;
    }

    panel.style.left = `${Math.max(0, left)}px`;
    panel.style.top = `${Math.max(0, top)}px`;
    panel.style.visibility = "visible";

    // Focus first enabled item
    const firstEnabled = items.findIndex((item) => !item.disabled);
    if (firstEnabled >= 0) focusItem(firstEnabled);
  }, [items, parentItemEl, focusItem]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem): void => {
      if (!item.disabled) {
        item.onClick();
        onCloseAll();
      }
    },
    [onCloseAll]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === "Escape" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusItem(findNextEnabledIndex(items, focusedIndexRef.current));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        focusItem(findPrevEnabledIndex(items, focusedIndexRef.current));
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
        e.stopPropagation();
        const item = items[focusedIndexRef.current];
        if (item && !item.disabled) {
          item.onClick();
          onCloseAll();
        }
        return;
      }

      // Prevent Tab from escaping — close the whole menu instead.
      if (e.key === "Tab") {
        e.preventDefault();
        onCloseAll();
        return;
      }
    },
    [items, focusItem, onClose, onCloseAll]
  );

  return createPortal(
    <div
      ref={panelRef}
      className={`${CONTEXT_MENU_CONTAINER_CLASS} fixed`}
      style={{
        visibility: "hidden",
        zIndex: Z_INDEX.contextMenu + 1,
        minWidth: CONTEXT_MENU.minWidth,
      }}
      role="menu"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {items.map((item, index) => (
        <Fragment key={item.id}>
          <div role="none">
            <MenuItemRow
              item={item}
              index={index}
              dataAttr="data-subindex"
              onItemClick={handleItemClick}
            />
          </div>
          {item.separator && (
            <div role="separator" className="context-menu-separator" />
          )}
        </Fragment>
      ))}
    </div>,
    document.body
  );
});

// ─── Main ContextMenu ───

export const ContextMenu = memo(function ContextMenu({
  items,
  position,
  onClose,
  ariaLabel,
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(0);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const submenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for submenu trigger elements so SubmenuPanel can position itself.
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

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
        // Also check if the click is inside a submenu portal
        const submenuPanels = document.querySelectorAll(
          `.${CONTEXT_MENU_CONTAINER_CLASS}`
        );
        for (const panel of submenuPanels) {
          if (panel.contains(e.target as Node)) return;
        }
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

  // Clean up submenu timer on unmount
  useEffect(() => {
    return () => {
      if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
    };
  }, []);

  // Unified click handler — keeps mouse and keyboard paths consistent.
  const handleItemClick = useCallback((item: ContextMenuItem): void => {
    // Items with children act as submenu triggers — don't close on click.
    if (item.children) return;
    if (!item.disabled) {
      item.onClick();
      onCloseRef.current();
    }
  }, []);

  // Submenu open/close via mouse hover with a small delay.
  const handleItemMouseEnter = useCallback(
    (index: number, item: ContextMenuItem): void => {
      if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
      if (item.children && !item.disabled) {
        submenuTimerRef.current = setTimeout(() => {
          setOpenSubmenuIndex(index);
        }, SUBMENU_HOVER_DELAY_MS);
      } else {
        // Close any open submenu when hovering a non-submenu item
        submenuTimerRef.current = setTimeout(() => {
          setOpenSubmenuIndex(null);
        }, SUBMENU_HOVER_DELAY_MS);
      }
    },
    []
  );

  // Close on Escape, handle arrow keys (WAI-ARIA menu keyboard pattern).
  // Tab closes the menu and restores focus — standard context menu behaviour.
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
        focusItem(findNextEnabledIndex(items, focusedIndexRef.current));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        focusItem(findPrevEnabledIndex(items, focusedIndexRef.current));
        return;
      }

      // ArrowRight: open submenu if current item has children
      if (e.key === "ArrowRight") {
        const item = items[focusedIndexRef.current];
        if (item?.children && !item.disabled) {
          e.preventDefault();
          setOpenSubmenuIndex(focusedIndexRef.current);
        }
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
          if (item.children) {
            setOpenSubmenuIndex(focusedIndexRef.current);
          } else {
            item.onClick();
            onCloseRef.current();
          }
        }
        return;
      }
    },
    [items, focusItem]
  );

  // Called when the submenu closes via Escape/ArrowLeft — restore focus to the parent trigger.
  const handleSubmenuClose = useCallback(() => {
    setOpenSubmenuIndex(null);
    // Restore focus to the parent trigger item
    focusItem(focusedIndexRef.current);
  }, [focusItem]);

  // Called when a submenu leaf item is clicked — close the entire menu tree.
  const handleCloseAll = useCallback(() => {
    onCloseRef.current();
  }, []);

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
            <MenuItemRow
              item={item}
              index={index}
              dataAttr="data-index"
              onItemClick={handleItemClick}
              onMouseEnter={handleItemMouseEnter}
              buttonRef={(el) => {
                if (el) itemRefs.current.set(index, el);
                else itemRefs.current.delete(index);
              }}
              isSubmenuOpen={openSubmenuIndex === index}
            />
          </div>
          {item.separator && (
            // Rendered as a Fragment sibling (not inside role="none") so it is a
            // direct child of role="menu", conforming to WAI-ARIA §6.10.
            <div role="separator" className="context-menu-separator" />
          )}
          {item.children && openSubmenuIndex === index && (
            <SubmenuPanel
              items={item.children}
              parentItemEl={itemRefs.current.get(index) ?? null}
              onClose={handleSubmenuClose}
              onCloseAll={handleCloseAll}
              ariaLabel={item.label}
            />
          )}
        </Fragment>
      ))}
    </div>,
    document.body
  );
});
