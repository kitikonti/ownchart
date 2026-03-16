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
 *
 * @important Every variant in this map MUST include `focus-visible:ring-*` classes.
 * Input and Select components do not add a focus ring in their own base classes —
 * they rely entirely on the variant map for keyboard-focus indication. A variant
 * that omits the ring will silently break keyboard accessibility for both controls.
 */
export const formControlVariantClasses: Record<FormControlVariant, string> = {
  default:
    "border-slate-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 hover:border-slate-400",
  figma:
    "border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:border-brand-600",
};
