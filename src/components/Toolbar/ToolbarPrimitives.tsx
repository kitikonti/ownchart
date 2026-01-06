/**
 * Toolbar Primitives - Base building blocks for consistent toolbar design
 *
 * Design Philosophy: "Refined Craft"
 * - Professional, trustworthy aesthetic with subtle depth
 * - Clear visual hierarchy through refined color and shadow
 * - Smooth micro-interactions that feel polished
 * - Consistent spacing and proportions
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";

// ============================================================================
// Design Tokens - Figma-like neutral design
// ============================================================================

export const TOOLBAR_TOKENS = {
  // Icon sizes (Phosphor Icons: 16px grid, optimal at 16/20/24/32)
  iconSize: 20,
  iconSizeSmall: 16,

  // Spacing
  groupGap: 4, // gap between items within a group (px)
  sectionGap: 8, // gap between groups (px)

  // Colors - Neutral, Figma-like palette (WCAG AA compliant)
  iconDefault: "text-slate-600",
  iconHover: "text-slate-800",
  iconActive: "text-slate-900",
  iconDisabled: "text-slate-400", // 3.5:1 contrast - acceptable for disabled

  bgHover: "bg-slate-100",
  bgActive: "bg-slate-200",
  bgPressed: "bg-slate-200",

  separatorColor: "bg-slate-200",
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
export function ToolbarSeparator({ className = "" }: ToolbarSeparatorProps) {
  return (
    <div
      className={`h-5 w-px bg-slate-200 mx-2.5 flex-shrink-0 ${className}`}
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
}: ToolbarGroupProps) {
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

interface ToolbarButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  /** Visual variant */
  variant?: ToolbarButtonVariant;
  /** For toggle buttons: is it currently active? */
  isActive?: boolean;
  /** Show text label next to icon */
  label?: string;
  /** Icon element */
  icon?: ReactNode;
  /** Additional classes */
  className?: string;
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
      isActive = false,
      label,
      icon,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    // Base styles shared by all variants - Figma-like neutral design
    // Focus ring uses high-contrast blue (#1e40af) for visibility
    const baseStyles = `
      inline-flex items-center justify-center gap-1.5
      rounded-md transition-all duration-100 ease-out
      focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700
      disabled:pointer-events-none
    `;

    // Variant-specific styles - WCAG AA compliant colors
    // p-1.5 with 20px icons gives ~32px touch target
    const variantStyles: Record<ToolbarButtonVariant, string> = {
      default: `
        p-1.5 text-slate-600
        hover:text-slate-800 hover:bg-slate-100
        active:bg-slate-200 active:text-slate-900
        disabled:text-slate-400 disabled:bg-transparent
      `,
      primary: `
        px-3 py-1.5
        bg-slate-700 text-white text-xs font-medium
        hover:bg-slate-600
        active:bg-slate-800
        disabled:bg-slate-200 disabled:text-slate-400
      `,
      toggle: isActive
        ? `
          p-1.5
          bg-slate-200 text-slate-900
          hover:bg-slate-300
          active:bg-slate-300
        `
        : `
          p-1.5 text-slate-600
          hover:text-slate-800 hover:bg-slate-100
          active:bg-slate-200 active:text-slate-900
          disabled:text-slate-400
        `,
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-pressed={variant === "toggle" ? isActive : undefined}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {icon}
        {label && <span>{label}</span>}
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
export function ToolbarSpacer() {
  return <div className="flex-1 min-w-4" />;
}
