/**
 * Select - Reusable select dropdown component with consistent styling.
 *
 * Accepts children for custom option rendering (including optgroups).
 */

import type { SelectHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  /** Children (option elements, optgroups) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const baseClasses =
  "w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded cursor-pointer " +
  "focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 " +
  "transition-colors duration-150 hover:border-neutral-400";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = "", ...props }, ref) => {
    const classes = [baseClasses, className].filter(Boolean).join(" ");

    return (
      <select ref={ref} className={classes} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
