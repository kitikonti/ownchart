/**
 * WorkingDaysDropdown - Toolbar dropdown for working days configuration.
 * Replaces the Working Days section from the deleted Chart Settings Dialog.
 */

import { useCallback, useMemo } from "react";
import { Briefcase } from "@phosphor-icons/react";
import { Checkbox } from "@/components/common/Checkbox";
import { useChartStore } from "@/store/slices/chartSlice";
import { holidayService } from "@/services/holidayService";
import { useDropdown } from "@/hooks/useDropdown";
import { useWorkingDaysConfigChange } from "@/hooks/useWorkingDaysConfigChange";
import { DropdownTrigger } from "@/components/Toolbar/DropdownTrigger";
import { DropdownPanel } from "@/components/Toolbar/DropdownPanel";
import { WorkingDaysRecalcDialog } from "@/components/Ribbon/WorkingDaysRecalcDialog";
import { TOOLBAR } from "@/styles/design-tokens";
import type { WorkingDaysConfig } from "@/types/preferences.types";

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
  const { isOpen, toggle, containerRef, triggerRef } = useDropdown();
  const {
    proposeConfigChange,
    isDialogOpen,
    previewResult,
    selectedMode,
    setSelectedMode,
    isAutoSchedulingOff,
    taskCount,
    computePreview,
    applyChange,
    cancelChange,
  } = useWorkingDaysConfigChange();

  const workingDaysConfig = useChartStore((state) => state.workingDaysConfig);
  const holidayRegion = useChartStore((state) => state.holidayRegion);

  // Get current country name for display
  const currentCountryName = useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    const country = countries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [holidayRegion]);

  const handleConfigChange = useCallback(
    (key: ConfigKey, checked: boolean): void => {
      proposeConfigChange({ [key]: checked });
    },
    [proposeConfigChange]
  );

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
        isActive={
          workingDaysConfig.excludeSaturday ||
          workingDaysConfig.excludeSunday ||
          workingDaysConfig.excludeHolidays
        }
        labelPriority={labelPriority}
        triggerRef={triggerRef}
      />

      {isOpen && (
        <DropdownPanel
          width={PANEL_WIDTH}
          role="group"
          aria-label="Working Days configuration"
        >
          {/* Info text */}
          <div className="px-4 py-3 border-b border-slate-300">
            <p className="text-xs text-slate-500 leading-relaxed">
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
                  aria-label={getLabel(key, label)}
                />
                <span className="text-sm text-slate-700">
                  {getLabel(key, label)}
                </span>
              </label>
            ))}
          </div>
        </DropdownPanel>
      )}

      <WorkingDaysRecalcDialog
        isOpen={isDialogOpen}
        onClose={cancelChange}
        onApply={applyChange}
        onPreview={computePreview}
        previewResult={previewResult}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        isAutoSchedulingOff={isAutoSchedulingOff}
        taskCount={taskCount}
      />
    </div>
  );
}
