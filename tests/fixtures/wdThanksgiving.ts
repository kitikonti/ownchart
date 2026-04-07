/**
 * Golden fixture: a US-region project with a task that spans Thanksgiving
 * week 2025 (#82 stage 6).
 *
 * Single source of truth for any test that needs a "realistic working-days
 * scenario with a holiday in the gap". Used today by:
 *   - tests/unit/utils/dateAdjustment.test.ts (holiday-in-gap cases)
 *   - tests/unit/utils/lagDeltaHelpers.test.ts (any future WD pill test)
 *   - future VRT snapshots (Playwright must be run inside Docker per
 *     CLAUDE.md)
 *
 * Why a TS module instead of a checked-in `.ownchart` file: a JSON file
 * would have to be re-validated through the deserializer on every test
 * run, which couples the fixture to the file format's internal field
 * naming. The TS export gives test code the canonical Task / Dependency
 * shape directly, with type-checking, and any test that wants the
 * serialised form can call `serializeToGanttFile(WD_THANKSGIVING.tasks,
 * WD_THANKSGIVING.viewSettings, { dependencies: WD_THANKSGIVING.dependencies })`
 * to get a freshly-serialised payload.
 *
 * Reference week (US holidays):
 *   Mon 2025-11-24
 *   Tue 2025-11-25
 *   Wed 2025-11-26
 *   Thu 2025-11-27 — Thanksgiving (federal holiday)
 *   Fri 2025-11-28 — Day after Thanksgiving (NOT a federal holiday in
 *                    date-holidays' US dataset, but commonly observed)
 *   Sat 2025-11-29
 *   Sun 2025-11-30
 *   Mon 2025-12-01
 */

import type { Task } from "@/types/chart.types";
import type { Dependency } from "@/types/dependency.types";
import type { TaskId, HexColor } from "@/types/branded.types";
import type { WorkingDaysConfig } from "@/types/preferences.types";

const TASK_ID_PRED = "11111111-1111-1111-1111-111111111111" as TaskId;
const TASK_ID_SUCC = "22222222-2222-2222-2222-222222222222" as TaskId;

export const WD_THANKSGIVING_CONFIG: WorkingDaysConfig = {
  excludeSaturday: true,
  excludeSunday: true,
  excludeHolidays: true,
};

export const WD_THANKSGIVING = {
  /** Region for the holiday service. */
  holidayRegion: "US" as const,
  workingDaysMode: true as const,
  workingDaysConfig: WD_THANKSGIVING_CONFIG,

  /**
   * Predecessor: 3-day task ending Wed 2025-11-26 (the day before
   * Thanksgiving). The deliberate choice of an end-of-week-before-holiday
   * predecessor is what makes the FS lag=0wd cascade exercise the
   * holiday-in-gap path: dayAfterPred = Thu 27 (Thanksgiving) → snap to
   * the next working day, which is Fri 28.
   */
  predecessor: {
    id: TASK_ID_PRED,
    name: "Stage A",
    startDate: "2025-11-24",
    endDate: "2025-11-26",
    duration: 3,
    progress: 0,
    color: "#3b82f6" as HexColor,
    order: 0,
    metadata: {},
  } satisfies Task,

  /**
   * Successor: 2-day task initially placed in early December. Its
   * "natural" position is wherever the dependency drives it. The
   * fixture intentionally starts it AT the wrong place so a cascade
   * test can verify it gets moved.
   */
  successor: {
    id: TASK_ID_SUCC,
    name: "Stage B",
    startDate: "2025-12-08",
    endDate: "2025-12-09",
    duration: 2,
    progress: 0,
    color: "#10b981" as HexColor,
    order: 1,
    metadata: {},
  } satisfies Task,

  dependency: {
    id: "33333333-3333-3333-3333-333333333333",
    fromTaskId: TASK_ID_PRED,
    toTaskId: TASK_ID_SUCC,
    type: "FS" as const,
    lag: 0, // working days when WD mode is on
    createdAt: "2025-11-01T00:00:00.000Z",
  } satisfies Dependency,
};

/**
 * Convenience: returns the fixture as the (tasks, dependencies) tuple
 * that most propagation tests want.
 */
export function wdThanksgivingTuple(): {
  tasks: Task[];
  dependencies: Dependency[];
} {
  return {
    tasks: [WD_THANKSGIVING.predecessor, WD_THANKSGIVING.successor],
    dependencies: [WD_THANKSGIVING.dependency],
  };
}
