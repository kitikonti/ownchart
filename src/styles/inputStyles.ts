/**
 * Shared Tailwind class constants for form input primitives (Radio, Checkbox).
 *
 * Centralised here so that focus-ring and active-scale styles are updated in
 * exactly one place if the design tokens change.
 */

/** Focus ring applied to the visual element via Tailwind's peer modifier. */
export const PEER_FOCUS_RING =
  "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 peer-focus-visible:ring-offset-1";

/** Scale-down animation on the visual element when the native input is active. */
export const PEER_ACTIVE_SCALE = "peer-active:scale-95";

/**
 * Minimum height for option card touch targets — WCAG 2.5.5 requires at least
 * 44×44 CSS pixels for all interactive controls. Shared by RadioOptionCard and
 * LabeledCheckbox so the spec value is updated in exactly one place.
 */
export const OPTION_CARD_MIN_HEIGHT = "min-h-[44px]";

/**
 * Common layout classes shared by RadioOptionCard and LabeledCheckbox.
 * Encodes the standard card chrome: gap, padding, rounded corners, and border.
 */
export const OPTION_CARD_LAYOUT = "gap-3.5 p-4 rounded border";
