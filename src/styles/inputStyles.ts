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
