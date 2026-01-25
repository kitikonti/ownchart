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

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  /** Children (option elements, optgroups) */
  children: ReactNode;
  /** Style variant */
  variant?: "default" | "figma";
  /** Additional CSS classes */
  className?: string;
}

const baseClasses =
  "w-full px-3 py-2 text-sm bg-white border rounded cursor-pointer transition-colors duration-150";

const variantClasses = {
  default:
    "border-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 hover:border-neutral-400",
  figma:
    "border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600",
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, variant = "default", className = "", ...props }, ref) => {
    const classes = [baseClasses, variantClasses[variant], className]
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
