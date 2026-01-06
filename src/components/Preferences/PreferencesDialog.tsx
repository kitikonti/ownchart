/**
 * Preferences Dialog component for user settings.
 * Sprint 1.5.9.1: UI Density settings
 */

import { Gear, Monitor } from "@phosphor-icons/react";
import { Modal } from "../common/Modal";
import { useUIStore } from "../../store/slices/uiSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import type { UiDensity } from "../../types/preferences.types";

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
  const setUiDensity = useUserPreferencesStore((state) => state.setUiDensity);
  const currentDensity = useUserPreferencesStore(
    (state) => state.preferences.uiDensity
  );

  const handleDensityChange = (density: UiDensity) => {
    setUiDensity(density);
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
                      currentDensity === option.value
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
                    checked={currentDensity === option.value}
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
            {currentDensity === "compact" && isTouchDevice() && (
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
