/**
 * Checkbox - Outlook/Fluent UI style checkbox component.
 * Uses hidden native input with styled div for consistent cross-browser appearance.
 *
 * Style: 20x20px, 2px border-radius (rounded-sm at 16px root), blue fill with white checkmark when checked.
 *
 * States:
 * - Unchecked: white bg, neutral border
 * - Unchecked hover: darker border
 * - Checked: brand-600 bg
 * - Checked hover: brand-700 bg
 * - Indeterminate: brand-600 bg with horizontal dash (same as checked style)
 * - Focus-visible: blue ring (keyboard navigation)
 * - Active: slight scale down
 * - Disabled: 50% opacity, no hover/active effects
 */

import { memo, useLayoutEffect, useRef } from "react";
import { Check, Minus } from "@phosphor-icons/react";
import { buildClassNames } from "../../utils/buildClassNames";
import { PEER_FOCUS_RING, PEER_ACTIVE_SCALE } from "../../styles/inputStyles";

export interface CheckboxProps {
  checked: boolean;
  /**
   * Called with the new checked state when the user interacts with the checkbox.
   *
   * **Indeterminate transition**: When the checkbox is in the indeterminate state and
   * the user clicks it, browsers consistently transition to `checked=true` (i.e. `onChange`
   * is called with `true`). Callers that manage an indeterminate "select all" control
   * should reset `indeterminate` to `false` inside this handler.
   *
   * **Performance note**: If the parent component re-renders frequently, wrap this
   * callback in `useCallback` to prevent unnecessary re-renders of this memoised component.
   */
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /**
   * Tri-state indeterminate mode — shown as a dash instead of a checkmark.
   * Applied via a ref (cannot be set via JSX attribute).
   * Takes visual precedence over `checked` when true.
   */
  indeterminate?: boolean;
  /**
   * Accessible label for the checkbox input.
   * Required when the component is NOT wrapped in or associated with a `<label>` element.
   * When used inside `LabeledCheckbox` (or a `<label htmlFor={id}>`), the label already
   * provides the accessible name and this prop can be omitted.
   */
  "aria-label"?: string;
  id?: string;
}

export const Checkbox = memo(function Checkbox({
  checked,
  onChange,
  disabled = false,
  indeterminate = false,
  "aria-label": ariaLabel,
  id,
}: CheckboxProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  // The `indeterminate` property can only be set imperatively — it has no HTML attribute.
  // useLayoutEffect (not useEffect) ensures the DOM property is set synchronously before
  // the browser paints, eliminating any one-frame visual inconsistency on initial render
  // when indeterminate=true is passed as the initial prop value.
  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const isCheckedOrIndeterminate = checked || indeterminate;

  const visualClasses = buildClassNames(
    "w-5 h-5 flex items-center justify-center rounded-sm",
    "transition-all duration-150",
    isCheckedOrIndeterminate
      ? [
          "bg-brand-600 border border-brand-600",
          !disabled
            ? "peer-hover:bg-brand-700 peer-hover:border-brand-700"
            : null,
        ]
      : [
          "bg-white border border-neutral-400",
          !disabled
            ? "peer-hover:border-neutral-500 peer-hover:bg-neutral-50"
            : null,
        ],
    PEER_FOCUS_RING,
    !disabled ? PEER_ACTIVE_SCALE : null
  );

  return (
    <div
      className={buildClassNames(
        "relative inline-flex items-center justify-center w-5 h-5 flex-shrink-0",
        // Cursor is driven by the native input (cursor-pointer / disabled:cursor-not-allowed).
        // The wrapper only carries opacity for the disabled state; no cursor class needed here.
        disabled ? "opacity-50" : undefined
      )}
    >
      {/* Hidden native input for accessibility - uses 'peer' for sibling styling.
          Must precede the visual div in source order — peer-* classes require a
          preceding sibling with the 'peer' class (Tailwind peer modifier). */}
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        // aria-checked="mixed" is required to signal the indeterminate state to AT.
        // The DOM `indeterminate` property (set via ref) is not reliably announced as
        // "mixed" by JAWS/NVDA — the explicit aria-checked attribute is more reliable.
        // For true/false states the native `checked` attribute already drives
        // screen-reader announcements; overriding with aria-checked would be redundant
        // and risks diverging from the native state during a re-render cycle.
        aria-checked={indeterminate ? "mixed" : undefined}
        id={id}
        className="peer absolute opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {/* Visual checkbox - Outlook/Fluent style with all states */}
      <div aria-hidden="true" className={visualClasses}>
        {/* 14px icon fits snugly inside the 20×20 checkbox with ~3px padding on each side */}
        {indeterminate && (
          <Minus size={14} weight="bold" className="text-white" />
        )}
        {!indeterminate && checked && (
          <Check size={14} weight="bold" className="text-white" />
        )}
      </div>
    </div>
  );
});
