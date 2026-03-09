/**
 * Input - Reusable text input component with consistent styling.
 *
 * Supports two style variants:
 * - default: Standard input with subtle focus ring
 * - figma: Figma-style with brand-colored focus ring
 */

import { forwardRef, type InputHTMLAttributes, type JSX } from "react";
import {
  type FormControlVariant,
  formControlVariantClasses,
} from "./formVariantClasses";

export type InputVariant = FormControlVariant;

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  // Omit then re-declare className so it is always optional (the base
  // HTMLAttributes type makes it optional too, but being explicit here
  // prevents accidental breakage if the upstream type ever changes).
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
}

const baseClasses =
  "px-3 py-2 text-sm bg-white border rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50";

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
  ): JSX.Element => {
    const classes = [
      baseClasses,
      formControlVariantClasses[variant],
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
