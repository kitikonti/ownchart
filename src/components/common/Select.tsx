/**
 * Select - Reusable select dropdown component with consistent styling.
 *
 * Supports two style variants:
 * - default: Standard select with subtle focus ring
 * - figma: Figma-style with brand-colored focus ring
 *
 * Accepts children for custom option rendering (including optgroups).
 */

import type { SelectHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { formVariantClasses } from "./formVariantClasses";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> {
  /** Children (option elements, optgroups) */
  children: ReactNode;
  /** Style variant */
  variant?: "default" | "figma";
  /** Additional CSS classes */
  className?: string;
}

const baseClasses =
  "w-full px-3 py-2 text-sm bg-white border rounded cursor-pointer transition-colors duration-150";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, variant = "default", className = "", ...props }, ref) => {
    const classes = [baseClasses, formVariantClasses[variant], className]
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
