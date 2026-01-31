/**
 * useDropdown - Shared open/close logic for toolbar dropdown menus.
 *
 * Handles:
 * - Open/close toggle state
 * - Outside-click detection (mousedown)
 * - Escape key to close
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
  close: () => void;
  containerRef: React.RefObject<T>;
  triggerProps: {
    onClick: () => void;
    "aria-haspopup": "true" | "listbox";
    "aria-expanded": boolean;
  };
}

export function useDropdown<T extends HTMLElement = HTMLDivElement>(
  options?: UseDropdownOptions
): UseDropdownReturn<T> {
  const [isOpen, setIsOpenState] = useState(false);
  const containerRef = useRef<T>(null) as React.RefObject<T>;

  const close = useCallback(() => {
    setIsOpenState(false);
    options?.onClose?.();
  }, [options]);

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
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  const triggerProps = {
    onClick: toggle,
    "aria-haspopup": "true" as const,
    "aria-expanded": isOpen,
  };

  return {
    isOpen,
    setIsOpen,
    toggle,
    close,
    containerRef,
    triggerProps,
  };
}
