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

import {
  forwardRef,
  memo,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import {
  useCollapseLevel,
  shouldShowLabel,
} from "../Ribbon/RibbonCollapseContext";

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
export const ToolbarSeparator = memo(function ToolbarSeparator({
  className = "",
}: ToolbarSeparatorProps): JSX.Element {
  return (
    <div
      className={`toolbar-separator h-5 mx-2 flex-shrink-0 ${className}`}
      role="separator"
      aria-orientation="vertical"
    />
  );
});

// ============================================================================
// ToolbarGroup
// ============================================================================

interface ToolbarGroupProps {
  children: ReactNode;
  /** Accessible label for the group — required so screen readers can identify the group's purpose. */
  label: string;
  /** Add visual separator after this group */
  withSeparator?: boolean;
  className?: string;
}

/**
 * Groups related toolbar items with consistent spacing.
 * Optionally adds a separator after the group.
 */
export const ToolbarGroup = memo(function ToolbarGroup({
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
});

// ============================================================================
// ToolbarButton
// ============================================================================

type ToolbarButtonVariant = "default" | "primary" | "toggle";
type ToolbarButtonSize = "default" | "large";

type BaseToolbarButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "aria-label" | "type"
> & {
  /** Visual variant */
  variant?: ToolbarButtonVariant;
  /** Button size */
  size?: ToolbarButtonSize;
  /** For toggle buttons: is it currently active? */
  isActive?: boolean;
  /** Icon element */
  icon?: ReactNode;
  /** Additional classes */
  className?: string;
  /** Collapse priority: lower numbers hide first. Omit to never collapse. */
  labelPriority?: number;
};

/**
 * Accessible name contract (enforced by TypeScript):
 * - If `label` is provided, it serves as the accessible name when visible.
 *   When the label collapses due to space constraints, it is automatically
 *   promoted to `aria-label` and `title`.
 * - Icon-only buttons (no `label`) must supply an explicit `aria-label`.
 */
export type ToolbarButtonProps = BaseToolbarButtonProps &
  (
    | { label: string; "aria-label"?: string }
    | { label?: never; "aria-label": string }
  );

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
export const ToolbarButton = memo(
  forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
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
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ): JSX.Element {
    const collapseLevel = useCollapseLevel();
    const showLabel = shouldShowLabel(labelPriority, collapseLevel);

    // When the label is collapsed (hidden), promote it to aria-label and title
    // so screen reader users and sighted keyboard users can still discover the
    // button's purpose. Caller-provided aria-label always takes precedence.
    const collapsedLabelProps =
      !showLabel && label
        ? {
            "aria-label": ariaLabel ?? label,
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
        aria-label={ariaLabel}
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
  })
);

// ============================================================================
// ToolbarSpacer
// ============================================================================

/**
 * Flexible spacer to push elements to the right.
 */
export const ToolbarSpacer = memo(function ToolbarSpacer(): JSX.Element {
  return <div className="flex-1 min-w-4" />;
});
