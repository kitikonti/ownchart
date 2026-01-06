/**
 * Preferences Dialog component for user settings.
 * Sprint 1.5.9.1: UI Density settings
 * Sprint 1.5.9: Regional settings (date format, first day of week, holiday region)
 */

import { Gear, Monitor, Globe } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { useUIStore } from "../../store/slices/uiSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import type {
  UiDensity,
  DateFormat,
  FirstDayOfWeek,
  WeekNumberingSystem,
} from "../../types/preferences.types";

/**
 * Density option configuration for radio buttons
 */
interface DensityOption {
  value: UiDensity;
  label: string;
  description: string;
  rowsExample: string;
}

const DENSITY_OPTIONS: DensityOption[] = [
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

/**
 * Date format options
 */
interface DateFormatOption {
  value: DateFormat;
  label: string;
  example: string;
}

const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "31/12/2026" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/31/2026" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2026-12-31" },
];

/**
 * First day of week options
 */
interface FirstDayOption {
  value: FirstDayOfWeek;
  label: string;
}

const FIRST_DAY_OPTIONS: FirstDayOption[] = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
];

/**
 * Week numbering system options
 */
interface WeekNumberingOption {
  value: WeekNumberingSystem;
  label: string;
  description: string;
}

const WEEK_NUMBERING_OPTIONS: WeekNumberingOption[] = [
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

/**
 * Detect if device has touch capability
 */
function isTouchDevice(): boolean {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Preferences Dialog component.
 */
export function PreferencesDialog(): JSX.Element | null {
  const { isPreferencesDialogOpen, closePreferencesDialog } = useUIStore();

  // Preferences state
  const preferences = useUserPreferencesStore((state) => state.preferences);
  const setUiDensity = useUserPreferencesStore((state) => state.setUiDensity);
  const setDateFormat = useUserPreferencesStore((state) => state.setDateFormat);
  const setFirstDayOfWeek = useUserPreferencesStore(
    (state) => state.setFirstDayOfWeek
  );
  const setWeekNumberingSystem = useUserPreferencesStore(
    (state) => state.setWeekNumberingSystem
  );

  const handleDensityChange = (density: UiDensity) => {
    setUiDensity(density);
  };

  const handleDateFormatChange = (format: DateFormat) => {
    setDateFormat(format);
  };

  const handleFirstDayChange = (day: FirstDayOfWeek) => {
    setFirstDayOfWeek(day);
  };

  const handleWeekNumberingChange = (system: WeekNumberingSystem) => {
    setWeekNumberingSystem(system);
  };

  const footer = (
    <button
      onClick={closePreferencesDialog}
      className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600 active:bg-slate-800 transition-colors"
    >
      Done
    </button>
  );

  return (
    <Modal
      isOpen={isPreferencesDialogOpen}
      onClose={closePreferencesDialog}
      title="Preferences"
      icon={<Gear size={24} weight="duotone" className="text-slate-500" />}
      footer={footer}
      widthClass="max-w-md"
    >
      <div className="space-y-6">
        {/* Regional Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} weight="duotone" className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Regional
            </h3>
          </div>

          {/* Date Format */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-slate-700">
              Date Format
            </legend>
            <div className="flex flex-wrap gap-2">
              {DATE_FORMAT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all duration-150 text-sm
                    ${
                      preferences.dateFormat === option.value
                        ? "border-slate-500 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="dateFormat"
                    value={option.value}
                    checked={preferences.dateFormat === option.value}
                    onChange={() => handleDateFormatChange(option.value)}
                    className="sr-only"
                  />
                  <span className={`font-medium font-mono text-xs ${preferences.dateFormat === option.value ? "text-slate-800" : "text-slate-700"}`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({option.example})
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* First Day of Week */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-slate-700">
              First Day of Week
            </legend>
            <div className="flex gap-2">
              {FIRST_DAY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all duration-150 text-sm
                    ${
                      preferences.firstDayOfWeek === option.value
                        ? "border-slate-500 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="firstDayOfWeek"
                    value={option.value}
                    checked={preferences.firstDayOfWeek === option.value}
                    onChange={() => handleFirstDayChange(option.value)}
                    className="sr-only"
                  />
                  <span className={`font-medium ${preferences.firstDayOfWeek === option.value ? "text-slate-800" : "text-slate-700"}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Week Numbering System */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-slate-700">
              Week Numbering
            </legend>
            <div className="space-y-2">
              {WEEK_NUMBERING_OPTIONS.map((option) => (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control
                <label
                  key={option.value}
                  htmlFor={`weekNumbering-${option.value}`}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-150
                    ${
                      preferences.weekNumberingSystem === option.value
                        ? "border-slate-500 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <input
                    id={`weekNumbering-${option.value}`}
                    type="radio"
                    name="weekNumbering"
                    value={option.value}
                    checked={preferences.weekNumberingSystem === option.value}
                    onChange={() => handleWeekNumberingChange(option.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${preferences.weekNumberingSystem === option.value ? "text-slate-800" : "text-slate-700"}`}>
                      {option.label}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200" />

        {/* Appearance Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={20} weight="duotone" className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Appearance
            </h3>
          </div>

          {/* UI Density */}
          <fieldset className="space-y-3">
            <legend className="block text-sm font-medium text-slate-700">
              UI Density
            </legend>
            <div
              className="space-y-2"
              role="radiogroup"
              aria-label="UI Density"
            >
              {DENSITY_OPTIONS.map((option) => (
                // eslint-disable-next-line jsx-a11y/label-has-associated-control
                <label
                  key={option.value}
                  htmlFor={`density-${option.value}`}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-150
                    ${
                      preferences.uiDensity === option.value
                        ? "border-slate-500 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }
                  `}
                >
                  <input
                    id={`density-${option.value}`}
                    type="radio"
                    name="density"
                    value={option.value}
                    checked={preferences.uiDensity === option.value}
                    onChange={() => handleDensityChange(option.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${preferences.uiDensity === option.value ? "text-slate-800" : "text-slate-700"}`}>
                        {option.label}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({option.rowsExample})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Touch device warning for compact mode */}
            {preferences.uiDensity === "compact" && isTouchDevice() && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg">
                <span className="text-amber-500 font-bold">!</span>
                Compact mode may be difficult to use on touch devices.
              </p>
            )}
          </fieldset>
        </div>

        {/* Live Preview indicator */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center">
            Changes are applied immediately
          </p>
        </div>
      </div>
    </Modal>
  );
}
