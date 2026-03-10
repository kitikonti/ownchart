/**
 * Radio - Outlook/Fluent UI style radio button component.
 * Uses hidden native input with styled div for consistent cross-browser appearance.
 *
 * Style: 16x16px circle, blue border with filled blue dot when checked.
 *
 * States:
 * - Unchecked: neutral border
 * - Unchecked hover: darker border, subtle bg
 * - Checked: brand-600 border + inner dot
 * - Checked hover: brand-700 colors
 * - Focus-visible: blue ring (keyboard navigation)
 * - Active: slight scale down
 * - Disabled: 50% opacity, no hover/active effects
 */

import { memo } from "react";

export interface RadioProps {
  checked: boolean;
  onChange: () => void;
  name: string;
  /** Value of the radio input — used for form semantics and correct behaviour in radio groups. */
  value?: string;
  disabled?: boolean;
  /**
   * Accessible label for the radio input.
   * Only needed when the component is NOT wrapped in a `<label>` element.
   * When used inside a `<label>` (e.g. RadioOptionCard), the wrapping label already
   * provides the accessible name — passing aria-label here will override it.
   */
  "aria-label"?: string;
  id?: string;
}

export const Radio = memo(function Radio({
  checked,
  onChange,
  name,
  value,
  disabled = false,
  "aria-label": ariaLabel,
  id,
}: RadioProps): JSX.Element {
  const visualClasses = [
    "w-4 h-4 rounded-full flex items-center justify-center",
    "transition-all duration-150",
    checked
      ? [
          "border-[1.5px] border-brand-600",
          !disabled ? "peer-hover:border-brand-700" : null,
        ]
      : [
          "border border-neutral-400",
          !disabled
            ? "peer-hover:border-neutral-500 peer-hover:bg-neutral-50"
            : null,
        ],
    "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 peer-focus-visible:ring-offset-1",
    !disabled ? "peer-active:scale-95" : null,
  ]
    .flat()
    .filter((c): c is string => c !== null && c !== undefined && c !== "")
    .join(" ");

  return (
    <div
      className={`relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {/* Hidden native input for accessibility - uses 'peer' for sibling styling.
          Must precede the visual div in source order — peer-* classes require a
          preceding sibling with the 'peer' class (Tailwind peer modifier). */}
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        name={name}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        id={id}
        className="peer absolute opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {/* Visual radio - Outlook/Fluent style with all states */}
      <div aria-hidden="true" className={visualClasses}>
        {/* Inner filled circle when checked */}
        {checked && (
          <div className="w-2 h-2 rounded-full bg-brand-600 transition-colors duration-150" />
        )}
      </div>
    </div>
  );
});
