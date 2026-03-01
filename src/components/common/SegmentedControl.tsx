/**
 * SegmentedControl - Reusable segmented button group for selecting one option.
 * Supports two layouts: inline (horizontal bar) and grid (2D grid of buttons).
 * Includes proper a11y: role="group", aria-label, type="button", focus-visible.
 */

import type { ReactNode } from "react";

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
  columns?: number;
  /** Accessible label for the group */
  ariaLabel: string;
  /** Whether inline layout should fill container width */
  fullWidth?: boolean;
}

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const FOCUS_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-100";

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  layout = "inline",
  columns = 2,
  ariaLabel,
  fullWidth = false,
}: SegmentedControlProps<T>): JSX.Element {
  if (layout === "grid") {
    const gridCols = GRID_COLS[columns] || "grid-cols-2";
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className={`grid ${gridCols} gap-2`}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
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
      role="group"
      aria-label={ariaLabel}
      className={`${fullWidth ? "flex" : "inline-flex"} rounded border border-neutral-300 overflow-hidden`}
    >
      {options.map((opt, index) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
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
