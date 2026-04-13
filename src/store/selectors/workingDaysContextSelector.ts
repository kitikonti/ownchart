/**
 * Single source of truth for building a {@link WorkingDaysContext} from
 * chartSlice. All scheduling-aware code paths (taskSlice, dependencySlice,
 * useTaskBarInteraction, config-change recalc dialog) call through here so
 * that the holiday-region resolution rule cannot drift between consumers.
 *
 * Working-day arithmetic is always active — the config (excludeSaturday,
 * excludeSunday, excludeHolidays) defines which days count. When nothing
 * is excluded, every day is a working day (fast-path in the calculator).
 */

import { useChartStore } from "@/store/slices/chartSlice";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";

/**
 * Read the current working-days context from chartSlice. Reads `.getState()`
 * synchronously — call from action handlers, not from React render bodies
 * (use a zustand selector hook there instead).
 */
export function getWorkingDaysContext(): WorkingDaysContext {
  const { workingDaysConfig, holidayRegion } = useChartStore.getState();
  return {
    enabled: true,
    config: workingDaysConfig,
    // The region is only meaningful when holidays are excluded; otherwise
    // pass `undefined` so the calculator skips the holiday-service path.
    holidayRegion: workingDaysConfig.excludeHolidays
      ? holidayRegion
      : undefined,
  };
}
