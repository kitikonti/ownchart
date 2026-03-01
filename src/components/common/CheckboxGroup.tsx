/**
 * Checkbox group with dividers between items.
 * Used in export dialogs for column and timeline option selection.
 */

import { Checkbox } from "./Checkbox";

export interface CheckboxGroupItem {
  key: string;
  label: string;
  checked: boolean;
}

export interface CheckboxGroupProps {
  /** Items to display */
  items: CheckboxGroupItem[];
  /** Called when an item is toggled */
  onChange: (key: string, checked: boolean) => void;
  /** Accessible label for the group — announced by screen readers as the group name */
  ariaLabel?: string;
}

export function CheckboxGroup({
  items,
  onChange,
  ariaLabel,
}: CheckboxGroupProps): JSX.Element {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="bg-white border border-neutral-200 rounded p-3"
    >
      <div className="space-y-2.5">
        {items.map((item, idx, arr) => (
          <div key={item.key}>
            <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
              <Checkbox
                checked={item.checked}
                onChange={(checked) => onChange(item.key, checked)}
              />
              <span className="text-sm text-neutral-900">{item.label}</span>
            </label>
            {idx < arr.length - 1 && <div className="divider-h-light mt-2.5" />}
          </div>
        ))}
      </div>
    </div>
  );
}
