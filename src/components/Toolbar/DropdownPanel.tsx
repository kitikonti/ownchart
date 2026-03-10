/**
 * DropdownPanel - Single source of truth for dropdown panel styling.
 *
 * ALL toolbar dropdowns use this component for their floating panel.
 * One consistent look: same border-radius, same shadow, same spacing.
 * Styled via CSS class .dropdown-panel so there is exactly one place to edit.
 *
 * The `.dropdown-panel` CSS class (position, shadow, border, z-index) is defined
 * in `src/index.css`. Inline styles here are restricted to layout overrides
 * (width, minWidth, maxHeight, alignment) that vary per call site.
 */

import { memo } from "react";
import type { ReactNode, CSSProperties } from "react";

type DropdownPanelAlign = "left" | "right";

/**
 * Subset of ARIA roles that are semantically valid for a floating dropdown panel.
 * Narrower than React's `AriaRole` to catch typos at compile time.
 * Note: "listitem" is intentionally excluded — it is a role for items within
 * a list (<li>), not a container role suitable for a floating panel.
 */
type DropdownPanelRole =
  | "listbox"
  | "menu"
  | "dialog"
  | "grid"
  | "tree"
  | "group";

interface DropdownPanelBaseProps {
  children: ReactNode;
  /** Horizontal alignment relative to trigger */
  align?: DropdownPanelAlign;
  /** Fixed width */
  width?: string;
  /** Minimum width (defaults to "100%"). Pass an empty string "" to suppress the property entirely. */
  minWidth?: string;
  /** Maximum height with overflow scroll */
  maxHeight?: string;
  /** Additional inline styles (only for layout overrides like padding) */
  style?: CSSProperties;
  /** CSS class name */
  className?: string;
}

/**
 * Discriminated union: `aria-label` is required when `role` is set (WCAG 2.1 §4.1.2).
 * Every named widget role needs an accessible name.
 */
type DropdownPanelProps =
  | (DropdownPanelBaseProps & { role?: undefined; "aria-label"?: string })
  | (DropdownPanelBaseProps & {
      role: DropdownPanelRole;
      "aria-label": string;
    });

export const DropdownPanel = memo(function DropdownPanel({
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
});
