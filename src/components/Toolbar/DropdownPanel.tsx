/**
 * DropdownPanel - Single source of truth for dropdown panel styling.
 *
 * ALL toolbar dropdowns use this component for their floating panel.
 * One consistent look: same border-radius, same shadow, same spacing.
 * Styled via CSS class .dropdown-panel so there is exactly one place to edit.
 */

import type { AriaRole, ReactNode, CSSProperties } from "react";

type DropdownPanelAlign = "left" | "right";

interface DropdownPanelProps {
  children: ReactNode;
  /** Horizontal alignment relative to trigger */
  align?: DropdownPanelAlign;
  /** Fixed width */
  width?: string;
  /** Minimum width (defaults to "100%"). Pass an empty string "" to suppress the property entirely. */
  minWidth?: string;
  /** Maximum height with overflow scroll */
  maxHeight?: string;
  /** ARIA role */
  role?: AriaRole;
  /**
   * ARIA label for the panel.
   * Required when `role` is set (e.g. "listbox", "menu") to satisfy WCAG 2.1 §4.1.2.
   * Every named widget role needs an accessible name.
   */
  "aria-label"?: string;
  /** Additional inline styles (only for layout overrides like padding) */
  style?: CSSProperties;
  /** CSS class name */
  className?: string;
}

export function DropdownPanel({
  children,
  align = "left",
  width,
  minWidth = "100%",
  maxHeight,
  role,
  "aria-label": ariaLabel,
  style,
  className = "",
}: DropdownPanelProps): JSX.Element {
  const panelStyle: CSSProperties = {
    [align === "right" ? "right" : "left"]: 0,
    // width is optional — omit the property entirely when not set
    ...(width ? { width } : {}),
    // minWidth defaults to "100%" but a caller may pass "" to suppress it
    ...(minWidth ? { minWidth } : {}),
    // maxHeight enables scroll when set
    ...(maxHeight ? { maxHeight, overflowY: "auto" as const } : {}),
    ...style,
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={`dropdown-panel ${className}`.trim()}
      data-dropdown-panel
      style={panelStyle}
    >
      {children}
    </div>
  );
}
