/**
 * Reusable radio option card with consistent styling.
 * Used throughout export dialogs for selecting options.
 *
 * Accessibility note: This component uses a <label> wrapper that already provides
 * the accessible name for the radio input via its text content (title + description).
 * The ariaLabel prop is exposed for cases where the visible text is insufficient,
 * but in most cases the wrapping label covers naming automatically.
 */

import type { ReactNode } from "react";
import { Radio } from "./Radio";

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
}

export function RadioOptionCard({
  name,
  selected,
  onChange,
  title,
  description,
  badge,
  children,
  alignTop = false,
  ariaLabel,
}: RadioOptionCardProps): JSX.Element {
  const hasChildren = !!children;
  // Align the radio button to the top when the card has expandable content
  // or when explicitly requested, to avoid vertical misalignment with multi-line text.
  const shouldAlignTop = alignTop || hasChildren;

  const cardClassName = [
    "flex",
    shouldAlignTop ? "items-start" : "items-center",
    // 3px left border accent is a brand indicator for the selected state
    "gap-3.5 p-4 rounded border cursor-pointer transition-all duration-150 min-h-[44px] hover:bg-neutral-50",
    selected
      ? "border-neutral-300 border-l-[3px] border-l-brand-600"
      : "border-neutral-200 hover:border-neutral-300",
  ].join(" ");

  return (
    <label className={cardClassName}>
      <div className={shouldAlignTop ? "mt-0.5" : ""}>
        {/*
         * aria-label is only forwarded when explicitly overriding the visible label.
         * The wrapping <label> element already associates the radio with the card's
         * text content (title + description), so aria-label is omitted by default.
         */}
        <Radio
          checked={selected}
          onChange={onChange}
          name={name}
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
}
