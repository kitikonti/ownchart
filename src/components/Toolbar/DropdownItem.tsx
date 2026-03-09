/**
 * DropdownItem - Standard item for dropdown menus with optional checkmark.
 *
 * Replaces repeated inline-styled <button> elements across toolbar dropdowns.
 * Hover handled via CSS class .dropdown-item (no inline backgroundColor).
 */

import { memo, type ReactNode, type AriaRole } from "react";

import { Check } from "@phosphor-icons/react";

/**
 * ARIA roles that support the `aria-selected` attribute per the WAI-ARIA spec.
 * Only these roles should receive `aria-selected`; roles like `menuitem` do not
 * support it and would cause accessibility violations.
 */
const ARIA_SELECTED_ROLES = new Set<AriaRole>([
  "option",
  "tab",
  "treeitem",
  "row",
  "gridcell",
  "columnheader",
  "rowheader",
]);

/**
 * ARIA roles that support the `aria-checked` attribute per the WAI-ARIA spec.
 * `menuitemcheckbox` and `menuitemradio` are the primary roles that require it.
 */
const ARIA_CHECKED_ROLES = new Set<AriaRole>([
  "menuitemcheckbox",
  "menuitemradio",
]);

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
  /**
   * ARIA role — when set to a role that supports `aria-selected` (e.g. "option",
   * "tab", "treeitem"), `aria-selected` is also emitted. Roles like "menuitem"
   * do NOT support `aria-selected` and will not emit it.
   * When set to "menuitemcheckbox" or "menuitemradio", `aria-checked` is emitted
   * instead, derived from `isSelected` unless overridden via `aria-checked`.
   */
  role?: AriaRole;
  /** aria-selected override (only emitted when role supports aria-selected) */
  "aria-selected"?: boolean;
  /** aria-checked override (only emitted when role supports aria-checked, e.g. menuitemcheckbox) */
  "aria-checked"?: boolean;
}

export const DropdownItem = memo(function DropdownItem({
  isSelected = false,
  onClick,
  children,
  description,
  showCheckmark = true,
  trailing,
  role,
  "aria-selected": ariaSelected,
  "aria-checked": ariaChecked,
}: DropdownItemProps): JSX.Element {
  const hasDescription = !!description;

  return (
    <button
      type="button"
      role={role}
      aria-selected={
        role && ARIA_SELECTED_ROLES.has(role)
          ? (ariaSelected ?? isSelected)
          : undefined
      }
      aria-checked={
        role && ARIA_CHECKED_ROLES.has(role)
          ? (ariaChecked ?? isSelected)
          : undefined
      }
      onClick={onClick}
      className={[
        "dropdown-item",
        "flex items-center w-full cursor-pointer text-left text-sm text-neutral-900 whitespace-nowrap",
        hasDescription
          ? "min-h-[36px] py-1.5 pr-3 pl-2"
          : "h-8 py-0 pr-[15px] pl-[9px]", // px values pixel-align with DropdownPanel left-padding (pl-[9px]) and right edge chrome
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
            <Check
              size={16}
              weight="bold"
              className="text-brand-600"
              aria-hidden="true"
            />
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
});
