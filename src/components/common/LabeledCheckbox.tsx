/**
 * LabeledCheckbox - Checkbox with title and optional description.
 * Used throughout dialogs for toggle options with explanatory text.
 *
 * Style matches the export dialog's "Transparent background" checkbox pattern.
 */

import { useId } from "react";
import { Checkbox } from "./Checkbox";

export interface LabeledCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Called when the checkbox state changes */
  onChange: (checked: boolean) => void;
  /** Main label text */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Optional ID for the checkbox input (auto-generated if not provided) */
  id?: string;
}

export function LabeledCheckbox({
  checked,
  onChange,
  title,
  description,
  disabled,
  id: providedId,
}: LabeledCheckboxProps): JSX.Element {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3.5 p-4 rounded border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors duration-150 min-h-[44px] ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={title}
      />
      <div className="flex-1">
        <span className="text-sm font-medium text-neutral-900">{title}</span>
        {description && (
          <span className="block text-xs text-neutral-500 mt-0.5">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
