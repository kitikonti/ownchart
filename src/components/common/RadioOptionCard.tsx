/**
 * Reusable radio option card with consistent styling.
 * Used throughout export dialogs for selecting options.
 *
 * Accessibility note: This component uses a <label> wrapper that already provides
 * the accessible name for the radio input via its text content (title + description).
 * The ariaLabel prop is exposed for cases where the visible text is insufficient,
 * but in most cases the wrapping label covers naming automatically.
 */

import { memo } from "react";
import type { ReactNode } from "react";
import { Radio } from "./Radio";
import { buildClassNames } from "../../utils/buildClassNames";

export interface RadioOptionCardProps {
  /** Radio group name */
  name: string;
  /** Whether this option is selected */
  selected: boolean;
  /** Called when this option is selected */
  onChange: () => void;
  /** Main label text */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Optional badge (e.g., "100%" for current zoom) */
  badge?: string;
  /** Expandable content shown when selected */
  children?: ReactNode;
  /** Align radio to top (for cards with children) */
  alignTop?: boolean;
  /** Optional aria-label override for the radio input */
  ariaLabel?: string;
  /**
   * Value of the radio input — used for form semantics and correct group behaviour.
   * Defaults to `title` when not provided, ensuring each radio in a group has
   * a distinct value (native radio groups with value="on" cannot be differentiated).
   */
  value?: string;
}

export const RadioOptionCard = memo(function RadioOptionCard({
  name,
  selected,
  onChange,
  title,
  description,
  badge,
  children,
  alignTop = false,
  ariaLabel,
  value,
}: RadioOptionCardProps): JSX.Element {
  const hasChildren = !!children;
  // Align the radio button to the top when the card has expandable content
  // or when explicitly requested, to avoid vertical misalignment with multi-line text.
  const shouldAlignTop = alignTop || hasChildren;

  const cardClassName = buildClassNames(
    "flex",
    shouldAlignTop ? "items-start" : "items-center",
    // border-l-[3px]: 3px left border accent is a brand indicator for the selected state.
    // Arbitrary value intentional — Tailwind's built-in border-l-4 (4px) is too thick,
    // border-l-2 (2px) too subtle; 3px is the design-calibrated accent width.
    // bg-brand-50 on selected provides a non-colour secondary visual cue (WCAG SC 1.4.1).
    "gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px]",
    selected
      ? "border-neutral-300 border-l-[3px] border-l-brand-600 bg-brand-50"
      : "border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
  );

  return (
    // aria-current gives AT and test utilities a structural hook for the selected card,
    // complementing the native radio `checked` state which only signals input-level selection.
    <label
      className={cardClassName}
      aria-current={selected ? "true" : undefined}
    >
      <div className={shouldAlignTop ? "mt-0.5" : ""}>
        {/*
         * aria-label is only forwarded when explicitly overriding the visible label.
         * The wrapping <label> element already associates the radio with the card's
         * text content (title + description), so aria-label is omitted by default.
         *
         * aria-checked is intentionally NOT set here. For native <input type="radio">
         * elements, the browser derives the AT-announced checked state directly from
         * the `checked` DOM property — explicitly adding aria-checked would be
         * redundant and could cause divergence from the native state during re-renders.
         * (Unlike checkboxes, radio inputs have no "mixed" indeterminate state that
         * would require an explicit aria-checked override.)
         */}
        <Radio
          checked={selected}
          onChange={onChange}
          name={name}
          value={value ?? title}
          aria-label={ariaLabel}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900">{title}</span>
          {badge && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        )}
        {selected && children && <div className="mt-4">{children}</div>}
      </div>
    </label>
  );
});
