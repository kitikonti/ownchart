/**
 * DropdownTrigger - Standard trigger button for toolbar dropdowns.
 *
 * Renders an inline-flex button with icon, label, and CaretDown chevron.
 * Hover/open states handled via CSS class .dropdown-trigger
 * (no inline backgroundColor so CSS :hover works).
 *
 * Only dynamic values that cannot be expressed as static Tailwind classes
 * (button height from TOOLBAR token, and the conditional active border color)
 * use inline styles. Everything else uses Tailwind utility classes.
 */

import type { ReactNode, ReactElement, RefCallback } from "react";
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
  /** Accessible label — defaults to label text when not provided */
  "aria-label"?: string;
  /** Tooltip */
  title?: string;
  /** ARIA haspopup value */
  "aria-haspopup"?: "true" | "listbox" | "menu" | "dialog";
  /** Visual border state for active config (e.g. WorkingDays) */
  isActive?: boolean;
  /** Collapse priority: lower numbers hide first. Omit to never collapse. */
  labelPriority?: number;
  /** Callback ref for focus management (from useDropdown.triggerRef) */
  triggerRef?: RefCallback<HTMLButtonElement>;
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
  triggerRef,
}: DropdownTriggerProps): ReactElement {
  const collapseLevel = useCollapseLevel();
  const showLabel = shouldShowLabel(labelPriority, collapseLevel);

  // When label is hidden, use label text as tooltip fallback
  const effectiveTitle = !showLabel && !title ? label : title;

  // Active border uses COLORS.neutral[600] (#525252); transparent when inactive or open.
  const activeBorderColor =
    isActive && !isOpen ? COLORS.neutral[600] : "transparent";

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={onClick}
      // Fall back to label text so icon-only state is still accessible
      aria-label={ariaLabel ?? label}
      aria-haspopup={ariaHaspopup}
      aria-expanded={isOpen}
      title={effectiveTitle}
      className={`dropdown-trigger inline-flex items-center justify-center gap-1 rounded px-1.5 py-1 text-sm font-normal leading-5 text-neutral-800 cursor-pointer select-none whitespace-nowrap${isActive && !isOpen ? " dropdown-trigger-active" : ""}`}
      style={{
        // Height is a design token value — cannot be expressed as a static Tailwind class
        height: `${TOOLBAR.buttonHeight}px`,
        border: `${TOOLBAR.triggerBorderWidth} solid`,
        // Border color is conditionally driven by isActive/isOpen state
        borderColor: activeBorderColor,
      }}
    >
      {icon}
      {showLabel && <span>{label}</span>}
      <CaretDown
        size={12}
        weight="bold"
        className={showLabel ? "ml-0.5" : ""}
        aria-hidden="true"
      />
    </button>
  );
}
