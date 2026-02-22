/**
 * DropdownTrigger - Standard trigger button for toolbar dropdowns.
 *
 * Renders an inline-flex button with icon, label, and CaretDown chevron.
 * Hover/open states handled via CSS class .dropdown-trigger
 * (no inline backgroundColor so CSS :hover works).
 */

import type { ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { COLORS, TOOLBAR } from "../../styles/design-tokens";
import {
  useCollapseLevel,
  shouldShowLabel,
} from "../Ribbon/RibbonCollapseContext";

interface DropdownTriggerProps {
  /** Whether the dropdown is currently open */
  isOpen: boolean;
  /** Click handler (typically from useDropdown.toggle) */
  onClick: () => void;
  /** Icon element shown before label */
  icon?: ReactNode;
  /** Text label */
  label: string;
  /** Accessible label */
  "aria-label"?: string;
  /** Tooltip */
  title?: string;
  /** ARIA haspopup value */
  "aria-haspopup"?: "true" | "listbox" | "menu" | "dialog";
  /** Visual border state for active config (e.g. WorkingDays) */
  isActive?: boolean;
  /** Collapse priority: lower numbers hide first. Omit to never collapse. */
  labelPriority?: number;
}

export function DropdownTrigger({
  isOpen,
  onClick,
  icon,
  label,
  "aria-label": ariaLabel,
  title,
  "aria-haspopup": ariaHaspopup = "true",
  isActive = false,
  labelPriority,
}: DropdownTriggerProps): JSX.Element {
  const collapseLevel = useCollapseLevel();
  const showLabel = shouldShowLabel(labelPriority, collapseLevel);

  // When label is hidden, use label text as tooltip fallback
  const effectiveTitle = !showLabel && !title ? label : title;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup={ariaHaspopup}
      aria-expanded={isOpen}
      title={effectiveTitle}
      className={`dropdown-trigger${isActive && !isOpen ? " dropdown-trigger-active" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        height: `${TOOLBAR.buttonHeight}px`,
        padding: "5px 6px",
        color: COLORS.neutral[800],
        border: "0.667px solid transparent",
        borderColor: isActive && !isOpen ? "rgb(97, 97, 97)" : "transparent",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
        lineHeight: "20px",
        fontWeight: 400,
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {showLabel && <span>{label}</span>}
      <CaretDown
        size={12}
        weight="bold"
        style={{ marginLeft: showLabel ? "2px" : "0px" }}
      />
    </button>
  );
}
