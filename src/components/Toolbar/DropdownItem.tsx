/**
 * DropdownItem - Standard item for dropdown menus with optional checkmark.
 *
 * Replaces repeated inline-styled <button> elements across toolbar dropdowns.
 * Hover handled via CSS class .dropdown-item (no inline backgroundColor).
 */

import type { ReactNode, ReactElement } from "react";
import { Check } from "@phosphor-icons/react";

interface DropdownItemProps {
  /** Whether this item is currently selected */
  isSelected?: boolean;
  /**
   * Whether this item has keyboard focus (via Arrow key navigation).
   * When true, a visual highlight is applied matching the hover style
   * so keyboard users get the same affordance as mouse users.
   */
  isFocused?: boolean;
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
  role?: string;
  /** aria-selected override (only emitted when role is set) */
  "aria-selected"?: boolean;
  /** HTML id — used for aria-activedescendant on the parent listbox */
  id?: string;
}

export function DropdownItem({
  isSelected = false,
  isFocused = false,
  onClick,
  children,
  description,
  showCheckmark = true,
  trailing,
  role,
  "aria-selected": ariaSelected,
  id,
}: DropdownItemProps): ReactElement {
  const hasDescription = !!description;

  return (
    <button
      id={id}
      type="button"
      role={role}
      aria-selected={role ? (ariaSelected ?? isSelected) : undefined}
      onClick={onClick}
      className={`dropdown-item${isSelected ? " dropdown-item-selected" : ""}${isFocused ? " dropdown-item-focused" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        ...(hasDescription
          ? { minHeight: "36px", padding: "6px 12px 6px 8px" }
          : { height: "32px", padding: "0 15px 0 9px" }),
        color: "rgb(36, 36, 36)",
        border: isSelected ? undefined : "none",
        borderRadius: isSelected ? undefined : "0",
        cursor: "pointer",
        fontSize: "14px",
        ...(hasDescription ? {} : { lineHeight: "32px" }),
        textAlign: "left",
        whiteSpace: "nowrap",
      }}
    >
      {/* Checkmark space */}
      {showCheckmark && (
        <span
          style={{
            width: "20px",
            height: "20px",
            marginRight: hasDescription ? "8px" : "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isSelected && (
            <Check
              size={16}
              weight="bold"
              style={{ color: "rgb(73, 130, 5)" }}
            />
          )}
        </span>
      )}

      {/* Content */}
      {hasDescription ? (
        <div style={{ flex: 1 }}>
          <div>{children}</div>
          <div
            style={{
              fontSize: "12px",
              color: "rgb(120, 120, 120)",
              marginTop: "1px",
            }}
          >
            {description}
          </div>
        </div>
      ) : (
        <span style={{ flex: 1 }}>{children}</span>
      )}

      {trailing}
    </button>
  );
}
