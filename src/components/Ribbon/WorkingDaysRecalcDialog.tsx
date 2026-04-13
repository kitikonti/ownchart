/**
 * Dialog shown when changing working-days settings on a project with tasks.
 * Offers two options:
 *   1. Keep positions — durations/lags recalculated, no visual change
 *   2. Keep durations — task bars move, durations/lags stay the same
 *
 * Part of #83 — config-change recalculation.
 */

import { CalendarBlank } from "@phosphor-icons/react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Alert";
import { AdjustmentPreviewTable } from "@/components/Ribbon/AdjustmentPreviewTable";
import type {
  RecalcMode,
  RecalcResult,
} from "@/utils/graph/computeWorkingDaysRecalc";

interface WorkingDaysRecalcDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onPreview: () => void;
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
  previewResult,
  selectedMode,
  onModeChange,
  isAutoSchedulingOff,
  taskCount,
}: WorkingDaysRecalcDialogProps): JSX.Element {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Working Days"
      subtitle="How should existing tasks be adjusted?"
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
        <div
          role="radiogroup"
          aria-label="Recalculation mode"
          className="space-y-3"
        >
          {/* Option 1: Keep positions */}
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
                Keep task positions{" "}
                <span className="text-xs font-normal text-slate-400">
                  (recommended)
                </span>
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Task bars stay where they are. Durations and lags are
                recalculated to match the new calendar.
              </p>
            </div>
          </label>

          {/* Option 2: Keep durations */}
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
                Keep durations & lags
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Numeric values stay the same. Task bars move to reflect the new
                working-day calendar.
              </p>
            </div>
          </label>
        </div>

        {isAutoSchedulingOff && selectedMode === "keep-durations" && (
          <Alert variant="info">
            Auto-scheduling is off. Tasks will be repositioned but dependency
            cascades will not run beyond direct successors.
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

        {previewResult !== null && <PreviewSummary result={previewResult} />}
      </div>
    </Modal>
  );
}

function PreviewSummary({ result }: { result: RecalcResult }): JSX.Element {
  const total =
    result.dateAdjustments.length +
    result.durationChanges.length +
    result.lagChanges.length;

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No changes needed for the current selection.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="text-xs text-slate-600 space-y-0.5">
        {result.dateAdjustments.length > 0 && (
          <li>
            {result.dateAdjustments.length} task
            {result.dateAdjustments.length !== 1 ? "s" : ""} will move
          </li>
        )}
        {result.durationChanges.length > 0 && (
          <li>
            {result.durationChanges.length} task duration
            {result.durationChanges.length !== 1 ? "s" : ""} will change
          </li>
        )}
        {result.lagChanges.length > 0 && (
          <li>
            {result.lagChanges.length} dependency lag
            {result.lagChanges.length !== 1 ? "s" : ""} will change
          </li>
        )}
      </ul>
      {result.dateAdjustments.length > 0 && (
        <AdjustmentPreviewTable adjustments={result.dateAdjustments} />
      )}
    </div>
  );
}
