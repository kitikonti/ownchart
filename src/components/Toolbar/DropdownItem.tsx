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
  /** ARIA role (defaults to "option") */
  role?: string;
  /** aria-selected override */
  "aria-selected"?: boolean;
}

export function DropdownItem({
  isSelected = false,
  onClick,
  children,
  description,
  showCheckmark = true,
  trailing,
  role = "option",
  "aria-selected": ariaSelected,
}: DropdownItemProps): JSX.Element {
  const hasDescription = !!description;

  return (
    <button
      type="button"
      role={role}
      aria-selected={ariaSelected ?? isSelected}
      onClick={onClick}
      className="dropdown-item"
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        ...(hasDescription
          ? { minHeight: "36px", padding: "6px 12px 6px 8px" }
          : { height: "32px", padding: "0 15px 0 9px" }),
        color: "rgb(36, 36, 36)",
        border: "none",
        borderRadius: "0",
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
          <div style={{ fontWeight: isSelected ? 600 : 400 }}>{children}</div>
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
