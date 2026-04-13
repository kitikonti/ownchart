/**
 * Unit tests for computeWorkingDaysRecalc — the pure function that computes
 * date adjustments when working-days config changes (#83).
 *
 * Test fixtures derived from test09.ownchart → test09a/b/c.ownchart:
 *   alpha: Mon 2026-05-11 – Tue 2026-05-19  (7 WD under full exclusion)
 *   bravo: Wed 2026-05-20 – Fri 2026-05-29  (7 WD, FS lag=0 from alpha)
 *   charlie: Mon 2026-06-01 – Tue 2026-06-09 (7 WD, FS lag=0 from bravo)
 *   US holidays: Memorial Day = Mon 2026-05-25
 */

import { describe, it, expect, beforeAll } from "vitest";
import { computeWorkingDaysRecalc } from "@/utils/graph/computeWorkingDaysRecalc";
import { holidayService } from "@/services/holidayService";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";
import type { Task } from "@/types/chart.types";
import type { Dependency } from "@/types/dependency.types";
import type { TaskId, HexColor } from "@/types/branded.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let idCounter = 0;

function makeTask(
  overrides: Partial<Task> & { id: string; startDate: string; endDate: string }
): Task {
  return {
    name: `Task ${overrides.id}`,
    duration: 1,
    progress: 0,
    color: "#3b82f6" as HexColor,
    order: idCounter++,
    metadata: {},
    ...overrides,
    id: overrides.id as TaskId,
    parent: overrides.parent as TaskId | undefined,
  };
}

function makeDep(
  from: string,
  to: string,
  type: Dependency["type"] = "FS",
  lag?: number
): Dependency {
  return {
    id: `dep-${from}-${to}`,
    fromTaskId: from as TaskId,
    toTaskId: to as TaskId,
    type,
    lag,
    createdAt: new Date().toISOString(),
  };
}

// --- Contexts matching test09 fixtures ---

/** Base: all checkboxes checked (excludeSat + excludeSun + excludeHolidays) */
const CTX_ALL: WorkingDaysContext = {
  enabled: true,
  config: {
    excludeSaturday: true,
    excludeSunday: true,
    excludeHolidays: true,
  },
  holidayRegion: "US",
};

/** test09a: uncheck Saturday (excludeSun + excludeHolidays only) */
const CTX_NO_SAT: WorkingDaysContext = {
  enabled: true,
  config: {
    excludeSaturday: false,
    excludeSunday: true,
    excludeHolidays: true,
  },
  holidayRegion: "US",
};

/** test09b: uncheck Sunday (excludeHolidays only) */
const CTX_NO_SUN: WorkingDaysContext = {
  enabled: true,
  config: {
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: true,
  },
  holidayRegion: "US",
};

/** test09c: uncheck Holiday → WD mode off entirely */
const CTX_OFF: WorkingDaysContext = {
  enabled: false,
  config: {
    excludeSaturday: false,
    excludeSunday: false,
    excludeHolidays: false,
  },
  holidayRegion: undefined,
};

// --- Fixture tasks (matching test09.ownchart base) ---
const ALPHA = makeTask({
  id: "alpha",
  name: "alpha",
  startDate: "2026-05-11", // Monday
  endDate: "2026-05-19", // Tuesday — 7 WD (skip Sat 5/16, Sun 5/17)
});
const BRAVO = makeTask({
  id: "bravo",
  name: "bravo",
  startDate: "2026-05-20", // Wednesday
  endDate: "2026-05-29", // Friday — 7 WD (skip Sat 5/23, Sun 5/24, Memorial Day 5/25)
});
const CHARLIE = makeTask({
  id: "charlie",
  name: "charlie",
  startDate: "2026-06-01", // Monday
  endDate: "2026-06-09", // Tuesday — 7 WD (skip Sat 6/6, Sun 6/7)
});

const ALL_TASKS = [ALPHA, BRAVO, CHARLIE];
const ALL_DEPS = [makeDep("alpha", "bravo", "FS", 0), makeDep("bravo", "charlie", "FS", 0)];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  holidayService.setRegion("US");
});

// ---------------------------------------------------------------------------
// test09 → test09a: uncheck Saturday
// ---------------------------------------------------------------------------

describe("test09 → test09a: uncheck Saturday", () => {
  it("compresses all three tasks and cascades dependencies", () => {
    const result = computeWorkingDaysRecalc(
      ALL_TASKS,
      ALL_DEPS,
      CTX_NO_SAT,
      CTX_ALL,
      "keep-durations"
    );

    const map = new Map(result.dateAdjustments.map((a) => [a.taskId, a]));

    // alpha: Mon 5/11 – Mon 5/18 (was Tue 5/19, shortened by 1 day)
    expect(map.get("alpha" as TaskId)).toMatchObject({
      newStartDate: "2026-05-11",
      newEndDate: "2026-05-18",
    });

    // bravo: Tue 5/19 – Wed 5/27 (was Wed 5/20 – Fri 5/29)
    expect(map.get("bravo" as TaskId)).toMatchObject({
      newStartDate: "2026-05-19",
      newEndDate: "2026-05-27",
    });

    // charlie: Thu 5/28 – Thu 6/4 (was Mon 6/1 – Tue 6/9)
    expect(map.get("charlie" as TaskId)).toMatchObject({
      newStartDate: "2026-05-28",
      newEndDate: "2026-06-04",
    });
  });
});

// ---------------------------------------------------------------------------
// test09a → test09b: uncheck Sunday
// ---------------------------------------------------------------------------

describe("test09a → test09b: uncheck Sunday", () => {
  it("compresses further and cascades", () => {
    // Start from test09a positions
    const tasksA = [
      makeTask({ id: "alpha", startDate: "2026-05-11", endDate: "2026-05-18" }),
      makeTask({ id: "bravo", startDate: "2026-05-19", endDate: "2026-05-27" }),
      makeTask({
        id: "charlie",
        startDate: "2026-05-28",
        endDate: "2026-06-04",
      }),
    ];

    const result = computeWorkingDaysRecalc(
      tasksA,
      ALL_DEPS,
      CTX_NO_SUN,
      CTX_NO_SAT,
      "keep-durations"
    );

    const map = new Map(result.dateAdjustments.map((a) => [a.taskId, a]));

    // alpha: Mon 5/11 – Sun 5/17 (7 WD in 7 cal days, no excluded days)
    expect(map.get("alpha" as TaskId)).toMatchObject({
      newStartDate: "2026-05-11",
      newEndDate: "2026-05-17",
    });

    // bravo: Mon 5/18 – Sun 5/24
    expect(map.get("bravo" as TaskId)).toMatchObject({
      newStartDate: "2026-05-18",
      newEndDate: "2026-05-24",
    });

    // charlie: Tue 5/26 – Mon 6/1 (skips Memorial Day Mon 5/25)
    expect(map.get("charlie" as TaskId)).toMatchObject({
      newStartDate: "2026-05-26",
      newEndDate: "2026-06-01",
    });
  });
});

// ---------------------------------------------------------------------------
// test09b → test09c: uncheck Holiday (WD mode turns off)
// ---------------------------------------------------------------------------

describe("test09b → test09c: uncheck Holiday (disable WD)", () => {
  it("expands durations back to calendar days and cascades", () => {
    // Start from test09b positions
    const tasksB = [
      makeTask({ id: "alpha", startDate: "2026-05-11", endDate: "2026-05-17" }),
      makeTask({ id: "bravo", startDate: "2026-05-18", endDate: "2026-05-24" }),
      makeTask({
        id: "charlie",
        startDate: "2026-05-26",
        endDate: "2026-06-01",
      }),
    ];

    const result = computeWorkingDaysRecalc(
      tasksB,
      ALL_DEPS,
      CTX_OFF,
      CTX_NO_SUN,
      "keep-durations"
    );

    const map = new Map(result.dateAdjustments.map((a) => [a.taskId, a]));

    // alpha: Mon 5/11 – Sun 5/17 (7 WD under holidays-only = 7 cal, no change)
    // Actually with excludeHolidays only and no holidays in 5/11-5/17: 7 WD = 7 cal. No change.
    // bravo: Mon 5/18 – Sun 5/24 (7 WD = 7 cal, no holidays). No change.
    // charlie: starts Mon 5/25 (was Tue 5/26). Under old config (excludeHolidays),
    //   bravo ends Sun 5/24, FS lag=0 → next non-holiday day = Tue 5/26 (skip Memorial Day).
    //   Under new config (WD off), FS lag=0 → Mon 5/25. charlie: Mon 5/25 – Sun 5/31.
    expect(map.get("charlie" as TaskId)).toMatchObject({
      newStartDate: "2026-05-25",
      newEndDate: "2026-05-31",
    });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("computeWorkingDaysRecalc — edge cases", () => {
  const emptyResult = {
    dateAdjustments: [],
    durationChanges: [],
    lagChanges: [],
  };

  it("returns empty for empty tasks", () => {
    expect(
      computeWorkingDaysRecalc([], [], CTX_NO_SAT, CTX_ALL, "keep-durations")
    ).toEqual(emptyResult);
  });

  it("skips summary tasks", () => {
    const tasks = [
      makeTask({
        id: "S",
        startDate: "2026-05-11",
        endDate: "2026-05-19",
        type: "summary",
      }),
    ];
    expect(
      computeWorkingDaysRecalc(tasks, [], CTX_NO_SAT, CTX_ALL, "keep-durations")
    ).toEqual(emptyResult);
  });

  it("skips milestone tasks", () => {
    const tasks = [
      makeTask({
        id: "M",
        startDate: "2026-05-16",
        endDate: "2026-05-16",
        type: "milestone",
      }),
    ];
    expect(
      computeWorkingDaysRecalc(tasks, [], CTX_NO_SAT, CTX_ALL, "keep-durations")
    ).toEqual(emptyResult);
  });

  it("returns empty when old and new config are identical", () => {
    expect(
      computeWorkingDaysRecalc(
        ALL_TASKS,
        ALL_DEPS,
        CTX_ALL,
        CTX_ALL,
        "keep-durations"
      )
    ).toEqual(emptyResult);
  });
});
