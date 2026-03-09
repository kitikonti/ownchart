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
  ariaLabel: string;
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
      <ul className="space-y-2.5 list-none p-0 m-0">
        {items.map((item, idx) => (
          <li key={item.key}>
            {idx > 0 && <div className="divider-h-light mb-2.5" />}
            <label className="flex items-center gap-3 cursor-pointer group min-h-[32px]">
              <Checkbox
                checked={item.checked}
                onChange={(checked) => onChange(item.key, checked)}
              />
              <span className="text-sm text-neutral-900">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
