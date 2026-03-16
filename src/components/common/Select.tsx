/**
 * Select - Reusable select dropdown component with consistent styling.
 *
 * Supports two style variants:
 * - default: Standard select with subtle focus ring
 * - figma: Figma-style with brand-colored focus ring
 *
 * Accepts children for custom option rendering (including optgroups).
 */

import { forwardRef, memo } from "react";
import type { SelectHTMLAttributes, ReactNode, JSX, Ref } from "react";
import {
  type FormControlVariant,
  formControlVariantClasses,
} from "./formVariantClasses";

export type SelectVariant = FormControlVariant;

/**
 * @remarks Callers MUST supply an accessible label via one of:
 * - `aria-label` (e.g. standalone selects without visible label text)
 * - `aria-labelledby` pointing to a visible label element
 * - A wrapping `<label>` element that references the control via `htmlFor`
 */
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
  "px-3 py-2 text-sm bg-white border rounded cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50";

function SelectInner(
  {
    children,
    variant = "default",
    fullWidth = true,
    className = "",
    ...props
  }: SelectProps,
  ref: Ref<HTMLSelectElement>
): JSX.Element {
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

export const Select = memo(forwardRef(SelectInner));
Select.displayName = "Select";
