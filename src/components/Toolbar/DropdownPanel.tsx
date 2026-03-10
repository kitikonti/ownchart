/**
 * DropdownPanel - Single source of truth for dropdown panel styling.
 *
 * ALL toolbar dropdowns use this component for their floating panel.
 * One consistent look: same border-radius, same shadow, same spacing.
 * Styled via CSS class .dropdown-panel so there is exactly one place to edit.
 *
 * The `.dropdown-panel` CSS class (position, shadow, border, z-index) is defined
 * in `src/index.css`. Inline styles here are restricted to layout overrides
 * (width, minWidth, maxHeight, overflowY) that vary per call site.
 * Horizontal alignment (left-0 / right-0) is handled via Tailwind classes.
 */

import { memo, useMemo } from "react";
import type { ReactNode, CSSProperties } from "react";
import { buildClassNames } from "../../utils/buildClassNames";

type DropdownPanelAlign = "left" | "right";

/**
 * Subset of ARIA roles that are semantically valid for a floating dropdown panel.
 * Narrower than React's `AriaRole` to catch typos at compile time.
 * Note: "listitem" is intentionally excluded — it is a role for items within
 * a list (<li>), not a container role suitable for a floating panel.
 *
 * "group" is valid when the panel's primary purpose is to group related form
 * controls (e.g. a set of radio buttons or checkboxes) without the semantics
 * of a full dialog or menu.
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
  /**
   * Additional inline styles (only for layout overrides like padding).
   * Stabilise with `useMemo` at the call site when passing an object literal —
   * a new reference on every render defeats the `panelStyle` memoization inside
   * this component and will cause unnecessary re-computations.
   */
  style?: CSSProperties;
  /** CSS class name */
  className?: string;
}

/**
 * Discriminated union: `aria-label` is required when `role` is set (WCAG 2.1 §4.1.2).
 * Every named widget role needs an accessible name.
 *
 * The no-role branch accepts `aria-label` for forward-compatibility only —
 * e.g. a call site that intends to add a `role` later can pre-supply the label.
 * AT generally ignores `aria-label` on a plain `<div>` with no role, so passing
 * `aria-label` without `role` has NO accessibility effect. Always pair them.
 */
type DropdownPanelProps =
  | (DropdownPanelBaseProps & {
      role?: undefined;
      /**
       * Has no accessibility effect without a matching `role`.
       * AT ignores `aria-label` on a plain `<div>` with no widget role.
       * Always supply `role` together with `aria-label`.
       */
      "aria-label"?: string;
    })
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
  // Alignment is handled via Tailwind so the computed style key trick is avoided.
  // The inline style object only carries truly variable layout values.
  // useMemo prevents a new style object being allocated on every render.
  // The component is memo-wrapped, but children can still trigger re-renders.
  const panelStyle = useMemo<CSSProperties>(
    () => ({
      // width is optional — omit the property entirely when not set
      ...(width ? { width } : {}),
      // minWidth defaults to "100%" but a caller may pass "" to suppress it
      ...(minWidth ? { minWidth } : {}),
      // maxHeight enables scroll when set
      ...(maxHeight ? { maxHeight, overflowY: "auto" } : {}),
      ...style,
    }),
    [width, minWidth, maxHeight, style]
  );

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      className={buildClassNames(
        "dropdown-panel",
        // left-0 / right-0: anchor panel to the corresponding edge of the trigger.
        align === "right" ? "right-0" : "left-0",
        className
      )}
      data-dropdown-panel
      style={panelStyle}
    >
      {children}
    </div>
  );
});
