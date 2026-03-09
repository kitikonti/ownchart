/**
 * Input - Reusable text input component with consistent styling.
 *
 * Supports two style variants:
 * - default: Standard input with subtle focus ring
 * - figma: Figma-style with brand-colored focus ring
 */

import { forwardRef, type InputHTMLAttributes } from "react";

export type InputVariant = "default" | "figma";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> {
  /** Style variant */
  variant?: InputVariant;
  /** Use monospace font */
  mono?: boolean;
  /** Use full width (default: true) */
  fullWidth?: boolean;
  /** Additional CSS classes */
  className?: string;
  /**
   * @remarks Callers MUST supply an accessible label via one of:
   * - `aria-label` (e.g. standalone search inputs)
   * - `aria-labelledby` pointing to a visible label element
   * - A wrapping `<label>` element that references this input via `htmlFor`
   */
  "aria-label"?: string;
}

const baseClasses =
  "px-3 py-2 text-sm bg-white border rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50";

const variantClasses = {
  default:
    "border-neutral-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 hover:border-neutral-400",
  figma:
    "border-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:border-brand-600",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      mono = false,
      fullWidth = true,
      className = "",
      ...props
    },
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
