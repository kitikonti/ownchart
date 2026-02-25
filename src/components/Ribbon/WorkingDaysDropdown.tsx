/**
 * WorkingDaysDropdown - Toolbar dropdown for working days configuration.
 * Replaces the Working Days section from the deleted Chart Settings Dialog.
 */

import { useMemo } from "react";
import { Briefcase } from "@phosphor-icons/react";
import { Checkbox } from "../common/Checkbox";
import { useChartStore } from "../../store/slices/chartSlice";
import { holidayService } from "../../services/holidayService";
import { useDropdown } from "../../hooks/useDropdown";
import { DropdownTrigger } from "../Toolbar/DropdownTrigger";
import { DropdownPanel } from "../Toolbar/DropdownPanel";
import { TOOLBAR } from "../Toolbar/ToolbarPrimitives";
import type { WorkingDaysConfig } from "../../types/preferences.types";

const ICON_SIZE = TOOLBAR.iconSize;
const PANEL_WIDTH = "280px";

type ConfigKey = keyof WorkingDaysConfig;

const EXCLUSION_OPTIONS: { key: ConfigKey; label: string }[] = [
  { key: "excludeSaturday", label: "Exclude Saturdays" },
  { key: "excludeSunday", label: "Exclude Sundays" },
  { key: "excludeHolidays", label: "Exclude Holidays" },
];

interface WorkingDaysDropdownProps {
  labelPriority?: number;
}

export function WorkingDaysDropdown({
  labelPriority,
}: WorkingDaysDropdownProps): JSX.Element {
  const { isOpen, toggle, containerRef } = useDropdown();

  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const setWorkingDaysConfig = useChartStore(
    (state) => state.setWorkingDaysConfig
  );
  const workingDaysMode = useChartStore((state) => state.workingDaysMode);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Get current country name for display
  const currentCountryName = useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    const country = countries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [holidayRegion]);

  const handleConfigChange = (key: ConfigKey, checked: boolean): void => {
    // Store auto-derives workingDaysMode from config
    setWorkingDaysConfig({ [key]: checked });
  };

  const getLabel = (key: ConfigKey, label: string): string =>
    key === "excludeHolidays" ? `${label} (${currentCountryName})` : label;

  return (
    <div ref={containerRef} className="relative">
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={<Briefcase size={ICON_SIZE} weight="light" />}
        label="Working Days"
        aria-label="Working Days"
        title="Working Days configuration"
        isActive={workingDaysMode}
        labelPriority={labelPriority}
      />

      {isOpen && (
        <DropdownPanel width={PANEL_WIDTH}>
          {/* Info text */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Tasks skip non-working days when dragging and in duration
              calculations.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="px-4 py-3 space-y-3">
            {EXCLUSION_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={workingDaysConfig[key]}
                  onChange={(checked) => handleConfigChange(key, checked)}
                  aria-label={label}
                />
                <span className="text-sm text-neutral-700">
                  {getLabel(key, label)}
                </span>
              </label>
            ))}
          </div>
        </DropdownPanel>
      )}
    </div>
  );
}
