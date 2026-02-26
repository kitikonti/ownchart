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

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
}

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

  const displayLabel = labelPrefix || "Select";

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
        <DropdownPanel role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <DropdownItem
              key={option.value}
              isSelected={option.value === value}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}
