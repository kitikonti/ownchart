/**
 * Toolbar Primitives - Base building blocks for consistent toolbar design
 *
 * Design Philosophy (inspired by Figma, Linear, Notion):
 * - Clean, refined utilitarian aesthetic
 * - Consistent spacing and sizing across all elements
 * - Clear visual hierarchy with subtle separators
 * - Smooth micro-interactions on hover/active states
 */

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from "react";

// ============================================================================
// Design Tokens
// ============================================================================

export const TOOLBAR_TOKENS = {
  // Icon sizes (Phosphor Icons: 16px grid, optimal at 16/20/24/32)
  iconSize: 20,
  iconSizeSmall: 16,

  // Spacing
  groupGap: 4, // gap between items within a group (px)
  sectionGap: 8, // gap between groups (px)

  // Colors (Tailwind classes)
  iconDefault: "text-gray-600",
  iconHover: "text-gray-900",
  iconActive: "text-blue-600",
  iconDisabled: "text-gray-300",

  bgHover: "bg-gray-100",
  bgActive: "bg-blue-50",
  bgPressed: "bg-gray-200",

  separatorColor: "bg-gray-200",
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
      className={`h-5 w-px bg-gray-200 mx-2 flex-shrink-0 ${className}`}
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

interface ToolbarButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
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
    // Base styles shared by all variants
    const baseStyles = `
      inline-flex items-center justify-center gap-1.5
      rounded-md transition-all duration-150 ease-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
      disabled:pointer-events-none
    `;

    // Variant-specific styles
    const variantStyles: Record<ToolbarButtonVariant, string> = {
      default: `
        p-1.5 text-gray-600
        hover:text-gray-900 hover:bg-gray-100
        active:bg-gray-200 active:scale-[0.97]
        disabled:text-gray-300
      `,
      primary: `
        px-2.5 py-1
        bg-blue-600 text-white text-sm font-medium
        hover:bg-blue-700
        active:bg-blue-800 active:scale-[0.98]
        disabled:bg-gray-200 disabled:text-gray-400
      `,
      toggle: isActive
        ? `
          p-1.5
          bg-blue-100 text-blue-700
          hover:bg-blue-200
          active:bg-blue-300 active:scale-[0.97]
        `
        : `
          p-1.5 text-gray-500
          hover:text-gray-700 hover:bg-gray-100
          active:bg-gray-200 active:scale-[0.97]
          disabled:text-gray-300
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
