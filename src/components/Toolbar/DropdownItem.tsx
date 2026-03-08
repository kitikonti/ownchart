/**
 * DropdownItem - Standard item for dropdown menus with optional checkmark.
 *
 * Replaces repeated inline-styled <button> elements across toolbar dropdowns.
 * Hover handled via CSS class .dropdown-item (no inline backgroundColor).
 */

import type { ReactNode } from "react";
import { Check } from "@phosphor-icons/react";

interface DropdownItemProps {
  /** Whether this item is currently selected */
  isSelected?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Primary label */
  children: ReactNode;
  /** Optional description text below the label */
  description?: string;
  /** Show checkmark column (default true) */
  showCheckmark?: boolean;
  /** Trailing content (e.g. color swatches) */
  trailing?: ReactNode;
  /** ARIA role — when set, enables aria-selected on the button */
  role?: React.AriaRole;
  /** aria-selected override (only emitted when role is set) */
  "aria-selected"?: boolean;
}

export function DropdownItem({
  isSelected = false,
  onClick,
  children,
  description,
  showCheckmark = true,
  trailing,
  role,
  "aria-selected": ariaSelected,
}: DropdownItemProps): JSX.Element {
  const hasDescription = !!description;

  return (
    <button
      type="button"
      role={role}
      aria-selected={role ? (ariaSelected ?? isSelected) : undefined}
      onClick={onClick}
      className={[
        "dropdown-item",
        "flex items-center w-full cursor-pointer text-left text-sm text-neutral-900 whitespace-nowrap",
        hasDescription
          ? "min-h-[36px] py-1.5 pr-3 pl-2"
          : "h-8 py-0 pr-[15px] pl-[9px]",
        isSelected ? "dropdown-item-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Checkmark space */}
      {showCheckmark && (
        <span
          className={[
            "inline-flex items-center justify-center w-5 h-5 flex-shrink-0",
            hasDescription ? "mr-2" : "mr-2.5",
          ].join(" ")}
        >
          {isSelected && (
            <Check size={16} weight="bold" className="text-green-700" />
          )}
        </span>
      )}

      {/* Content */}
      {hasDescription ? (
        <div className="flex-1">
          <div>{children}</div>
          <div className="text-xs text-neutral-500 mt-px">{description}</div>
        </div>
      ) : (
        <span className="flex-1">{children}</span>
      )}

      {trailing}
    </button>
  );
}
