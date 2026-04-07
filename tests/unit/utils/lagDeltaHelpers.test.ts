/**
 * Unit tests for the live lag-delta indicator's pure helper.
 *
 * Covers the selection rule (incoming preferred → outgoing fallback),
 * the predecessor/successor preview swap, the no-op short-circuit, and
 * the empty-deps null path.
 */

import { describe, it, expect } from "vitest";
import { computeLagDeltaForPreview } from "@/utils/lagDeltaHelpers";
import type { Task } from "@/types/chart.types";
import type { Dependency } from "@/types/dependency.types";
import type { TaskId, HexColor } from "@/types/branded.types";
import type { WorkingDaysContext } from "@/utils/workingDaysCalculator";

const CTX_OFF: WorkingDaysContext = {
  enabled: false,
  config: { excludeSaturday: true, excludeSunday: true, excludeHolidays: false },
  holidayRegion: undefined,
};

function makeTask(
  id: string,
  startDate: string,
  endDate: string
): Task {
  return {
    id: id as TaskId,
    name: `Task ${id}`,
    startDate,
    endDate,
    duration: 1,
    progress: 0,
    color: "#3b82f6" as HexColor,
    order: 0,
    metadata: {},
  };
}

function makeDep(
  id: string,
  from: string,
  to: string,
  type: Dependency["type"] = "FS",
  lag = 0
): Dependency {
  return {
    id,
    fromTaskId: from as TaskId,
    toTaskId: to as TaskId,
    type,
    lag,
    createdAt: "2026-01-01T00:00:00Z",
  };
}

describe("computeLagDeltaForPreview", () => {
  // Reference week: Mon 2026-01-05 .. Fri 2026-01-09
  const pred = makeTask("pred", "2026-01-05", "2026-01-09");

  it("returns null when the dragged task has no dependencies", () => {
    const result = computeLagDeltaForPreview(
      "lonely" as TaskId,
      "2026-01-12",
      "2026-01-14",
      [pred],
      [],
      CTX_OFF
    );
    expect(result).toBeNull();
  });

  it("returns null when the would-be lag matches the stored lag (no-op short-circuit)", () => {
    // Successor at Jan 12-14 with FS lag=2 from pred ending Jan 9.
    // Calendar lag from Jan 9 to Jan 12 = 3 - 1 = 2.
    const succ = makeTask("succ", "2026-01-12", "2026-01-14");
    const dep = makeDep("dep-1", "pred", "succ", "FS", 2);
    const result = computeLagDeltaForPreview(
      "succ" as TaskId,
      succ.startDate,
      succ.endDate,
      [pred, succ],
      [dep],
      CTX_OFF
    );
    expect(result).toBeNull();
  });

  it("uses preview position when dragged task is the SUCCESSOR (incoming match)", () => {
    const succ = makeTask("succ", "2026-01-12", "2026-01-14");
    const dep = makeDep("dep-1", "pred", "succ", "FS", 2);
    // Drag the successor to start Jan 14 instead of Jan 12.
    const result = computeLagDeltaForPreview(
      "succ" as TaskId,
      "2026-01-14",
      "2026-01-16",
      [pred, succ],
      [dep],
      CTX_OFF
    );
    // Calendar lag = Jan 14 - Jan 9 - 1 = 4
    expect(result).toEqual({ depId: "dep-1", oldLag: 2, newLag: 4 });
  });

  it("uses preview position when dragged task is the PREDECESSOR (no incoming, outgoing fallback)", () => {
    const succ = makeTask("succ", "2026-01-12", "2026-01-14");
    const dep = makeDep("dep-1", "pred", "succ", "FS", 2);
    // Drag the predecessor to end one day later: Jan 10 instead of Jan 9.
    const result = computeLagDeltaForPreview(
      "pred" as TaskId,
      "2026-01-06",
      "2026-01-10",
      [pred, succ],
      [dep],
      CTX_OFF
    );
    // Calendar lag = Jan 12 - Jan 10 - 1 = 1
    expect(result).toEqual({ depId: "dep-1", oldLag: 2, newLag: 1 });
  });

  it("prefers incoming over outgoing when the dragged task has both", () => {
    const upstream = makeTask("up", "2026-01-01", "2026-01-03");
    const middle = makeTask("mid", "2026-01-05", "2026-01-07");
    const downstream = makeTask("down", "2026-01-12", "2026-01-14");
    const incoming = makeDep("dep-incoming", "up", "mid", "FS", 1);
    const outgoing = makeDep("dep-outgoing", "mid", "down", "FS", 4);
    // Drag the middle task to start Jan 06 (1 day later).
    const result = computeLagDeltaForPreview(
      "mid" as TaskId,
      "2026-01-06",
      "2026-01-08",
      [upstream, middle, downstream],
      [incoming, outgoing],
      CTX_OFF
    );
    // Should pick the incoming dep (`dep-incoming`), not the outgoing one.
    expect(result?.depId).toBe("dep-incoming");
  });

  it("returns null when predecessor task can't be resolved", () => {
    const succ = makeTask("succ", "2026-01-12", "2026-01-14");
    const dep = makeDep("dep-1", "missing", "succ", "FS", 0);
    const result = computeLagDeltaForPreview(
      "succ" as TaskId,
      "2026-01-15",
      "2026-01-17",
      [succ], // pred missing from tasks list
      [dep],
      CTX_OFF
    );
    expect(result).toBeNull();
  });

  it("works in WD mode (uses working-day arithmetic)", () => {
    const succ = makeTask("succ", "2026-01-12", "2026-01-14");
    const dep = makeDep("dep-1", "pred", "succ", "FS", 0);
    const wdCtx: WorkingDaysContext = { ...CTX_OFF, enabled: true };
    // Drag successor from Mon Jan 12 to Tue Jan 13.
    // WD lag from pred ending Fri 9: lag=0 anchor is Mon 12.
    // Successor at Jan 13 → 1 working day past anchor → lag=+1wd.
    const result = computeLagDeltaForPreview(
      "succ" as TaskId,
      "2026-01-13",
      "2026-01-15",
      [makeTask("pred", "2026-01-05", "2026-01-09"), succ],
      [dep],
      wdCtx
    );
    expect(result).toEqual({ depId: "dep-1", oldLag: 0, newLag: 1 });
  });
});
