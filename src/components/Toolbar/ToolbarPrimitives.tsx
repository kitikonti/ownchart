/**
 * Toolbar Primitives - Base building blocks for consistent toolbar design
 *
 * Design Philosophy: MS 365/Fluent UI Inspired
 * - Neutral gray palette (pure grays, no blue tint)
 * - Outlook Blue (#0F6CBD) as the brand color for interactive elements
 * - Smooth micro-interactions that feel polished
 * - Consistent spacing and proportions
 *
 * All visual states (hover, active, focus, disabled, variants) are driven
 * entirely by CSS via the `ribbon-toolbar-button` class in index.css.
 * No inline styles — all styling through Tailwind classes and CSS selectors.
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { COLORS, TOOLBAR } from "../../styles/design-tokens";
import {
  useCollapseLevel,
  shouldShowLabel,
} from "../Ribbon/RibbonCollapseContext";

// Re-export tokens for use by other components
export { COLORS, TOOLBAR };

// ============================================================================
// ToolbarSeparator
// ============================================================================

interface ToolbarSeparatorProps {
  className?: string;
}

/**
 * Subtle vertical separator between toolbar sections.
 * Use sparingly - prefer spacing for closely related groups.
 */
export function ToolbarSeparator({
  className = "",
}: ToolbarSeparatorProps): JSX.Element {
  return (
    <div
      className={`toolbar-separator h-5 mx-2 flex-shrink-0 ${className}`}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

// ============================================================================
// ToolbarGroup
// ============================================================================

interface ToolbarGroupProps {
  children: ReactNode;
  /** Optional label for accessibility */
  label?: string;
  /** Add visual separator after this group */
  withSeparator?: boolean;
  className?: string;
}

/**
 * Groups related toolbar items with consistent spacing.
 * Optionally adds a separator after the group.
 */
export function ToolbarGroup({
  children,
  label,
  withSeparator = false,
  className = "",
}: ToolbarGroupProps): JSX.Element {
  return (
    <>
      <div
        className={`flex items-center gap-0.5 ${className}`}
        role="group"
        aria-label={label}
      >
        {children}
      </div>
      {withSeparator && <ToolbarSeparator />}
    </>
  );
}

// ============================================================================
// ToolbarButton
// ============================================================================

type ToolbarButtonVariant = "default" | "primary" | "toggle";
type ToolbarButtonSize = "default" | "large";

interface ToolbarButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  /** Visual variant */
  variant?: ToolbarButtonVariant;
  /** Button size */
  size?: ToolbarButtonSize;
  /** For toggle buttons: is it currently active? */
  isActive?: boolean;
  /** Show text label next to icon */
  label?: string;
  /** Icon element */
  icon?: ReactNode;
  /** Additional classes */
  className?: string;
  /** Collapse priority: lower numbers hide first. Omit to never collapse. */
  labelPriority?: number;
}

/**
 * Base toolbar button with consistent styling.
 *
 * Visual state is driven entirely by the `ribbon-toolbar-button` CSS class
 * (index.css) and `data-variant` / `data-size` / `aria-pressed` attributes —
 * no inline styles. This keeps all styling in one place and avoids specificity
 * fights with Tailwind utility classes.
 *
 * Variants:
 * - default: Standard icon button
 * - primary: Emphasized action (like "Add Task")
 * - toggle: Toggle state button (like "Show Dependencies")
 */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    {
      variant = "default",
      size = "default",
      isActive = false,
      label,
      icon,
      disabled,
      className = "",
      children,
      labelPriority,
      ...props
    },
    ref
  ) {
    const collapseLevel = useCollapseLevel();
    const showLabel = shouldShowLabel(labelPriority, collapseLevel);

    // When the label is collapsed (hidden), expose it as both the accessible
    // name (aria-label) and the hover tooltip (title) so screen reader users
    // and sighted keyboard users can still discover the button's purpose.
    // Caller-provided values always take precedence.
    const collapsedLabelProps =
      !showLabel && label
        ? {
            "aria-label": props["aria-label"] ?? label,
            title: props.title ?? label,
          }
        : {};

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        data-variant={variant}
        data-size={size !== "default" ? size : undefined}
        aria-pressed={variant === "toggle" ? isActive : undefined}
        className={`ribbon-toolbar-button ${className}`}
        {...collapsedLabelProps}
        {...props}
      >
        {icon}
        {label && showLabel && (
          <span className="pl-1 whitespace-nowrap select-none">{label}</span>
        )}
        {children}
      </button>
    );
  }
);

// ============================================================================
// ToolbarSpacer
// ============================================================================

/**
 * Flexible spacer to push elements to the right.
 */
export function ToolbarSpacer(): JSX.Element {
  return <div className="flex-1 min-w-4" />;
}
