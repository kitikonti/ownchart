/**
 * ToolbarDropdown - MS Word style dropdown for toolbar
 *
 * Features:
 * - Icon + text trigger button
 * - Hover state with light gray background
 * - Dropdown menu with checkmark for selected item
 * - Keyboard navigation support
 */

import type { ReactNode } from "react";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "./DropdownTrigger";
import { DropdownPanel } from "./DropdownPanel";
import { DropdownItem } from "./DropdownItem";
import type { DropdownOption } from "../../types/ui.types";

// Re-exported so existing imports from this file continue to work.
export type { DropdownOption } from "../../types/ui.types";

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

export function ToolbarDropdown<T extends string = string>({
  value,
  options,
  onChange,
  icon,
  labelPrefix = "",
  "aria-label": ariaLabel,
  title,
  labelPriority,
}: ToolbarDropdownProps<T>): JSX.Element {
  const { isOpen, toggle, close, containerRef, triggerRef } = useDropdown();

  // When a labelPrefix is provided (e.g. "Zoom: "), show it as the trigger label.
  // Otherwise show the currently selected option's label so the button always
  // reflects the active value even before the dropdown is opened.
  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = labelPrefix || selectedOption?.label || "Select";

  // Stable ID prefix for ARIA option IDs — derived from aria-label or a fallback.
  const idPrefix = (ariaLabel ?? "toolbar-dropdown")
    .toLowerCase()
    .replace(/\s+/g, "-");
  const activeDescendantId = isOpen ? `${idPrefix}-option-${value}` : undefined;

  const handleSelect = (optionValue: T): void => {
    onChange(optionValue);
    close(true);
  };

  return (
    <div ref={containerRef} className="relative">
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
          {options.map((option) => (
            <DropdownItem
              key={option.value}
              id={`${idPrefix}-option-${option.value}`}
              isSelected={option.value === value}
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
