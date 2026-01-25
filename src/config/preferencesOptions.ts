/**
 * Shared preferences options for dropdowns and radio cards.
 * Used by PreferencesDialog, Ribbon, and export dialogs.
 */

import type {
  UiDensity,
  DateFormat,
  FirstDayOfWeek,
  WeekNumberingSystem,
  TaskLabelPosition,
} from "../types/preferences.types";
import type { DropdownOption } from "../components/Toolbar/ToolbarDropdown";

// ─────────────────────────────────────────────────────────────────────────────
// Extended option types for radio cards (with descriptions)
// ─────────────────────────────────────────────────────────────────────────────

export interface DensityOption {
  value: UiDensity;
  label: string;
  description: string;
  rowsExample: string;
}

export interface DateFormatOption {
  value: DateFormat;
  label: string;
  example: string;
}

export interface FirstDayOption {
  value: FirstDayOfWeek;
  label: string;
}

export interface WeekNumberingOption {
  value: WeekNumberingSystem;
  label: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended options (for radio cards in PreferencesDialog)
// ─────────────────────────────────────────────────────────────────────────────

export const DENSITY_OPTIONS_EXTENDED: DensityOption[] = [
  {
    value: "compact",
    label: "Compact",
    description: "Shows more tasks on screen",
    rowsExample: "28px rows",
  },
  {
    value: "normal",
    label: "Normal",
    description: "Balanced view (recommended)",
    rowsExample: "36px rows",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Easier to read, more spacing",
    rowsExample: "44px rows",
  },
];

export const DATE_FORMAT_OPTIONS_EXTENDED: DateFormatOption[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "31/12/2026" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/31/2026" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2026-12-31" },
];

export const FIRST_DAY_OPTIONS: FirstDayOption[] = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
];

export const WEEK_NUMBERING_OPTIONS_EXTENDED: WeekNumberingOption[] = [
  {
    value: "iso",
    label: "ISO 8601",
    description: "Week 1 contains first Thursday (Europe)",
  },
  {
    value: "us",
    label: "US Standard",
    description: "Week 1 contains January 1st",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Simple dropdown options (derived from extended options for single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

export const DENSITY_OPTIONS: DropdownOption<UiDensity>[] =
  DENSITY_OPTIONS_EXTENDED.map(({ value, label }) => ({ value, label }));

export const DATE_FORMAT_OPTIONS: DropdownOption<DateFormat>[] =
  DATE_FORMAT_OPTIONS_EXTENDED.map(({ value, label }) => ({ value, label }));

export const FIRST_DAY_OF_WEEK_OPTIONS: DropdownOption<FirstDayOfWeek>[] =
  FIRST_DAY_OPTIONS.map(({ value, label }) => ({ value, label }));

export const WEEK_NUMBERING_OPTIONS: DropdownOption<WeekNumberingSystem>[] =
  WEEK_NUMBERING_OPTIONS_EXTENDED.map(({ value, label }) => ({ value, label }));

export const LABEL_OPTIONS: DropdownOption<TaskLabelPosition>[] = [
  { value: "before", label: "Before" },
  { value: "inside", label: "Inside" },
  { value: "after", label: "After" },
  { value: "none", label: "None" },
];
