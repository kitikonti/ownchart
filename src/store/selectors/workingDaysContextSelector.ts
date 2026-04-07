/**
 * Single source of truth for building a {@link WorkingDaysContext} from
 * chartSlice. All scheduling-aware code paths (taskSlice, dependencySlice,
 * useTaskBarInteraction, future config-change recalc dialog) call through
 * here so that the holiday-region resolution rule and the WD-mode flag
 * cannot drift between consumers.
 */

import { useChartStore } from "@/store/slices/chartSlice";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";

/**
 * Read the current working-days context from chartSlice. Reads `.getState()`
 * synchronously — call from action handlers, not from React render bodies
 * (use a zustand selector hook there instead).
 */
export function getWorkingDaysContext(): WorkingDaysContext {
  const { workingDaysMode, workingDaysConfig, holidayRegion } =
    useChartStore.getState();
  return {
    enabled: workingDaysMode,
    config: workingDaysConfig,
    // The region is only meaningful when holidays are excluded; otherwise
    // pass `undefined` so the calculator skips the holiday-service path.
    holidayRegion: workingDaysConfig.excludeHolidays
      ? holidayRegion
      : undefined,
  };
}
