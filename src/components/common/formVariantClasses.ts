/**
 * Shared variant class strings for form input/select components.
 * Centralises the two focus-ring styles so Input and Select stay in sync.
 */

export const formVariantClasses: Record<"default" | "figma", string> = {
  default:
    "border-neutral-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-600 focus-visible:border-brand-600 hover:border-neutral-400",
  figma:
    "border-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100 focus-visible:border-brand-600",
};
