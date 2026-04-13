/**
 * WorkingDaysButton - Toolbar button that opens the Working Days config dialog.
 * Replaces the old WorkingDaysDropdown that had inline checkboxes.
 */

import { useMemo } from "react";
import { Briefcase } from "@phosphor-icons/react";
import { useChartStore } from "@/store/slices/chartSlice";
import { holidayService } from "@/services/holidayService";
import { useWorkingDaysConfigChange } from "@/hooks/useWorkingDaysConfigChange";
import { ToolbarButton } from "@/components/Toolbar/ToolbarPrimitives";
import { WorkingDaysRecalcDialog } from "@/components/Ribbon/WorkingDaysRecalcDialog";
import { TOOLBAR } from "@/styles/design-tokens";

const ICON_SIZE = TOOLBAR.iconSize;

interface WorkingDaysButtonProps {
  labelPriority?: number;
}

export function WorkingDaysButton({
  labelPriority,
}: WorkingDaysButtonProps): JSX.Element {
  const {
    openConfigDialog,
    draftConfig,
    updateDraftConfig,
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

  const currentCountryName = useMemo(() => {
    const countries = holidayService.getAvailableCountries();
    const country = countries.find((c) => c.code === holidayRegion);
    return country?.name || holidayRegion;
  }, [holidayRegion]);

  const isActive =
    workingDaysConfig.excludeSaturday ||
    workingDaysConfig.excludeSunday ||
    workingDaysConfig.excludeHolidays;

  return (
    <>
      <ToolbarButton
        onClick={openConfigDialog}
        icon={<Briefcase size={ICON_SIZE} weight="light" />}
        label="Working Days"
        aria-label="Working Days"
        title="Working Days configuration"
        isActive={isActive}
        variant={isActive ? "toggle" : "default"}
        labelPriority={labelPriority}
      />

      {draftConfig && (
        <WorkingDaysRecalcDialog
          isOpen={isDialogOpen}
          onClose={cancelChange}
          onApply={applyChange}
          onPreview={computePreview}
          draftConfig={draftConfig}
          onDraftConfigChange={updateDraftConfig}
          holidayCountryName={currentCountryName}
          previewResult={previewResult}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          isAutoSchedulingOff={isAutoSchedulingOff}
          taskCount={taskCount}
        />
      )}
    </>
  );
}
