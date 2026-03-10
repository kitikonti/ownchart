/**
 * LabeledCheckbox - Checkbox with title and optional description.
 * Used throughout dialogs for toggle options with explanatory text.
 *
 * Style matches the export dialog's "Transparent background" checkbox pattern.
 *
 * @note This component renders a `<label htmlFor={id}>` wrapping the visible text.
 * Do NOT nest it inside another `<label>` element — HTML does not support nested
 * labels, and browsers will silently break the click association.
 */

import { memo, useId } from "react";
import { Checkbox } from "./Checkbox";
import { buildClassNames } from "../../utils/buildClassNames";

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
  /**
   * Tri-state indeterminate mode — shown as a dash instead of a checkmark.
   * Useful for "select all" controls in hierarchical lists.
   */
  indeterminate?: boolean;
  /** Optional ID for the checkbox input (auto-generated if not provided) */
  id?: string;
}

export const LabeledCheckbox = memo(function LabeledCheckbox({
  checked,
  onChange,
  title,
  description,
  disabled = false,
  indeterminate = false,
  id: providedId,
}: LabeledCheckboxProps): JSX.Element {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <label
      htmlFor={id}
      className={buildClassNames(
        // Focus indication is provided by the inner Checkbox's peer-focus-visible ring —
        // no separate focus style is needed on the label itself.
        "flex items-center gap-3.5 p-4 rounded border border-neutral-200 transition-colors duration-150 min-h-[44px]",
        disabled
          ? // pointer-events-none prevents click-to-focus on the hidden input when
            // disabled — without it the label would still transfer focus to the input
            // even though no change event fires (focus-without-change is confusing UX).
            "opacity-50 cursor-not-allowed pointer-events-none"
          : "hover:bg-neutral-50 cursor-pointer"
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        indeterminate={indeterminate}
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
});
