/**
 * Chart Settings Dialog component for project-specific view settings.
 * Sprint 1.5.9: User Preferences & Settings
 *
 * These settings are saved in the .ownchart file and are project-specific.
 */

import { useState, useMemo } from "react";
import {
  Sliders,
  Eye,
  Calendar,
  Briefcase,
  Globe,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { useUIStore } from "../../store/slices/uiSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import type { TaskLabelPosition } from "../../types/preferences.types";
import { holidayService } from "../../services/holidayService";

/**
 * Popular countries to show at the top of the list
 */
const POPULAR_COUNTRIES = [
  "AT",
  "DE",
  "CH",
  "US",
  "GB",
  "FR",
  "ES",
  "IT",
  "NL",
  "BE",
];

/**
 * Task label position options
 */
interface LabelPositionOption {
  value: TaskLabelPosition;
  label: string;
  description: string;
}

const LABEL_POSITION_OPTIONS: LabelPositionOption[] = [
  {
    value: "before",
    label: "Before bar",
    description: "Label appears to the left of the task bar",
  },
  {
    value: "inside",
    label: "Inside bar",
    description:
      "Label appears inside the task bar (not for milestones/summaries)",
  },
  {
    value: "after",
    label: "After bar",
    description: "Label appears to the right of the task bar",
  },
  { value: "none", label: "None", description: "No labels shown in timeline" },
];

/**
 * Chart Settings Dialog component.
 */
export function ChartSettingsDialog(): JSX.Element | null {
  const { isChartSettingsDialogOpen, closeChartSettingsDialog } = useUIStore();

  // Chart store settings
  const showWeekends = useChartStore((state) => state.showWeekends);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);
  const showHolidays = useChartStore((state) => state.showHolidays);
  const showDependencies = useChartStore((state) => state.showDependencies);
  const showProgress = useChartStore((state) => state.showProgress);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);

  // Actions
  const setShowWeekends = useChartStore((state) => state.setShowWeekends);
  const setShowTodayMarker = useChartStore((state) => state.setShowTodayMarker);
  const setShowHolidays = useChartStore((state) => state.setShowHolidays);
  const setShowDependencies = useChartStore(
    (state) => state.setShowDependencies
  );
  const setShowProgress = useChartStore((state) => state.setShowProgress);
  const setTaskLabelPosition = useChartStore(
    (state) => state.setTaskLabelPosition
  );
  const setWorkingDaysMode = useChartStore((state) => state.setWorkingDaysMode);
  const setWorkingDaysConfig = useChartStore(
    (state) => state.setWorkingDaysConfig
  );
  const holidayRegion = useChartStore((state) => state.holidayRegion);
  const setHolidayRegion = useChartStore((state) => state.setHolidayRegion);

  // Country search state
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Get all available countries
  const allCountries = useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    // Sort with popular countries first
    return countries.sort((a, b) => {
      const aPopular = POPULAR_COUNTRIES.indexOf(a.code);
      const bPopular = POPULAR_COUNTRIES.indexOf(b.code);
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      if (aPopular !== -1) return -1;
      if (bPopular !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch) return allCountries;
    const search = countrySearch.toLowerCase();
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.code.toLowerCase().includes(search)
    );
  }, [allCountries, countrySearch]);

  // Get current country name
  const currentCountryName = useMemo(() => {
    const country = allCountries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [allCountries, holidayRegion]);

  const handleCountrySelect = (code: string) => {
    setHolidayRegion(code);
    setIsCountryDropdownOpen(false);
    setCountrySearch("");
  };

  const footer = (
    <button
      onClick={closeChartSettingsDialog}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
    >
      Done
    </button>
  );

  return (
    <Modal
      isOpen={isChartSettingsDialogOpen}
      onClose={closeChartSettingsDialog}
      title="Chart Settings"
      icon={<Sliders size={24} weight="duotone" className="text-blue-600" />}
      footer={footer}
      widthClass="max-w-lg"
    >
      <div className="space-y-6">
        {/* Timeline Display Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Eye size={20} weight="duotone" className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Timeline Display
            </h3>
          </div>

          <div className="space-y-3">
            {/* Show Today Marker */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showTodayMarker}
                onChange={(e) => setShowTodayMarker(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="Show Today Marker"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Show Today Marker
                </span>
                <p className="text-xs text-gray-500">
                  Display a vertical line marking today&apos;s date
                </p>
              </div>
            </label>

            {/* Show Weekend Highlighting */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showWeekends}
                onChange={(e) => setShowWeekends(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="Show Weekend Highlighting"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Show Weekend Highlighting
                </span>
                <p className="text-xs text-gray-500">
                  Highlight Saturday and Sunday columns
                </p>
              </div>
            </label>

            {/* Show Holidays */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHolidays}
                  onChange={(e) => setShowHolidays(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label="Show Holidays"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Show Holidays
                  </span>
                  <p className="text-xs text-gray-500">
                    Highlight public holidays in the timeline
                  </p>
                </div>
              </label>

              {/* Holiday Region Selector */}
              <div className="ml-7">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsCountryDropdownOpen(!isCountryDropdownOpen)
                    }
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {currentCountryName}
                      </span>
                      <span className="text-gray-500">({holidayRegion})</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {isCountryDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                      {/* Search input */}
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <MagnifyingGlass
                            size={16}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search countries..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Country list */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No countries found
                          </div>
                        ) : (
                          filteredCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country.code)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                country.code === holidayRegion
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-900"
                              }`}
                            >
                              <span className="font-medium">
                                {country.name}
                              </span>
                              <span className="text-gray-500">
                                ({country.code})
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Show Dependencies */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showDependencies}
                onChange={(e) => setShowDependencies(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="Show Dependencies"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Show Dependencies
                </span>
                <p className="text-xs text-gray-500">
                  Display dependency arrows between tasks
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Task Display Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} weight="duotone" className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Task Display
            </h3>
          </div>

          <div className="space-y-4">
            {/* Use Progress */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showProgress}
                onChange={(e) => setShowProgress(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="Use Progress"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Use Progress
                </span>
                <p className="text-xs text-gray-500">
                  Enable progress column and progress fill on task bars
                </p>
              </div>
            </label>

            {/* Task Label Position */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-700">
                Task Label Position
              </legend>
              <div className="flex flex-wrap gap-2">
                {LABEL_POSITION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm
                      ${
                        taskLabelPosition === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }
                    `}
                    title={option.description}
                  >
                    <input
                      type="radio"
                      name="taskLabelPosition"
                      value={option.value}
                      checked={taskLabelPosition === option.value}
                      onChange={() => setTaskLabelPosition(option.value)}
                      className="sr-only"
                    />
                    <span className="font-medium text-gray-900">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {taskLabelPosition === "inside" && (
                <p className="text-xs text-amber-600">
                  Note: &quot;Inside&quot; is not available for summary tasks
                  and milestones - they will use &quot;After&quot; instead.
                </p>
              )}
            </fieldset>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Working Days Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={20} weight="duotone" className="text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Working Days
            </h3>
          </div>

          <div className="space-y-4">
            {/* Working Days Mode Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={workingDaysMode}
                onChange={(e) => setWorkingDaysMode(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="Calculate with Working Days Only"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Calculate with Working Days Only
                </span>
                <p className="text-xs text-gray-500">
                  Task durations automatically extend to skip non-working days
                </p>
              </div>
            </label>

            {/* Working Days Configuration */}
            {workingDaysMode && (
              <div className="ml-7 p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Exclude from working days:
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workingDaysConfig.excludeSaturday}
                    onChange={(e) =>
                      setWorkingDaysConfig({
                        excludeSaturday: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Saturdays</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workingDaysConfig.excludeSunday}
                    onChange={(e) =>
                      setWorkingDaysConfig({ excludeSunday: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Sundays</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workingDaysConfig.excludeHolidays}
                    onChange={(e) =>
                      setWorkingDaysConfig({
                        excludeHolidays: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Holidays ({currentCountryName})
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Info note */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            These settings are saved with your project file
          </p>
        </div>
      </div>
    </Modal>
  );
}
