/**
 * ToolbarDropdown - MS Word style dropdown for toolbar
 *
 * Features:
 * - Icon + text trigger button
 * - Hover state with light gray background
 * - Dropdown menu with checkmark for selected item
 * - Keyboard navigation support
 */

import { useMemo, useState, useEffect, memo } from "react";
import type { ReactNode, ReactElement, KeyboardEvent } from "react";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "./DropdownTrigger";
import { DropdownPanel } from "./DropdownPanel";
import { DropdownItem } from "./DropdownItem";
import type { DropdownOption } from "../../types/ui.types";

// Re-exported so existing imports from this file continue to work.
export type { DropdownOption } from "../../types/ui.types";

const DEFAULT_DROPDOWN_LABEL = "Select";

interface ToolbarDropdownProps<T extends string = string> {
  /** Currently selected value */
  value: T;
  /** Available options */
  options: DropdownOption<T>[];
  /** Called when selection changes */
  onChange: (value: T) => void;
  /** Optional icon to show before the label */
  icon?: ReactNode;
  /** Optional prefix for the displayed label (e.g., "Labels: ") */
  labelPrefix?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** Tooltip */
  title?: string;
  /** Collapse priority: lower numbers hide first. Omit to never collapse. */
  labelPriority?: number;
}

function ToolbarDropdownInner<T extends string = string>({
  value,
  options,
  onChange,
  icon,
  labelPrefix = "",
  "aria-label": ariaLabel,
  title,
  labelPriority,
}: ToolbarDropdownProps<T>): ReactElement {
  const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown();

  // Tracks which option has keyboard focus (separate from selected value).
  // Initialized to the index of the currently selected option when the dropdown opens.
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [focusedIndex, setFocusedIndex] = useState<number>(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  // Reset focused index to the selected option each time the dropdown opens.
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  // When a labelPrefix is provided (e.g. "Zoom: "), show it as the trigger label.
  // Otherwise show the currently selected option's label so the button always
  // reflects the active value even before the dropdown is opened.
  const displayLabel =
    labelPrefix || options[selectedIndex]?.label || DEFAULT_DROPDOWN_LABEL;

  // Stable ID prefix for ARIA option IDs — derived from aria-label.
  // ariaLabel should always be provided; without it multiple ToolbarDropdown
  // instances would generate identical option element IDs, which is invalid HTML
  // and breaks aria-activedescendant for screen readers.
  const idPrefix = useMemo(
    () => (ariaLabel ?? "toolbar-dropdown").toLowerCase().replace(/\s+/g, "-"),
    [ariaLabel]
  );

  // Points to the keyboard-focused option (not necessarily the selected value).
  const activeDescendantId = isOpen
    ? `${idPrefix}-option-${options[focusedIndex]?.value ?? value}`
    : undefined;

  const handleSelect = (optionValue: T): void => {
    onChange(optionValue);
    close(true);
  };

  // Arrow key navigation for the listbox (WCAG 2.1 SC 2.1.1).
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const focused = options[focusedIndex];
      if (focused) handleSelect(focused.value);
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={icon}
        label={displayLabel}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        title={title}
        labelPriority={labelPriority}
        triggerRef={triggerRef}
      />

      {isOpen && (
        <DropdownPanel
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={activeDescendantId}
        >
          {options.map((option, index) => (
            <DropdownItem
              key={option.value}
              id={`${idPrefix}-option-${option.value}`}
              isSelected={option.value === value}
              isFocused={index === focusedIndex}
              onClick={() => handleSelect(option.value)}
              role="option"
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}

// Memoized export — prevents re-renders when parent re-renders with stable props.
// The cast preserves the generic type parameter that memo() would otherwise erase.
export const ToolbarDropdown = memo(
  ToolbarDropdownInner
) as typeof ToolbarDropdownInner;
