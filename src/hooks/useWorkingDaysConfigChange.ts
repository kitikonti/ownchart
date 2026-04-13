/**
 * Hook that manages working-days config changes via a dialog.
 *
 * The dialog always opens (even with no tasks) so the user can toggle
 * multiple checkboxes before applying. When the project has tasks, a
 * recalculation mode selector and preview are shown.
 *
 * Used by both WorkingDaysButton and HolidayRegionPopover.
 *
 * Part of #83 — config-change recalculation.
 */

import { useCallback, useState } from "react";
import { parseISO } from "date-fns";
import { useChartStore } from "@/store/slices/chartSlice";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { holidayService } from "@/services/holidayService";
import { getDateRange } from "@/utils/dateUtils";
import {
  computeWorkingDaysRecalc,
  type RecalcMode,
  type RecalcResult,
} from "@/utils/graph/computeWorkingDaysRecalc";
import type { Task } from "@/types/chart.types";
import type { WorkingDaysConfig } from "@/types/preferences.types";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";

interface PendingHolidayChange {
  holidayRegion: string;
}

export interface UseWorkingDaysConfigChangeReturn {
  /** Open the config dialog (copies current store config into draft). */
  openConfigDialog: () => void;
  /** Draft config being edited in the dialog (null when dialog closed). */
  draftConfig: WorkingDaysConfig | null;
  /** Update checkbox state within the dialog. */
  updateDraftConfig: (partial: Partial<WorkingDaysConfig>) => void;
  /** Propose a holiday region change (used by HolidayRegionPopover). */
  proposeHolidayRegionChange: (region: string) => void;
  isDialogOpen: boolean;
  previewResult: RecalcResult | null;
  selectedMode: RecalcMode;
  setSelectedMode: (mode: RecalcMode) => void;
  isAutoSchedulingOff: boolean;
  taskCount: number;
  computePreview: () => void;
  applyChange: () => void;
  cancelChange: () => void;
}

function buildNewContext(
  fullConfig: WorkingDaysConfig,
  region: string
): WorkingDaysContext {
  return {
    enabled: true,
    config: fullConfig,
    holidayRegion: fullConfig.excludeHolidays ? region : undefined,
  };
}

function buildOldContext(): WorkingDaysContext {
  const { workingDaysConfig, holidayRegion } = useChartStore.getState();
  return {
    enabled: true,
    config: workingDaysConfig,
    holidayRegion: workingDaysConfig.excludeHolidays
      ? holidayRegion
      : undefined,
  };
}

/** Prime the holiday cache for the new region. */
function primeHolidayCache(
  region: string,
  previousRegion: string,
  tasks: Task[]
): void {
  if (region === previousRegion) return;
  holidayService.setRegion(region);
  if (tasks.length > 0) {
    const range = getDateRange(tasks);
    holidayService.preloadRange(parseISO(range.min), parseISO(range.max));
  }
}

export function useWorkingDaysConfigChange(): UseWorkingDaysConfigChangeReturn {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState<WorkingDaysConfig | null>(
    null
  );
  const [pendingHolidayChange, setPendingHolidayChange] =
    useState<PendingHolidayChange | null>(null);
  const [previewResult, setPreviewResult] = useState<RecalcResult | null>(null);
  const [selectedMode, setSelectedModeRaw] =
    useState<RecalcMode>("keep-durations");

  // Clear stale preview when mode changes
  const setSelectedMode = useCallback((mode: RecalcMode): void => {
    setSelectedModeRaw(mode);
    setPreviewResult(null);
  }, []);

  const taskCount = useTaskStore((state) => state.tasks.length);
  const autoScheduling = useChartStore((state) => state.autoScheduling);

  const openConfigDialog = useCallback((): void => {
    const { workingDaysConfig } = useChartStore.getState();
    setDraftConfig({ ...workingDaysConfig });
    setPendingHolidayChange(null);
    setPreviewResult(null);
    setSelectedModeRaw("keep-durations");
    setDialogOpen(true);
  }, []);

  const updateDraftConfig = useCallback(
    (partial: Partial<WorkingDaysConfig>): void => {
      setDraftConfig((prev) => (prev ? { ...prev, ...partial } : prev));
      setPreviewResult(null);
    },
    []
  );

  const proposeHolidayRegionChange = useCallback((region: string): void => {
    const tasks = useTaskStore.getState().tasks;
    const { workingDaysConfig } = useChartStore.getState();

    if (tasks.length === 0) {
      // Apply silently — no tasks to recalculate
      useChartStore.getState().setHolidayRegion(region);
      return;
    }

    // Open dialog with current config + pending holiday change
    setDraftConfig({ ...workingDaysConfig });
    setPendingHolidayChange({ holidayRegion: region });
    setPreviewResult(null);
    setSelectedModeRaw("keep-durations");
    setDialogOpen(true);
  }, []);

  const computePreview = useCallback((): void => {
    if (!draftConfig) return;

    const chartState = useChartStore.getState();
    const tasks = useTaskStore.getState().tasks;
    const deps = useDependencyStore.getState().dependencies;
    const oldCtx = buildOldContext();
    const region =
      pendingHolidayChange?.holidayRegion ?? chartState.holidayRegion;
    const newCtx = buildNewContext(draftConfig, region);

    if (newCtx.holidayRegion) {
      primeHolidayCache(region, chartState.holidayRegion, tasks);
    }

    const result = computeWorkingDaysRecalc(
      tasks,
      deps,
      newCtx,
      oldCtx,
      selectedMode
    );
    setPreviewResult(result);
  }, [draftConfig, pendingHolidayChange, selectedMode]);

  const applyChange = useCallback((): void => {
    if (!draftConfig) return;

    const chartState = useChartStore.getState();
    const tasks = useTaskStore.getState().tasks;
    const region =
      pendingHolidayChange?.holidayRegion ?? chartState.holidayRegion;

    if (tasks.length === 0) {
      // No tasks — just apply the config directly
      chartState.setWorkingDaysConfig(draftConfig);
      if (pendingHolidayChange) {
        chartState.setHolidayRegion(region);
      }
      setDialogOpen(false);
      setDraftConfig(null);
      setPendingHolidayChange(null);
      setPreviewResult(null);
      return;
    }

    const deps = useDependencyStore.getState().dependencies;
    const oldCtx = buildOldContext();
    const newCtx = buildNewContext(draftConfig, region);

    if (newCtx.holidayRegion) {
      primeHolidayCache(region, chartState.holidayRegion, tasks);
    }

    // Reuse preview if available, otherwise compute
    const result =
      previewResult ??
      computeWorkingDaysRecalc(tasks, deps, newCtx, oldCtx, selectedMode);

    chartState.applyWorkingDaysRecalc({
      newConfig: draftConfig,
      newHolidayRegion: region,
      mode: selectedMode,
      dateAdjustments: result.dateAdjustments,
      durationChanges: result.durationChanges,
      lagChanges: result.lagChanges,
    });

    setDialogOpen(false);
    setDraftConfig(null);
    setPendingHolidayChange(null);
    setPreviewResult(null);
  }, [draftConfig, pendingHolidayChange, previewResult, selectedMode]);

  const cancelChange = useCallback((): void => {
    setDialogOpen(false);
    setDraftConfig(null);
    setPendingHolidayChange(null);
    setPreviewResult(null);
  }, []);

  return {
    openConfigDialog,
    draftConfig,
    updateDraftConfig,
    proposeHolidayRegionChange,
    isDialogOpen: dialogOpen,
    previewResult,
    selectedMode,
    setSelectedMode,
    isAutoSchedulingOff: !autoScheduling,
    taskCount,
    computePreview,
    applyChange,
    cancelChange,
  };
}
