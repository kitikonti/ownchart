/**
 * Toolbar Primitives - Base building blocks for consistent toolbar design
 *
 * Design Philosophy: MS 365/Fluent UI Inspired
 * - Neutral gray palette (pure grays, no blue tint)
 * - Outlook Blue (#0F6CBD) as the brand color for interactive elements
 * - Smooth micro-interactions that feel polished
 * - Consistent spacing and proportions
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { COLORS, TOOLBAR } from "../../styles/design-tokens";
import {
  useCollapseLevel,
  shouldShowLabel,
} from "../Ribbon/RibbonCollapseContext";

// Re-export tokens for use by other components
export { COLORS, TOOLBAR };

// Legacy export for backward compatibility
export const TOOLBAR_TOKENS = {
  ...TOOLBAR,
  // Colors from design tokens
  bgToolbar: COLORS.neutral[0],
  bgTabs: COLORS.neutral[50],
  bgHover: COLORS.neutral[50],
  bgActive: COLORS.neutral[200],
  bgToggleOn: COLORS.neutral[100],
  // Icon/Text colors - using Tailwind class names
  iconDefault: "text-neutral-600",
  iconHover: "text-neutral-800",
  iconActive: "text-neutral-900",
  iconDisabled: "text-neutral-300",
  // Border colors
  borderLight: COLORS.neutral[100],
  borderMedium: COLORS.neutral[200],
  separatorColor: "bg-neutral-200",
  // Tab active indicator - brand color
  tabActiveColor: COLORS.brand[600],
} as const;

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
    // MS Office button base styles using design tokens
    const baseStyle: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      height: `${TOOLBAR.buttonHeight}px`,
      minWidth: `${TOOLBAR.buttonMinWidth}px`,
      padding: size === "large" ? "5px 12px" : "5px 5px",
      backgroundColor: "transparent",
      color: disabled ? COLORS.neutral[300] : COLORS.neutral[800],
      border: "0.667px solid transparent",
      borderColor: "transparent",
      borderRadius: "4px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px",
      lineHeight: "20px",
      fontWeight: 400,
      userSelect: "none",
      overflow: "hidden",
      transition:
        "background 0.1s cubic-bezier(0.33, 0, 0.67, 1), border 0.1s cubic-bezier(0.33, 0, 0.67, 1), color 0.1s cubic-bezier(0.33, 0, 0.67, 1)",
      WebkitFontSmoothing: "antialiased",
    };

    // Primary variant - brand color (Outlook Blue)
    const primaryStyle: React.CSSProperties =
      variant === "primary"
        ? {
            backgroundColor: disabled ? COLORS.neutral[300] : COLORS.brand[600],
            color: disabled ? COLORS.neutral[400] : COLORS.neutral[0],
            border: "none", // Override baseStyle border for primary only
            borderRadius: "3px", // Subtler corners for primary only
            fontWeight: 400,
            fontSize: "14px",
            boxShadow: "none", // NO shadow in idle (Outlook style)
          }
        : {};

    // Toggle active state - MS Word style with visible border
    const toggleActiveStyle: React.CSSProperties =
      variant === "toggle" && isActive
        ? {
            backgroundColor: "rgb(235, 235, 235)",
            borderColor: "rgb(97, 97, 97)",
          }
        : {};

    const combinedStyle = {
      ...baseStyle,
      ...primaryStyle,
      ...toggleActiveStyle,
    };

    // When label is hidden, use label text as tooltip fallback
    const titleProp =
      !showLabel && label && !props.title ? { title: label } : {};

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        data-variant={variant}
        aria-pressed={variant === "toggle" ? isActive : undefined}
        className={`ribbon-toolbar-button ${className}`}
        style={combinedStyle}
        {...titleProp}
        {...props}
      >
        {icon}
        {label && showLabel && (
          <span
            style={{
              paddingLeft: "4px",
              whiteSpace: "nowrap",
              userSelect: "none",
            }}
          >
            {label}
          </span>
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
