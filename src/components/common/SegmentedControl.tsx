/**
 * SegmentedControl - Reusable segmented button group for selecting one option.
 * Supports two layouts: inline (horizontal bar) and grid (2D grid of buttons).
 * Includes proper a11y: role="radiogroup", aria-label, type="button", role="radio",
 * aria-checked, focus-visible.
 *
 * Implements the roving-tabindex pattern so arrow keys move between options as
 * required by the ARIA radiogroup specification:
 *  - Inline layout: ArrowLeft / ArrowRight
 *  - Grid layout:   ArrowLeft / ArrowRight / ArrowUp / ArrowDown
 * Only the currently selected option is in the tab order (tabIndex 0); all
 * others are tabIndex -1.
 */

import { memo, useCallback, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface SegmentedControlOption<T extends string = string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon rendered before label */
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  /** Available options */
  options: SegmentedControlOption<T>[];
  /** Currently selected value */
  value: T;
  /** Called when selection changes */
  onChange: (value: T) => void;
  /** Layout mode: "inline" for horizontal bar, "grid" for 2D grid */
  layout?: "inline" | "grid";
  /** Number of columns for grid layout (default: 2) */
  columns?: 2 | 3 | 4;
  /** Accessible label for the group */
  ariaLabel: string;
  /** Whether inline layout should fill container width */
  fullWidth?: boolean;
}

const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const FOCUS_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500";

function SegmentedControlInner<T extends string = string>({
  options,
  value,
  onChange,
  layout = "inline",
  columns = 2,
  ariaLabel,
  fullWidth = false,
}: SegmentedControlProps<T>): JSX.Element {
  // Refs to each radio button — used for programmatic focus in the roving-tabindex pattern.
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Moves focus and selection to the option at `nextIndex`.
  const focusAndSelect = useCallback(
    (nextIndex: number): void => {
      const nextOpt = options[nextIndex];
      if (!nextOpt) return;
      buttonRefs.current[nextIndex]?.focus();
      onChange(nextOpt.value);
    },
    [options, onChange]
  );

  // Arrow-key handler — direction set depends on layout.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number): void => {
      const total = options.length;
      if (layout === "grid") {
        // Grid: left/right move within a row; up/down move between rows.
        if (e.key === "ArrowRight") {
          e.preventDefault();
          focusAndSelect((currentIndex + 1) % total);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          focusAndSelect((currentIndex - 1 + total) % total);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          focusAndSelect(Math.min(currentIndex + columns, total - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          focusAndSelect(Math.max(currentIndex - columns, 0));
        }
      } else {
        // Inline: left/right only.
        if (e.key === "ArrowRight") {
          e.preventDefault();
          focusAndSelect((currentIndex + 1) % total);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          focusAndSelect((currentIndex - 1 + total) % total);
        }
      }
    },
    [options, layout, columns, focusAndSelect]
  );

  if (layout === "grid") {
    // columns is typed as 2|3|4 and defaults to 2 — GRID_COLS always has a match
    const gridCols = GRID_COLS[columns];
    return (
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={`grid ${gridCols} gap-2`}
      >
        {options.map((opt, index) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-colors duration-150 ${FOCUS_CLASSES} focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Inline layout
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`${fullWidth ? "flex" : "inline-flex"} rounded border border-neutral-300 overflow-hidden`}
    >
      {options.map((opt, index) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`${fullWidth ? "flex-1" : ""} flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 ${FOCUS_CLASSES} ${
              index > 0 ? "border-l border-neutral-300" : ""
            } ${
              isSelected
                ? "bg-brand-600 text-white"
                : "bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Memoized export. Cast is required because React.memo loses generic type params;
 * the underlying implementation is unchanged — this only prevents unnecessary
 * re-renders when parent renders with stable props.
 */
export const SegmentedControl = memo(
  SegmentedControlInner
) as typeof SegmentedControlInner;
