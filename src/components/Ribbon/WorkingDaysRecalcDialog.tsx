/**
 * Dialog for configuring working-days settings and recalculating tasks.
 *
 * Layout:
 *   1. Checkboxes for exclude Sat / Sun / Holidays
 *   2. Recalculation mode selector (only when tasks exist)
 *   3. Preview table
 *
 * Part of #83 — config-change recalculation.
 */

import { CalendarBlank } from "@phosphor-icons/react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Alert";
import { Checkbox } from "@/components/common/Checkbox";
import { RecalcPreviewTable } from "@/components/Ribbon/RecalcPreviewTable";
import type { WorkingDaysConfig } from "@/types/preferences.types";
import type {
  RecalcMode,
  RecalcResult,
} from "@/utils/graph/computeWorkingDaysRecalc";

type ConfigKey = keyof WorkingDaysConfig;

const EXCLUSION_OPTIONS: { key: ConfigKey; label: string }[] = [
  { key: "excludeSaturday", label: "Exclude Saturdays" },
  { key: "excludeSunday", label: "Exclude Sundays" },
  { key: "excludeHolidays", label: "Exclude Holidays" },
];

interface WorkingDaysRecalcDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onPreview: () => void;
  draftConfig: WorkingDaysConfig;
  onDraftConfigChange: (partial: Partial<WorkingDaysConfig>) => void;
  holidayCountryName: string;
  previewResult: RecalcResult | null;
  selectedMode: RecalcMode;
  onModeChange: (mode: RecalcMode) => void;
  isAutoSchedulingOff: boolean;
  taskCount: number;
}

export function WorkingDaysRecalcDialog({
  isOpen,
  onClose,
  onApply,
  onPreview,
  draftConfig,
  onDraftConfigChange,
  holidayCountryName,
  previewResult,
  selectedMode,
  onModeChange,
  isAutoSchedulingOff,
  taskCount,
}: WorkingDaysRecalcDialogProps): JSX.Element {
  const hasTasks = taskCount > 0;

  const getLabel = (key: ConfigKey, label: string): string =>
    key === "excludeHolidays" ? `${label} (${holidayCountryName})` : label;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Working Days"
      subtitle={
        hasTasks
          ? "Configure working days and choose how tasks are adjusted."
          : "Configure which days are non-working days."
      }
      icon={<CalendarBlank size={20} weight="duotone" />}
      headerStyle="bordered"
      footerStyle="bordered"
      widthClass="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onApply}>
            Apply
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Working days checkboxes */}
        <div>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Tasks skip non-working days when dragging and in duration
            calculations.
          </p>
          <div className="space-y-3">
            {EXCLUSION_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={draftConfig[key]}
                  onChange={(checked) =>
                    onDraftConfigChange({ [key]: checked })
                  }
                  aria-label={getLabel(key, label)}
                />
                <span className="text-sm text-slate-700">
                  {getLabel(key, label)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Recalculation section — only shown when tasks exist */}
        {hasTasks && (
          <>
            <hr className="border-slate-200" />

            <div
              role="radiogroup"
              aria-label="Recalculation mode"
              className="space-y-3"
            >
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                How should existing tasks be adjusted?
              </p>

              {/* Option 1: Keep durations (default) */}
              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="recalc-mode"
                  checked={selectedMode === "keep-durations"}
                  onChange={() => onModeChange("keep-durations")}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">
                    Keep durations & lags{" "}
                    <span className="text-xs font-normal text-slate-400">
                      (recommended)
                    </span>
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Numeric values stay the same. Task bars move to reflect the
                    new working-day calendar.
                  </p>
                </div>
              </label>

              {/* Option 2: Keep positions */}
              <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="recalc-mode"
                  checked={selectedMode === "keep-positions"}
                  onChange={() => onModeChange("keep-positions")}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">
                    Keep task positions
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Task bars stay where they are. Durations and lags are
                    recalculated to match the new calendar.
                  </p>
                </div>
              </label>
            </div>

            {isAutoSchedulingOff && selectedMode === "keep-durations" && (
              <Alert variant="info">
                Auto-scheduling is off. Tasks will be repositioned but
                dependency cascades will not run beyond direct successors.
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {taskCount} task{taskCount !== 1 ? "s" : ""} in project
              </p>
              <Button variant="ghost" size="sm" onClick={onPreview}>
                Preview changes
              </Button>
            </div>

            {previewResult !== null && (
              <RecalcPreviewTable result={previewResult} mode={selectedMode} />
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
