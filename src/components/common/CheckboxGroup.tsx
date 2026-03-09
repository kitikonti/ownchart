/**
 * Checkbox group with dividers between items.
 * Used in export dialogs for column and timeline option selection.
 */

import { memo, useCallback, useId, type JSX } from "react";
import { Checkbox } from "./Checkbox";

export interface CheckboxGroupItem {
  key: string;
  label: string;
  checked: boolean;
}

export interface CheckboxGroupProps {
  /** Items to display */
  items: CheckboxGroupItem[];
  /**
   * Called when an item is toggled.
   *
   * Pass a stable reference (e.g. via `useCallback`) to avoid unnecessary
   * re-renders of memoized `CheckboxGroupRow` children.
   */
  onChange: (key: string, checked: boolean) => void;
  /** Accessible label for the group — announced by screen readers as the group name */
  ariaLabel: string;
}

interface CheckboxGroupRowProps {
  item: CheckboxGroupItem;
  /** Unique DOM id for the native checkbox input (scoped to this group instance). */
  inputId: string;
  showDivider: boolean;
  onChange: (key: string, checked: boolean) => void;
}

const CheckboxGroupRow = memo(function CheckboxGroupRow({
  item,
  inputId,
  showDivider,
  onChange,
}: CheckboxGroupRowProps): JSX.Element {
  const handleChange = useCallback(
    (checked: boolean): void => onChange(item.key, checked),
    [item.key, onChange]
  );

  return (
    <li>
      {/* divider-h-light: custom utility defined in index.css */}
      {showDivider && <div className="divider-h-light mb-2.5" />}
      {/* Label wraps both elements — the `inputId` on Checkbox provides an explicit
          native <input id> so label association remains valid even if the
          nesting structure changes in future refactors. The id is scoped to the
          group instance via useId() to prevent duplicate-id collisions when
          multiple CheckboxGroups with the same item keys exist in one page. */}
      <label
        htmlFor={inputId}
        className="flex items-center gap-3 cursor-pointer group min-h-[32px]"
      >
        <Checkbox id={inputId} checked={item.checked} onChange={handleChange} />
        <span className="text-sm text-neutral-900">{item.label}</span>
      </label>
    </li>
  );
});

export function CheckboxGroup({
  items,
  onChange,
  ariaLabel,
}: CheckboxGroupProps): JSX.Element {
  // Generate a stable unique prefix so that each group instance produces
  // distinct input IDs — prevents collisions when multiple CheckboxGroups
  // render items with the same keys (e.g. header vs. footer columns).
  const groupId = useId();

  return (
    // <fieldset> provides native group semantics — equivalent to role="group"
    // but with broader screen reader support (especially VoiceOver on iOS).
    // Browser-default fieldset styles (border, padding, min-inline-size) are
    // reset via Tailwind so the visual appearance is unchanged.
    <fieldset className="bg-white border border-neutral-200 rounded p-3 min-w-0">
      {/* sr-only <legend> names the group for assistive technologies,
          replacing the former aria-label on the div. */}
      <legend className="sr-only">{ariaLabel}</legend>
      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <CheckboxGroupRow
            key={item.key}
            item={item}
            inputId={`${groupId}-${item.key}`}
            // Positional divider: first item has no top divider, all others do.
            // Note: if items are reordered dynamically, derive showDivider from
            // item identity rather than array index to avoid misplaced dividers.
            showDivider={idx > 0}
            onChange={onChange}
          />
        ))}
      </ul>
    </fieldset>
  );
}
