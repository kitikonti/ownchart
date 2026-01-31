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

export function WorkingDaysDropdown(): JSX.Element {
  const { isOpen, toggle, containerRef } = useDropdown();

  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const setWorkingDaysConfig = useChartStore(
    (state) => state.setWorkingDaysConfig
  );
  const setWorkingDaysMode = useChartStore((state) => state.setWorkingDaysMode);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Derive workingDaysMode from config
  const isAnyExcluded =
    workingDaysConfig.excludeSaturday ||
    workingDaysConfig.excludeSunday ||
    workingDaysConfig.excludeHolidays;

  // Get current country name for display
  const currentCountryName = useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    const country = countries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [holidayRegion]);

  const handleConfigChange = (
    key: "excludeSaturday" | "excludeSunday" | "excludeHolidays",
    checked: boolean
  ): void => {
    const newConfig = { ...workingDaysConfig, [key]: checked };
    setWorkingDaysConfig(newConfig);
    // Derive workingDaysMode: true if any exclusion is checked
    const anyExcluded =
      newConfig.excludeSaturday ||
      newConfig.excludeSunday ||
      newConfig.excludeHolidays;
    setWorkingDaysMode(anyExcluded);
  };

  return (
    <div ref={containerRef} className="relative">
      <DropdownTrigger
        isOpen={isOpen}
        onClick={toggle}
        icon={<Briefcase size={16} weight="light" />}
        label="Working Days"
        aria-label="Working Days"
        title="Working Days configuration"
        isActive={isAnyExcluded}
      />

      {isOpen && (
        <DropdownPanel width="280px">
          {/* Info text */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Tasks skip non-working days when dragging and in duration
              calculations.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="px-4 py-3 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={workingDaysConfig.excludeSaturday}
                onChange={(checked) =>
                  handleConfigChange("excludeSaturday", checked)
                }
                aria-label="Exclude Saturdays"
              />
              <span className="text-sm text-neutral-700">
                Exclude Saturdays
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={workingDaysConfig.excludeSunday}
                onChange={(checked) =>
                  handleConfigChange("excludeSunday", checked)
                }
                aria-label="Exclude Sundays"
              />
              <span className="text-sm text-neutral-700">Exclude Sundays</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={workingDaysConfig.excludeHolidays}
                onChange={(checked) =>
                  handleConfigChange("excludeHolidays", checked)
                }
                aria-label="Exclude Holidays"
              />
              <span className="text-sm text-neutral-700">
                Exclude Holidays ({currentCountryName})
              </span>
            </label>
          </div>
        </DropdownPanel>
      )}
    </div>
  );
}
