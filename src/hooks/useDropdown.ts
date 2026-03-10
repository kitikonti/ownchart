/**
 * useDropdown - Shared open/close logic for toolbar dropdown menus.
 *
 * Handles:
 * - Open/close toggle state
 * - Outside-click detection (mousedown)
 * - Escape key to close (returns focus to trigger)
 * - Tab key / focusout detection (closes when focus leaves container)
 * - Optional onClose callback (e.g. to clear search state)
 */

import { useState, useRef, useEffect, useCallback } from "react";

interface UseDropdownOptions {
  /** Called after the dropdown closes (useful for clearing search fields) */
  onClose?: () => void;
}

interface UseDropdownReturn<T extends HTMLElement = HTMLDivElement> {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  /** Close the dropdown. Pass `true` to return focus to the trigger element. */
  close: (returnFocus?: boolean) => void;
  containerRef: React.RefObject<T>;
  /** Callback ref — attach to the trigger element for focus return on close. */
  triggerRef: (el: HTMLElement | null) => void;
  /**
   * Spread onto the trigger element to wire up open/close toggle and ARIA
   * state. Use `aria-haspopup` prop on `DropdownTrigger` to override the
   * value (e.g. "listbox", "menu", "dialog") when appropriate.
   * Valid WAI-ARIA 1.2 values: "menu" | "listbox" | "tree" | "grid" | "dialog"
   */
  triggerProps: {
    onClick: () => void;
    "aria-haspopup": "menu" | "listbox" | "tree" | "grid" | "dialog";
    "aria-expanded": boolean;
  };
}

export function useDropdown<T extends HTMLElement = HTMLDivElement>(
  options?: UseDropdownOptions
): UseDropdownReturn<T> {
  const [isOpen, setIsOpenState] = useState(false);
  const containerRef = useRef<T>(null) as React.RefObject<T>;
  const triggerElRef = useRef<HTMLElement | null>(null);

  // Store onClose in a ref so `close` remains stable even when the caller
  // passes an inline options object that changes identity on every render.
  const onCloseRef = useRef(options?.onClose);
  onCloseRef.current = options?.onClose;

  // Callback ref for the trigger element — compatible with any HTML element type
  const triggerRef = useCallback((el: HTMLElement | null) => {
    triggerElRef.current = el;
  }, []);

  const close = useCallback((returnFocus?: boolean) => {
    setIsOpenState(false);
    onCloseRef.current?.();
    if (returnFocus && triggerElRef.current) {
      requestAnimationFrame(() => triggerElRef.current?.focus());
    }
  }, []);

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (!open && isOpen) {
        close();
      } else {
        setIsOpenState(open);
      }
    },
    [isOpen, close]
  );

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      setIsOpenState(true);
    }
  }, [isOpen, close]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        close(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  // Close when focus leaves the container (e.g. Tab key)
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const handleFocusOut = (e: FocusEvent): void => {
      const newTarget = e.relatedTarget as Node | null;
      // Only close when focus moves to a known element outside the container.
      // When relatedTarget is null (click on non-focusable content inside the
      // panel, or focus leaving the page), skip — the outside-click handler
      // covers the former case; the latter is harmless.
      if (newTarget && !container.contains(newTarget)) {
        close();
      }
    };

    container.addEventListener("focusout", handleFocusOut);
    return (): void => {
      container.removeEventListener("focusout", handleFocusOut);
    };
  }, [isOpen, close]);

  const triggerProps = {
    onClick: toggle,
    // Default to "menu" — the most common dropdown type.
    // WAI-ARIA 1.2: valid values are "menu" | "listbox" | "tree" | "grid" | "dialog".
    "aria-haspopup": "menu" as const,
    "aria-expanded": isOpen,
  };

  return {
    isOpen,
    setIsOpen,
    toggle,
    close,
    containerRef,
    triggerRef,
    triggerProps,
  };
}
