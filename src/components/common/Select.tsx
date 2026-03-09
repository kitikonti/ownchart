/**
 * Select - Reusable select dropdown component with consistent styling.
 *
 * Supports two style variants:
 * - default: Standard select with subtle focus ring
 * - figma: Figma-style with brand-colored focus ring
 *
 * Accepts children for custom option rendering (including optgroups).
 */

import {
  forwardRef,
  type SelectHTMLAttributes,
  type ReactNode,
  type JSX,
} from "react";
import {
  type FormControlVariant,
  formControlVariantClasses,
} from "./formVariantClasses";

export type SelectVariant = FormControlVariant;

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> {
  /** Children (option elements, optgroups) */
  children: ReactNode;
  /** Style variant */
  variant?: SelectVariant;
  /** Use full width (default: true) */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const baseClasses =
  "px-3 py-2 text-sm bg-white border rounded cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      children,
      variant = "default",
      fullWidth = true,
      className = "",
      ...props
    },
    ref
  ): JSX.Element => {
    const classes = [
      baseClasses,
      formControlVariantClasses[variant],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
