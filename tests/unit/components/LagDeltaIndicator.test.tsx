/**
 * Unit tests for LagDeltaIndicator format helpers and rendering.
 *
 * The component is rendered inside a wrapping <svg> so the SVG primitives
 * (rect/text) live in the correct namespace.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  LagDeltaIndicator,
  formatLagDeltaText,
  formatLagValue,
} from "@/components/GanttChart/LagDeltaIndicator";
import type { Dependency, TaskPosition } from "@/types/dependency.types";
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

describe("LagDeltaIndicator render", () => {
  const fromPos: TaskPosition = { x: 100, y: 50, width: 80, height: 20 };
  const toPos: TaskPosition = { x: 300, y: 90, width: 80, height: 20 };
  const taskPositions = new Map<TaskId, TaskPosition>([
    ["a" as TaskId, fromPos],
    ["b" as TaskId, toPos],
  ]);
  const dep: Dependency = {
    id: "dep-1",
    fromTaskId: "a" as TaskId,
    toTaskId: "b" as TaskId,
    type: "FS",
    lag: 0,
    createdAt: "2026-01-01T00:00:00Z",
  };

  function renderIn(svg: React.ReactNode): HTMLElement {
    const { container } = render(<svg>{svg}</svg>);
    return container;
  }

  it("renders the pill with the formatted text", () => {
    const container = renderIn(
      <LagDeltaIndicator
        delta={{ depId: "dep-1", oldLag: 4, newLag: 6 }}
        dependencies={[dep]}
        taskPositions={taskPositions}
        rowHeight={28}
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
      <LagDeltaIndicator
        delta={{ depId: "dep-missing", oldLag: 4, newLag: 6 }}
        dependencies={[dep]}
        taskPositions={taskPositions}
        rowHeight={28}
      />
    );
    expect(
      container.querySelector('[data-testid="lag-delta-indicator"]')
    ).toBeNull();
  });

  it("renders nothing when a task position is missing", () => {
    const container = renderIn(
      <LagDeltaIndicator
        delta={{ depId: "dep-1", oldLag: 4, newLag: 6 }}
        dependencies={[dep]}
        taskPositions={new Map()}
        rowHeight={28}
      />
    );
    expect(
      container.querySelector('[data-testid="lag-delta-indicator"]')
    ).toBeNull();
  });

  it("includes a tooltip describing the lag transition", () => {
    const container = renderIn(
      <LagDeltaIndicator
        delta={{ depId: "dep-1", oldLag: -1, newLag: 3 }}
        dependencies={[dep]}
        taskPositions={taskPositions}
        rowHeight={28}
      />
    );
    const title = container.querySelector(
      '[data-testid="lag-delta-indicator"] title'
    );
    expect(title?.textContent).toBe(
      "Lag will update from \u22121d to 3d"
    );
  });

  it("is pointerEvents=none so the pill doesn't intercept clicks on the arrow", () => {
    const container = renderIn(
      <LagDeltaIndicator
        delta={{ depId: "dep-1", oldLag: 0, newLag: 2 }}
        dependencies={[dep]}
        taskPositions={taskPositions}
        rowHeight={28}
      />
    );
    const indicator = container.querySelector(
      '[data-testid="lag-delta-indicator"]'
    );
    expect(indicator?.getAttribute("pointer-events")).toBe("none");
  });
});
