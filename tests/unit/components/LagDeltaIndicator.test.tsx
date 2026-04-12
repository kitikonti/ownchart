/**
 * Unit tests for LagDeltaIndicator format helpers and rendering.
 *
 * The component is rendered inside a wrapping <svg> so the SVG primitives
 * (rect/text) live in the correct namespace.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  LagDeltaIndicators,
  formatLagDeltaText,
  formatLagValue,
  isDepAffectedByMode,
} from "@/components/GanttChart/LagDeltaIndicator";
import type { LagDeltaAnchor } from "@/components/GanttChart/LagDeltaIndicator";
import type { TaskPosition } from "@/types/dependency.types";
import type { Dependency } from "@/types/dependency.types";
import type { TaskId } from "@/types/branded.types";

describe("formatLagValue", () => {
  it("formats positive lag with the d suffix", () => {
    expect(formatLagValue(4)).toBe("4d");
  });

  it("formats zero", () => {
    expect(formatLagValue(0)).toBe("0d");
  });

  it("uses Unicode minus (not ASCII hyphen) for negative values", () => {
    expect(formatLagValue(-1)).toBe("\u22121d");
    expect(formatLagValue(-12)).toBe("\u221212d");
  });

  it("handles large values without locale separators", () => {
    expect(formatLagValue(1234)).toBe("1234d");
  });
});

describe("formatLagDeltaText", () => {
  it("uses the arrow form Xd → Yd", () => {
    expect(formatLagDeltaText(4, 6)).toBe("4d → 6d");
  });

  it("preserves the Unicode minus on either side", () => {
    expect(formatLagDeltaText(-1, 2)).toBe("\u22121d → 2d");
    expect(formatLagDeltaText(3, -2)).toBe("3d → \u22122d");
  });

  it("renders 0 → 0 (defensive — caller normally short-circuits this)", () => {
    expect(formatLagDeltaText(0, 0)).toBe("0d → 0d");
  });
});

describe("LagDeltaIndicators render", () => {
  const fromPos: TaskPosition = { x: 100, y: 50, width: 80, height: 20 };
  const toPos: TaskPosition = { x: 300, y: 90, width: 80, height: 20 };
  const taskPositions = new Map<TaskId, TaskPosition>([
    ["a" as TaskId, fromPos],
    ["b" as TaskId, toPos],
  ]);
  const dep = {
    id: "dep-1",
    fromTaskId: "a" as TaskId,
    toTaskId: "b" as TaskId,
    type: "FS" as const,
    lag: 0,
    createdAt: "2026-01-01T00:00:00Z",
  };

  // Anchor on task "a" with a preview extending 20px beyond its right edge.
  const anchor: LagDeltaAnchor = {
    taskId: "a" as TaskId,
    previewLeft: 100,
    previewRight: 200,
    mode: "drag",
  };

  function renderIn(svg: React.ReactNode): HTMLElement {
    const { container } = render(<svg>{svg}</svg>);
    return container;
  }

  it("renders the pill with the formatted text", () => {
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: 4, newLag: 6 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={anchor}
      />
    );
    const indicator = container.querySelector(
      '[data-testid="lag-delta-indicator"]'
    );
    expect(indicator).not.toBeNull();
    expect(indicator?.getAttribute("data-dep-id")).toBe("dep-1");
    const text = container.querySelector(
      '[data-testid="lag-delta-indicator"] text'
    );
    expect(text?.textContent).toBe("4d → 6d");
  });

  it("renders nothing when the dep id is missing from dependencies", () => {
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-missing", oldLag: 4, newLag: 6 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={anchor}
      />
    );
    expect(
      container.querySelector('[data-testid="lag-delta-indicator"]')
    ).toBeNull();
  });

  it("renders nothing when the anchor task position is missing", () => {
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: 4, newLag: 6 }]}
        dependencies={[dep]}
        taskPositions={new Map()}
        anchor={anchor}
      />
    );
    expect(
      container.querySelector('[data-testid="lag-delta-indicator"]')
    ).toBeNull();
  });

  it("includes a tooltip describing the lag transition", () => {
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: -1, newLag: 3 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={anchor}
      />
    );
    const title = container.querySelector(
      '[data-testid="lag-delta-indicator"] title'
    );
    expect(title?.textContent).toBe("Lag will update from \u22121d to 3d");
  });

  it("is pointerEvents=none so the pill doesn't intercept clicks on the arrow", () => {
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: 0, newLag: 2 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={anchor}
      />
    );
    const indicator = container.querySelector(
      '[data-testid="lag-delta-indicator"]'
    );
    expect(indicator?.getAttribute("pointer-events")).toBe("none");
  });

  it("renders multiple pills when given multiple deltas", () => {
    const toPos2: TaskPosition = { x: 500, y: 130, width: 80, height: 20 };
    const dep2 = {
      id: "dep-2",
      fromTaskId: "a" as TaskId,
      toTaskId: "c" as TaskId,
      type: "FS" as const,
      lag: 0,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const positions = new Map<TaskId, TaskPosition>([
      ["a" as TaskId, fromPos],
      ["b" as TaskId, toPos],
      ["c" as TaskId, toPos2],
    ]);

    const container = renderIn(
      <LagDeltaIndicators
        deltas={[
          { depId: "dep-1", oldLag: 0, newLag: 2 },
          { depId: "dep-2", oldLag: 1, newLag: 3 },
        ]}
        dependencies={[dep, dep2]}
        taskPositions={positions}
        anchor={anchor}
      />
    );
    const indicators = container.querySelectorAll(
      '[data-testid="lag-delta-indicator"]'
    );
    expect(indicators).toHaveLength(2);
    expect(indicators[0].getAttribute("data-dep-id")).toBe("dep-1");
    expect(indicators[1].getAttribute("data-dep-id")).toBe("dep-2");
  });

  it("positions outgoing-dep pill on the right at the outermost edge", () => {
    // dep has fromTaskId="a" (anchor task) → outgoing → right side.
    // Preview right (200) > task right (180), so pill should anchor at 200 + 8 = 208
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: 0, newLag: 2 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={anchor}
      />
    );
    const rect = container.querySelector(
      '[data-testid="lag-delta-indicator"] rect'
    );
    expect(rect).not.toBeNull();
    const pillX = Number(rect!.getAttribute("x"));
    // outerRight = max(100+80, 200) = 200, pillX = 200 + 22 = 222
    expect(pillX).toBe(222);
  });

  it("positions incoming-dep pill on the left at the outermost edge", () => {
    // dep2 has toTaskId="a" (anchor task) → incoming → left side.
    const dep2 = {
      id: "dep-2",
      fromTaskId: "b" as TaskId,
      toTaskId: "a" as TaskId,
      type: "FS" as const,
      lag: 0,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const leftAnchor: LagDeltaAnchor = {
      taskId: "a" as TaskId,
      previewLeft: 80,
      previewRight: 180,
      mode: "drag",
    };
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-2", oldLag: 0, newLag: 2 }]}
        dependencies={[dep2]}
        taskPositions={taskPositions}
        anchor={leftAnchor}
      />
    );
    const rect = container.querySelector(
      '[data-testid="lag-delta-indicator"] rect'
    );
    expect(rect).not.toBeNull();
    const pillX = Number(rect!.getAttribute("x"));
    const pillWidth = Number(rect!.getAttribute("width"));
    // outerLeft = min(100, 80) = 80, pillX = 80 - 22 - pillWidth
    expect(pillX + pillWidth).toBe(80 - 22);
  });

  it("uses task right edge when task extends beyond preview (shrinking)", () => {
    // Task "a" right edge = 100 + 80 = 180. Preview right = 150 (shrunk).
    const shrinkAnchor: LagDeltaAnchor = {
      taskId: "a" as TaskId,
      previewLeft: 100,
      previewRight: 150,
      mode: "drag",
    };
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: 0, newLag: 2 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={shrinkAnchor}
      />
    );
    const rect = container.querySelector(
      '[data-testid="lag-delta-indicator"] rect'
    );
    const pillX = Number(rect!.getAttribute("x"));
    // outerRight = max(180, 150) = 180, pillX = 180 + 22 = 202
    expect(pillX).toBe(202);
  });

  it("vertically centres the pill on the anchor task row", () => {
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[{ depId: "dep-1", oldLag: 0, newLag: 2 }]}
        dependencies={[dep]}
        taskPositions={taskPositions}
        anchor={anchor}
      />
    );
    const rect = container.querySelector(
      '[data-testid="lag-delta-indicator"] rect'
    );
    const pillY = Number(rect!.getAttribute("y"));
    const pillHeight = Number(rect!.getAttribute("height"));
    // Task "a": y=50, height=20 → center = 60
    // Pill should be centred: pillY = 60 - pillHeight/2
    expect(pillY + pillHeight / 2).toBe(60);
  });

  it("filters pills by mode during resize-right (only end-edge deps)", () => {
    // dep: FS, task "a" is predecessor → uses predecessor END → affected by resize-right ✓
    // dep2: SS, task "a" is predecessor → uses predecessor START → NOT affected by resize-right ✗
    const dep2 = {
      id: "dep-2",
      fromTaskId: "a" as TaskId,
      toTaskId: "b" as TaskId,
      type: "SS" as const,
      lag: 0,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const resizeRightAnchor: LagDeltaAnchor = {
      taskId: "a" as TaskId,
      previewLeft: 100,
      previewRight: 200,
      mode: "resize-right",
    };
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[
          { depId: "dep-1", oldLag: 0, newLag: 2 },
          { depId: "dep-2", oldLag: 0, newLag: 1 },
        ]}
        dependencies={[dep, dep2]}
        taskPositions={taskPositions}
        anchor={resizeRightAnchor}
      />
    );
    const indicators = container.querySelectorAll(
      '[data-testid="lag-delta-indicator"]'
    );
    // Only dep-1 (FS) should render; dep-2 (SS) is filtered out.
    expect(indicators).toHaveLength(1);
    expect(indicators[0].getAttribute("data-dep-id")).toBe("dep-1");
  });

  it("filters pills by mode during resize-left (only start-edge deps)", () => {
    // dep: FS, task "a" is predecessor → uses predecessor END → NOT affected by resize-left ✗
    // dep2: SS, task "a" is predecessor → uses predecessor START → affected by resize-left ✓
    const dep2 = {
      id: "dep-2",
      fromTaskId: "a" as TaskId,
      toTaskId: "b" as TaskId,
      type: "SS" as const,
      lag: 0,
      createdAt: "2026-01-01T00:00:00Z",
    };
    const resizeLeftAnchor: LagDeltaAnchor = {
      taskId: "a" as TaskId,
      previewLeft: 80,
      previewRight: 180,
      mode: "resize-left",
    };
    const container = renderIn(
      <LagDeltaIndicators
        deltas={[
          { depId: "dep-1", oldLag: 0, newLag: 2 },
          { depId: "dep-2", oldLag: 0, newLag: 1 },
        ]}
        dependencies={[dep, dep2]}
        taskPositions={taskPositions}
        anchor={resizeLeftAnchor}
      />
    );
    const indicators = container.querySelectorAll(
      '[data-testid="lag-delta-indicator"]'
    );
    // Only dep-2 (SS) should render; dep-1 (FS) is filtered out.
    expect(indicators).toHaveLength(1);
    expect(indicators[0].getAttribute("data-dep-id")).toBe("dep-2");
  });
});

// ─── isDepAffectedByMode (edge-filtering logic) ────────────────────────────

describe("isDepAffectedByMode", () => {
  const taskA = "a" as TaskId;
  const taskB = "b" as TaskId;

  function makeDep(
    type: Dependency["type"],
    from: TaskId,
    to: TaskId
  ): Dependency {
    return {
      id: `dep-${type}-${from}-${to}`,
      fromTaskId: from,
      toTaskId: to,
      type,
      lag: 0,
      createdAt: "2026-01-01T00:00:00Z",
    };
  }

  it("allows all deps in drag mode regardless of type or role", () => {
    for (const type of ["FS", "SS", "FF", "SF"] as const) {
      expect(
        isDepAffectedByMode(makeDep(type, taskA, taskB), taskA, "drag")
      ).toBe(true);
      expect(
        isDepAffectedByMode(makeDep(type, taskB, taskA), taskA, "drag")
      ).toBe(true);
    }
  });

  // Predecessor role: which dep types use the predecessor's start vs end?
  // FS → end, FF → end, SS → start, SF → start

  describe("anchor is predecessor (fromTaskId)", () => {
    it("resize-right (end changes): allows FS and FF", () => {
      expect(
        isDepAffectedByMode(makeDep("FS", taskA, taskB), taskA, "resize-right")
      ).toBe(true);
      expect(
        isDepAffectedByMode(makeDep("FF", taskA, taskB), taskA, "resize-right")
      ).toBe(true);
    });

    it("resize-right (end changes): blocks SS and SF", () => {
      expect(
        isDepAffectedByMode(makeDep("SS", taskA, taskB), taskA, "resize-right")
      ).toBe(false);
      expect(
        isDepAffectedByMode(makeDep("SF", taskA, taskB), taskA, "resize-right")
      ).toBe(false);
    });

    it("resize-left (start changes): allows SS and SF", () => {
      expect(
        isDepAffectedByMode(makeDep("SS", taskA, taskB), taskA, "resize-left")
      ).toBe(true);
      expect(
        isDepAffectedByMode(makeDep("SF", taskA, taskB), taskA, "resize-left")
      ).toBe(true);
    });

    it("resize-left (start changes): blocks FS and FF", () => {
      expect(
        isDepAffectedByMode(makeDep("FS", taskA, taskB), taskA, "resize-left")
      ).toBe(false);
      expect(
        isDepAffectedByMode(makeDep("FF", taskA, taskB), taskA, "resize-left")
      ).toBe(false);
    });
  });

  // Successor role: which dep types use the successor's start vs end?
  // FS → start, SS → start, FF → end, SF → end

  describe("anchor is successor (toTaskId)", () => {
    it("resize-right (end changes): allows FF and SF", () => {
      expect(
        isDepAffectedByMode(makeDep("FF", taskB, taskA), taskA, "resize-right")
      ).toBe(true);
      expect(
        isDepAffectedByMode(makeDep("SF", taskB, taskA), taskA, "resize-right")
      ).toBe(true);
    });

    it("resize-right (end changes): blocks FS and SS", () => {
      expect(
        isDepAffectedByMode(makeDep("FS", taskB, taskA), taskA, "resize-right")
      ).toBe(false);
      expect(
        isDepAffectedByMode(makeDep("SS", taskB, taskA), taskA, "resize-right")
      ).toBe(false);
    });

    it("resize-left (start changes): allows FS and SS", () => {
      expect(
        isDepAffectedByMode(makeDep("FS", taskB, taskA), taskA, "resize-left")
      ).toBe(true);
      expect(
        isDepAffectedByMode(makeDep("SS", taskB, taskA), taskA, "resize-left")
      ).toBe(true);
    });

    it("resize-left (start changes): blocks FF and SF", () => {
      expect(
        isDepAffectedByMode(makeDep("FF", taskB, taskA), taskA, "resize-left")
      ).toBe(false);
      expect(
        isDepAffectedByMode(makeDep("SF", taskB, taskA), taskA, "resize-left")
      ).toBe(false);
    });
  });
});
