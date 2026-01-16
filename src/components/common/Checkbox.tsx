/**
 * Checkbox - Outlook/Fluent UI style checkbox component.
 * Uses hidden native input with styled div for consistent cross-browser appearance.
 *
 * Style: 20x20px, 2px border-radius, blue fill with white checkmark when checked.
 *
 * States:
 * - Unchecked: white bg, neutral border
 * - Unchecked hover: darker border
 * - Checked: brand-600 bg
 * - Checked hover: brand-700 bg
 * - Focus-visible: blue ring (keyboard navigation)
 * - Active: slight scale down
 * - Disabled: 50% opacity
 */

import { Check } from "@phosphor-icons/react";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
  id,
}: CheckboxProps): JSX.Element {
  return (
    <div
      className={`relative inline-flex items-center justify-center w-5 h-5 flex-shrink-0 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {/* Hidden native input for accessibility - uses 'peer' for sibling styling */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        id={id}
        className="peer absolute opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {/* Visual checkbox - Outlook/Fluent style with all states */}
      <div
        className={`
          w-5 h-5 flex items-center justify-center rounded-sm
          transition-all duration-150
          ${
            checked
              ? "bg-brand-600 border border-brand-600 peer-hover:bg-brand-700 peer-hover:border-brand-700"
              : "bg-white border border-neutral-400 peer-hover:border-neutral-500 peer-hover:bg-neutral-50"
          }
          peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 peer-focus-visible:ring-offset-1
          peer-active:scale-95
        `}
      >
        {checked && <Check size={14} weight="bold" className="text-white" />}
      </div>
    </div>
  );
}
