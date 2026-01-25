/**
 * Preferences Dialog component for user settings.
 * Sprint 1.5.9.1: UI Density settings
 * Sprint 1.5.9: Regional settings (date format, first day of week, holiday region)
 */

import { Gear, Monitor, Globe } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { SectionHeader } from "../common/SectionHeader";
import { useUIStore } from "../../store/slices/uiSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import type {
  UiDensity,
  DateFormat,
  FirstDayOfWeek,
  WeekNumberingSystem,
} from "../../types/preferences.types";
import {
  DENSITY_OPTIONS_EXTENDED,
  DATE_FORMAT_OPTIONS_EXTENDED,
  FIRST_DAY_OPTIONS,
  WEEK_NUMBERING_OPTIONS_EXTENDED,
} from "../../config/preferencesOptions";

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
    <Button variant="primary" onClick={closePreferencesDialog}>
      Done
    </Button>
  );

  return (
    <Modal
      isOpen={isPreferencesDialogOpen}
      onClose={closePreferencesDialog}
      title="Preferences"
      icon={<Gear size={24} weight="regular" className="text-brand-600" />}
      footer={footer}
      widthClass="max-w-md"
      headerStyle="figma"
      footerStyle="figma"
    >
      <div className="space-y-6">
        {/* Regional Section */}
        <div>
          <SectionHeader
            title="Regional"
            icon={<Globe size={20} weight="light" />}
          />

          {/* Date Format */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-neutral-700">
              Date Format
            </legend>
            <div className="flex flex-wrap gap-2">
              {DATE_FORMAT_OPTIONS_EXTENDED.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all duration-150 text-sm
                    ${
                      preferences.dateFormat === option.value
                        ? "border-brand-600 bg-brand-50"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
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
                  <span
                    className={`font-medium font-mono text-xs ${preferences.dateFormat === option.value ? "text-neutral-800" : "text-neutral-700"}`}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ({option.example})
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* First Day of Week */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-neutral-700">
              First Day of Week
            </legend>
            <div className="flex gap-2">
              {FIRST_DAY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all duration-150 text-sm
                    ${
                      preferences.firstDayOfWeek === option.value
                        ? "border-brand-600 bg-brand-50"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
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
                  <span
                    className={`font-medium ${preferences.firstDayOfWeek === option.value ? "text-neutral-800" : "text-neutral-700"}`}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Week Numbering System */}
          <fieldset className="space-y-3 mb-4">
            <legend className="block text-sm font-medium text-neutral-700">
              Week Numbering
            </legend>
            <div className="space-y-2">
              {WEEK_NUMBERING_OPTIONS_EXTENDED.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`weekNumbering-${option.value}`}
                  className={`
                    flex items-start gap-3 p-3 rounded border cursor-pointer transition-all duration-150
                    ${
                      preferences.weekNumberingSystem === option.value
                        ? "border-brand-600 bg-brand-50"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
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
                    <span
                      className={`text-sm font-medium ${preferences.weekNumberingSystem === option.value ? "text-neutral-800" : "text-neutral-700"}`}
                    >
                      {option.label}
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Divider */}
        <div className="divider-h" />

        {/* Appearance Section */}
        <div>
          <SectionHeader
            title="Appearance"
            icon={<Monitor size={20} weight="light" />}
          />

          {/* UI Density */}
          <fieldset className="space-y-3">
            <legend className="block text-sm font-medium text-neutral-700">
              UI Density
            </legend>
            <div
              className="space-y-2"
              role="radiogroup"
              aria-label="UI Density"
            >
              {DENSITY_OPTIONS_EXTENDED.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`density-${option.value}`}
                  className={`
                    flex items-start gap-3 p-3 rounded border cursor-pointer transition-all duration-150
                    ${
                      preferences.uiDensity === option.value
                        ? "border-brand-600 bg-brand-50"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
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
                      <span
                        className={`text-sm font-medium ${preferences.uiDensity === option.value ? "text-neutral-800" : "text-neutral-700"}`}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">
                        ({option.rowsExample})
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            {/* Touch device warning for compact mode */}
            {preferences.uiDensity === "compact" && isTouchDevice() && (
              <Alert variant="warning" className="mt-2">
                Compact mode may be difficult to use on touch devices.
              </Alert>
            )}
          </fieldset>
        </div>

        {/* Live Preview indicator */}
        <div className="divider-h" />
        <div className="pt-4">
          <p className="text-xs text-neutral-400 text-center">
            Changes are applied immediately
          </p>
        </div>
      </div>
    </Modal>
  );
}
