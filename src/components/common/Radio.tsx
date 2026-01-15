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
 * - Disabled: 50% opacity
 */

export interface RadioProps {
  checked: boolean;
  onChange: () => void;
  name: string;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
}

export function Radio({
  checked,
  onChange,
  name,
  disabled = false,
  "aria-label": ariaLabel,
  id,
}: RadioProps): JSX.Element {
  return (
    <div
      className={`relative inline-flex items-center justify-center w-4 h-4 flex-shrink-0 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      {/* Hidden native input for accessibility - uses 'peer' for sibling styling */}
      <input
        type="radio"
        checked={checked}
        onChange={() => !disabled && onChange()}
        name={name}
        disabled={disabled}
        aria-label={ariaLabel}
        id={id}
        className="peer absolute opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-10"
      />
      {/* Visual radio - Outlook/Fluent style with all states */}
      <div
        className={`
          w-4 h-4 rounded-full flex items-center justify-center
          transition-all duration-150
          ${
            checked
              ? "border-[1.5px] border-brand-600 peer-hover:border-brand-700"
              : "border border-neutral-400 peer-hover:border-neutral-500 peer-hover:bg-neutral-50"
          }
          peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 peer-focus-visible:ring-offset-1
          peer-active:scale-95
        `}
      >
        {/* Inner filled circle when checked */}
        {checked && (
          <div className="w-2 h-2 rounded-full bg-brand-600 transition-colors duration-150" />
        )}
      </div>
    </div>
  );
}
