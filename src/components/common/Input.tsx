/**
 * Input - Reusable text input component with consistent styling.
 *
 * Supports two style variants:
 * - default: Standard input with subtle focus ring
 * - figma: Figma-style with brand-colored focus ring
 */

import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Style variant */
  variant?: "default" | "figma";
  /** Use monospace font */
  mono?: boolean;
  /** Use full width (default: true) */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const baseClasses =
  "px-3 py-2 text-sm bg-white border rounded transition-colors duration-150";

const variantClasses = {
  default:
    "border-neutral-300 focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 hover:border-neutral-400",
  figma:
    "border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { variant = "default", mono = false, fullWidth = true, className = "", ...props },
    ref
  ) => {
    const classes = [
      baseClasses,
      variantClasses[variant],
      fullWidth ? "w-full" : "",
      mono ? "font-mono" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <input ref={ref} className={classes} {...props} />;
  }
);

Input.displayName = "Input";
