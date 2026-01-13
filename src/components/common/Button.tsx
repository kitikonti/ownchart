/**
 * Button - Standard button component with design system styling
 *
 * Based on MS 365/Fluent UI design:
 * - Primary: Brand color (Cyan #008A99) background
 * - Secondary: White background with neutral border
 * - Ghost: Transparent background
 * - Danger: Red background for destructive actions
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Icon to display before the label */
  icon?: ReactNode;
  /** Icon to display after the label */
  iconAfter?: ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-brand-600 text-white border border-transparent
    hover:bg-brand-500
    active:bg-brand-800
    disabled:bg-neutral-300 disabled:text-neutral-400
  `,
  secondary: `
    bg-white text-neutral-800 border border-neutral-200
    hover:bg-neutral-50 hover:border-neutral-300
    active:bg-neutral-100
    disabled:bg-neutral-100 disabled:text-neutral-300 disabled:border-neutral-200
  `,
  ghost: `
    bg-transparent text-neutral-700 border border-transparent
    hover:bg-neutral-100 hover:text-neutral-800
    active:bg-neutral-200
    disabled:text-neutral-300
  `,
  danger: `
    bg-error text-white border border-transparent
    hover:bg-red-700
    active:bg-red-800
    disabled:bg-neutral-300 disabled:text-neutral-400
  `,
};

// MS Fluent button sizing: height ~31px, min-width 96px, padding 5px 12px
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 min-w-[72px] px-2.5 py-1 text-xs gap-1.5",
  md: "h-8 min-w-[96px] px-3 py-[5px] text-sm gap-2",
  lg: "h-10 min-w-[120px] px-4 py-2 text-base gap-2.5",
};

/**
 * Standard button component following the OwnChart design system.
 *
 * @example
 * ```tsx
 * // Primary action
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 *
 * // Secondary action
 * <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
 *
 * // With icon
 * <Button variant="primary" icon={<DownloadIcon size={16} />}>Export</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      icon,
      iconAfter,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    // MS Fluent: font-weight 600, transition 0.1s cubic-bezier(0.33, 0, 0.67, 1)
    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold
      rounded
      transition-all duration-100 ease-[cubic-bezier(0.33,0,0.67,1)]
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:ring-offset-2
      disabled:cursor-not-allowed
      select-none
    `;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
      </button>
    );
  }
);
