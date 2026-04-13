/**
 * Hook that intercepts working-days config changes to show a recalculation
 * dialog when the project has existing tasks. If the chart is empty, changes
 * are applied silently (no dialog, no undo command — no tasks to revert).
 *
 * Used by both WorkingDaysDropdown and HolidayRegionPopover, which each
 * mount their own instance. Concurrent opens are prevented by the UX (only
 * one dropdown is open at a time), and each instance's dialog is gated on
 * its own `pendingChange` state.
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

interface PendingChange {
  config?: Partial<WorkingDaysConfig>;
  holidayRegion?: string;
}

export interface UseWorkingDaysConfigChangeReturn {
  proposeConfigChange: (config: Partial<WorkingDaysConfig>) => void;
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
  pending: PendingChange,
  currentConfig: WorkingDaysConfig,
  currentRegion: string
): { ctx: WorkingDaysContext; fullConfig: WorkingDaysConfig; region: string } {
  const fullConfig = { ...currentConfig, ...pending.config };
  const region = pending.holidayRegion ?? currentRegion;
  return {
    ctx: {
      enabled: true,
      config: fullConfig,
      holidayRegion: fullConfig.excludeHolidays ? region : undefined,
    },
    fullConfig,
    region,
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
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null
  );
  const [previewResult, setPreviewResult] = useState<RecalcResult | null>(null);
  const [selectedMode, setSelectedMode] =
    useState<RecalcMode>("keep-positions");

  const taskCount = useTaskStore((state) => state.tasks.length);
  const autoScheduling = useChartStore((state) => state.autoScheduling);

  const applySilently = useCallback((pending: PendingChange): void => {
    const chartStore = useChartStore.getState();
    if (pending.config) {
      chartStore.setWorkingDaysConfig(pending.config);
    }
    if (pending.holidayRegion) {
      chartStore.setHolidayRegion(pending.holidayRegion);
    }
  }, []);

  const proposeConfigChange = useCallback(
    (config: Partial<WorkingDaysConfig>): void => {
      const tasks = useTaskStore.getState().tasks;
      const change: PendingChange = { config };
      if (tasks.length === 0) {
        applySilently(change);
        return;
      }
      setPendingChange(change);
      setPreviewResult(null);
      setSelectedMode("keep-positions");
    },
    [applySilently]
  );

  const proposeHolidayRegionChange = useCallback(
    (region: string): void => {
      const tasks = useTaskStore.getState().tasks;
      const change: PendingChange = { holidayRegion: region };
      if (tasks.length === 0) {
        applySilently(change);
        return;
      }
      setPendingChange(change);
      setPreviewResult(null);
      setSelectedMode("keep-positions");
    },
    [applySilently]
  );

  const computePreview = useCallback((): void => {
    if (!pendingChange) return;

    const chartState = useChartStore.getState();
    const tasks = useTaskStore.getState().tasks;
    const deps = useDependencyStore.getState().dependencies;
    const oldCtx = buildOldContext();
    const { ctx, region } = buildNewContext(
      pendingChange,
      chartState.workingDaysConfig,
      chartState.holidayRegion
    );

    if (ctx.holidayRegion) {
      primeHolidayCache(region, chartState.holidayRegion, tasks);
    }

    const result = computeWorkingDaysRecalc(
      tasks,
      deps,
      ctx,
      oldCtx,
      selectedMode
    );
    setPreviewResult(result);
  }, [pendingChange, selectedMode]);

  const applyChange = useCallback((): void => {
    if (!pendingChange) return;

    const chartState = useChartStore.getState();
    const tasks = useTaskStore.getState().tasks;
    const deps = useDependencyStore.getState().dependencies;
    const oldCtx = buildOldContext();
    const { ctx, fullConfig, region } = buildNewContext(
      pendingChange,
      chartState.workingDaysConfig,
      chartState.holidayRegion
    );

    if (ctx.holidayRegion) {
      primeHolidayCache(region, chartState.holidayRegion, tasks);
    }

    // Reuse preview if available, otherwise compute
    const result =
      previewResult ??
      computeWorkingDaysRecalc(tasks, deps, ctx, oldCtx, selectedMode);

    chartState.applyWorkingDaysRecalc({
      newConfig: fullConfig,
      newHolidayRegion: region,
      mode: selectedMode,
      dateAdjustments: result.dateAdjustments,
      durationChanges: result.durationChanges,
      lagChanges: result.lagChanges,
    });

    setPendingChange(null);
    setPreviewResult(null);
  }, [pendingChange, previewResult, selectedMode]);

  const cancelChange = useCallback((): void => {
    setPendingChange(null);
    setPreviewResult(null);
  }, []);

  return {
    proposeConfigChange,
    proposeHolidayRegionChange,
    isDialogOpen: pendingChange !== null,
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
