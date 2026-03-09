/**
 * Shared Tailwind variant class maps for form controls (Input, Select).
 *
 * Centralised here so both components stay in sync when design tokens change.
 */

export type FormControlVariant = "default" | "figma";

/**
 * Focus/border variant classes shared by all form controls.
 *
 * @remarks Callers MUST supply an accessible label via one of:
 * - `aria-label` (e.g. standalone inputs / selects without visible label text)
 * - `aria-labelledby` pointing to a visible label element
 * - A wrapping `<label>` element that references the control via `htmlFor`
 */
export const formControlVariantClasses: Record<FormControlVariant, string> = {
  default:
    "border-neutral-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 hover:border-neutral-400",
  figma:
    "border-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:border-brand-600",
};
