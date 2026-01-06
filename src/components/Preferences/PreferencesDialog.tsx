/**
 * Preferences Dialog component for user settings.
 * Sprint 1.5.9.1: UI Density settings
 * Sprint 1.5.9: Regional settings (date format, first day of week, holiday region)
 */

import { useState, useMemo } from "react";
import { Gear, Monitor, Globe, MagnifyingGlass } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { useUIStore } from "../../store/slices/uiSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import type {
  UiDensity,
  DateFormat,
  FirstDayOfWeek,
} from "../../types/preferences.types";
import {
  holidayService,
  type CountryInfo,
} from "../../services/holidayService";

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
 * Popular countries for quick selection
 */
const POPULAR_COUNTRIES = ["DE", "AT", "CH", "US", "GB", "FR", "IT", "ES"];

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
  const setHolidayRegion = useUserPreferencesStore(
    (state) => state.setHolidayRegion
  );

  // Country search state
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Get available countries
  const allCountries = useMemo<CountryInfo[]>(
    () => holidayService.getAvailableCountries(),
    []
  );

  // Filter countries by search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) {
      // Show popular countries first, then the rest
      const popular = allCountries.filter((c) =>
        POPULAR_COUNTRIES.includes(c.code)
      );
      const others = allCountries.filter(
        (c) => !POPULAR_COUNTRIES.includes(c.code)
      );
      return [...popular, ...others].slice(0, 15);
    }

    const search = countrySearch.toLowerCase();
    return allCountries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search)
      )
      .slice(0, 15);
  }, [allCountries, countrySearch]);

  // Get current country name
  const currentCountryName = useMemo(() => {
    const country = allCountries.find(
      (c) => c.code === preferences.holidayRegion
    );
    return country
      ? `${country.name} (${country.code})`
      : preferences.holidayRegion;
  }, [allCountries, preferences.holidayRegion]);

  const handleDensityChange = (density: UiDensity) => {
    setUiDensity(density);
  };

  const handleDateFormatChange = (format: DateFormat) => {
    setDateFormat(format);
  };

  const handleFirstDayChange = (day: FirstDayOfWeek) => {
    setFirstDayOfWeek(day);
  };

  const handleCountrySelect = (countryCode: string) => {
    setHolidayRegion(countryCode);
    setIsCountryDropdownOpen(false);
    setCountrySearch("");
  };

  const footer = (
    <button
      onClick={closePreferencesDialog}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
    >
      Done
    </button>
  );

  return (
    <Modal
      isOpen={isPreferencesDialogOpen}
      onClose={closePreferencesDialog}
      title="Preferences"
      icon={<Gear size={24} weight="duotone" className="text-blue-600" />}
      footer={footer}
      widthClass="max-w-md"
    >
      <div className="space-y-6">
        {/* Regional Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={20} weight="duotone" className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Regional
            </h3>
          </div>

          {/* Date Format */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-gray-700">
              Date Format
            </legend>
            <div className="flex flex-wrap gap-2">
              {DATE_FORMAT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm
                    ${
                      preferences.dateFormat === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                  <span className="font-medium text-gray-900">
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({option.example})
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* First Day of Week */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-gray-700">
              First Day of Week
            </legend>
            <div className="flex gap-2">
              {FIRST_DAY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm
                    ${
                      preferences.firstDayOfWeek === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                  <span className="font-medium text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Holiday Region */}
          <fieldset className="space-y-3">
            <legend className="block text-sm font-medium text-gray-700">
              Holiday Region
            </legend>
            <div className="relative">
              {/* Country selector button */}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className="font-medium text-gray-900">
                  {currentCountryName}
                </span>
                <MagnifyingGlass size={16} className="text-gray-400" />
              </button>

              {/* Country dropdown */}
              {isCountryDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {/* Search input */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>

                  {/* Country list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country.code)}
                        className={`
                          w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center justify-between
                          ${
                            preferences.holidayRegion === country.code
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-900"
                          }
                        `}
                      >
                        <span>{country.name}</span>
                        <span className="text-xs text-gray-500">
                          {country.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Holidays from this region will be shown in the timeline.
            </p>
          </fieldset>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Appearance Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={20} weight="duotone" className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Appearance
            </h3>
          </div>

          {/* UI Density */}
          <fieldset className="space-y-3">
            <legend className="block text-sm font-medium text-gray-700">
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
                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${
                      preferences.uiDensity === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
                    className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({option.rowsExample})
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Touch device warning for compact mode */}
            {preferences.uiDensity === "compact" && isTouchDevice() && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <span className="text-amber-500">!</span>
                Compact mode may be difficult to use on touch devices.
              </p>
            )}
          </fieldset>
        </div>

        {/* Live Preview indicator */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Changes are applied immediately
          </p>
        </div>
      </div>
    </Modal>
  );
}
