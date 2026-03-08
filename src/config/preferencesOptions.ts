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
import { DENSITY_CONFIG } from "./densityConfig";

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

export interface FirstDayOfWeekOption {
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
    rowsExample: `${DENSITY_CONFIG.compact.rowHeight}px rows`,
  },
  {
    value: "normal",
    label: "Normal",
    description: "Balanced view (recommended)",
    rowsExample: `${DENSITY_CONFIG.normal.rowHeight}px rows`,
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Easier to read, more spacing",
    rowsExample: `${DENSITY_CONFIG.comfortable.rowHeight}px rows`,
  },
];

/**
 * Sentinel date used to build format examples (Dec 31 of a fixed year).
 * Day (31) ≠ month (12) makes DD/MM vs MM/DD ordering unambiguous.
 * The year is specified once here so all examples stay consistent.
 */
const EXAMPLE_DATE = new Date(2026, 11, 31); // Dec 31, 2026

/** Zero-pad a number to two digits. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const exampleDay = pad2(EXAMPLE_DATE.getDate()); // "31"
const exampleMonth = pad2(EXAMPLE_DATE.getMonth() + 1); // "12"
const exampleYear = String(EXAMPLE_DATE.getFullYear()); // "2026"

export const DATE_FORMAT_OPTIONS_EXTENDED: DateFormatOption[] = [
  {
    value: "DD/MM/YYYY",
    label: "DD/MM/YYYY",
    example: `${exampleDay}/${exampleMonth}/${exampleYear}`,
  },
  {
    value: "MM/DD/YYYY",
    label: "MM/DD/YYYY",
    example: `${exampleMonth}/${exampleDay}/${exampleYear}`,
  },
  {
    value: "YYYY-MM-DD",
    label: "YYYY-MM-DD",
    example: `${exampleYear}-${exampleMonth}-${exampleDay}`,
  },
];

export const FIRST_DAY_OF_WEEK_OPTIONS_EXTENDED: FirstDayOfWeekOption[] = [
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
  FIRST_DAY_OF_WEEK_OPTIONS_EXTENDED.map(({ value, label }) => ({
    value,
    label,
  }));

export const WEEK_NUMBERING_OPTIONS: DropdownOption<WeekNumberingSystem>[] =
  WEEK_NUMBERING_OPTIONS_EXTENDED.map(({ value, label }) => ({ value, label }));

// No extended variant needed — task label positions require no descriptions.
export const LABEL_OPTIONS: DropdownOption<TaskLabelPosition>[] = [
  { value: "before", label: "Before" },
  { value: "inside", label: "Inside" },
  { value: "after", label: "After" },
  { value: "none", label: "None" },
];
