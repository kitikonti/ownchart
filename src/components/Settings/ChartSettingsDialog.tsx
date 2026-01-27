/**
 * Chart Settings Dialog component for project-specific view settings.
 * Sprint 1.5.9: User Preferences & Settings
 *
 * These settings are saved in the .ownchart file and are project-specific.
 */

import { useState, useMemo } from "react";
import {
  Sliders,
  GridNine,
  ChartBarHorizontal,
  Briefcase,
  Globe,
  MagnifyingGlass,
  Tag,
} from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { Input } from "../common/Input";
import { SectionHeader } from "../common/SectionHeader";
import { LabeledCheckbox } from "../common/LabeledCheckbox";
import { Checkbox } from "../common/Checkbox";
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

  // Project metadata
  const projectTitle = useChartStore((state) => state.projectTitle);
  const setProjectTitle = useChartStore((state) => state.setProjectTitle);
  const projectAuthor = useChartStore((state) => state.projectAuthor);
  const setProjectAuthor = useChartStore((state) => state.setProjectAuthor);

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
    <Button variant="primary" onClick={closeChartSettingsDialog}>
      Done
    </Button>
  );

  return (
    <Modal
      isOpen={isChartSettingsDialogOpen}
      onClose={closeChartSettingsDialog}
      title="Chart Settings"
      icon={<Sliders size={24} weight="regular" className="text-brand-600" />}
      footer={footer}
      widthClass="max-w-lg"
      headerStyle="figma"
      footerStyle="figma"
    >
      <div className="space-y-6">
        {/* Project Metadata Section */}
        <div>
          <SectionHeader
            title="Project Info"
            icon={<Tag size={20} weight="light" />}
          />

          <div className="space-y-3">
            <div>
              <label
                htmlFor="project-title"
                className="block text-xs text-neutral-500 mb-1"
              >
                Title
              </label>
              <Input
                id="project-title"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project title (used in PDF exports)"
                variant="figma"
              />
            </div>
            <div>
              <label
                htmlFor="project-author"
                className="block text-xs text-neutral-500 mb-1"
              >
                Author
              </label>
              <Input
                id="project-author"
                type="text"
                value={projectAuthor}
                onChange={(e) => setProjectAuthor(e.target.value)}
                placeholder="Your name (used in PDF metadata)"
                variant="figma"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-h" />

        {/* Timeline Display Section */}
        <div>
          <SectionHeader
            title="Timeline Display"
            icon={<GridNine size={20} weight="light" />}
          />

          <div className="space-y-3">
            {/* Show Today Marker */}
            <LabeledCheckbox
              checked={showTodayMarker}
              onChange={setShowTodayMarker}
              title="Show Today Marker"
              description="Display a vertical line marking today's date"
            />

            {/* Show Weekend Highlighting */}
            <LabeledCheckbox
              checked={showWeekends}
              onChange={setShowWeekends}
              title="Show Weekend Highlighting"
              description="Highlight Saturday and Sunday columns"
            />

            {/* Show Holidays */}
            <div className="space-y-2">
              <LabeledCheckbox
                checked={showHolidays}
                onChange={setShowHolidays}
                title="Show Holidays"
                description="Highlight public holidays in the timeline"
              />

              {/* Holiday Region Selector */}
              <div className="ml-7">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsCountryDropdownOpen(!isCountryDropdownOpen)
                    }
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-neutral-200 rounded hover:border-neutral-300 transition-all duration-150 bg-white shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-neutral-500" />
                      <span className="font-medium text-neutral-800">
                        {currentCountryName}
                      </span>
                      <span className="text-neutral-500">
                        ({holidayRegion})
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-neutral-500 transition-transform ${isCountryDropdownOpen ? "rotate-180" : ""}`}
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
                    <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded shadow-lg animate-fade-in">
                      {/* Search input */}
                      <div className="p-2 border-b border-neutral-200">
                        <div className="relative">
                          <MagnifyingGlass
                            size={16}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                          />
                          <Input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search countries..."
                            variant="figma"
                            className="!pl-8 !pr-3 !py-1.5"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Country list */}
                      <div className="max-h-48 overflow-y-auto scrollbar-thin">
                        {filteredCountries.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-neutral-500">
                            No countries found
                          </div>
                        ) : (
                          filteredCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => handleCountrySelect(country.code)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                                country.code === holidayRegion
                                  ? "bg-neutral-100 text-neutral-900"
                                  : "text-neutral-800"
                              }`}
                            >
                              <span className="font-medium">
                                {country.name}
                              </span>
                              <span className="text-neutral-500">
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
            <LabeledCheckbox
              checked={showDependencies}
              onChange={setShowDependencies}
              title="Show Dependencies"
              description="Display dependency arrows between tasks"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="divider-h" />

        {/* Task Display Section */}
        <div>
          <SectionHeader
            title="Task Display"
            icon={<ChartBarHorizontal size={20} weight="light" />}
          />

          <div className="space-y-4">
            {/* Use Progress */}
            <LabeledCheckbox
              checked={showProgress}
              onChange={setShowProgress}
              title="Use Progress"
              description="Enable progress column and progress fill on task bars"
            />

            {/* Task Label Position */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-neutral-700">
                Task Label Position
              </legend>
              <div className="flex flex-wrap gap-2">
                {LABEL_POSITION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all duration-150 text-sm
                      ${
                        taskLabelPosition === option.value
                          ? "border-brand-600 bg-brand-50"
                          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
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
                    <span
                      className={`font-medium ${taskLabelPosition === option.value ? "text-brand-700" : "text-neutral-700"}`}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {taskLabelPosition === "inside" && (
                <Alert variant="warning">
                  Note: &quot;Inside&quot; is not available for summary tasks
                  and milestones - they will use &quot;After&quot; instead.
                </Alert>
              )}
            </fieldset>
          </div>
        </div>

        {/* Divider */}
        <div className="divider-h" />

        {/* Working Days Section */}
        <div>
          <SectionHeader
            title="Working Days"
            icon={<Briefcase size={20} weight="light" />}
          />

          <div className="space-y-4">
            {/* Working Days Mode Toggle */}
            <LabeledCheckbox
              checked={workingDaysMode}
              onChange={setWorkingDaysMode}
              title="Calculate with Working Days Only"
              description="Task durations automatically extend to skip non-working days"
            />

            {/* Working Days Configuration */}
            {workingDaysMode && (
              <div className="ml-7 p-3 bg-neutral-50 rounded space-y-2.5">
                <p className="text-xs font-medium text-neutral-700 mb-2">
                  Exclude from working days:
                </p>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={workingDaysConfig.excludeSaturday}
                    onChange={(checked) =>
                      setWorkingDaysConfig({ excludeSaturday: checked })
                    }
                    aria-label="Exclude Saturdays"
                  />
                  <span className="text-sm text-neutral-700">Saturdays</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={workingDaysConfig.excludeSunday}
                    onChange={(checked) =>
                      setWorkingDaysConfig({ excludeSunday: checked })
                    }
                    aria-label="Exclude Sundays"
                  />
                  <span className="text-sm text-neutral-700">Sundays</span>
                </label>

                {}
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={workingDaysConfig.excludeHolidays}
                    onChange={(checked) =>
                      setWorkingDaysConfig({ excludeHolidays: checked })
                    }
                    aria-label="Exclude Holidays"
                  />
                  <span className="text-sm text-neutral-700">
                    Holidays ({currentCountryName})
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Info note */}
        <div className="divider-h" />
        <div className="pt-4">
          <p className="text-xs text-neutral-400 text-center">
            These settings are saved with your project file
          </p>
        </div>
      </div>
    </Modal>
  );
}
