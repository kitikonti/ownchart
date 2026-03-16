/**
 * Unit tests for useProjectColors hook and related utilities.
 * Covers: color frequency sorting, maxColors clamping, case normalization,
 * empty/null color handling, getAllSwatches output.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useProjectColors } from "@/hooks/useProjectColors";
import {
  getAllSwatches,
  CURATED_SWATCHES,
} from "@/config/colorSwatches";
import type { Task } from "@/types/chart.types";
import { makeTask } from "../helpers/taskFactory";

// ---------------------------------------------------------------------------
// Store mock
// ---------------------------------------------------------------------------

vi.mock("@/store/slices/taskSlice", () => ({
  useTaskStore: vi.fn(),
}));

import { useTaskStore } from "@/store/slices/taskSlice";

function setupTasks(tasks: Task[]): void {
  vi.mocked(useTaskStore).mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ tasks }) as never
  );
}

// ---------------------------------------------------------------------------
// useProjectColors
// ---------------------------------------------------------------------------

describe("useProjectColors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when there are no tasks", () => {
    setupTasks([]);
    const { result } = renderHook(() => useProjectColors());
    expect(result.current).toEqual([]);
  });

  it("returns empty array when no task has a truthy color (empty string guard)", () => {
    // Task.color is HexColor in normal usage, but the hook guards with `if (task.color)`.
    // Use type cast to simulate missing color at runtime (e.g. old file format).
    setupTasks([
      makeTask({ id: "t1", color: "" as never }),
      makeTask({ id: "t2", color: "" as never }),
    ]);
    const { result } = renderHook(() => useProjectColors());
    expect(result.current).toEqual([]);
  });

  it("returns unique colors for a single task", () => {
    setupTasks([makeTask({ id: "t1", color: "#ff0000" })]);
    const { result } = renderHook(() => useProjectColors());
    expect(result.current).toEqual(["#FF0000"]);
  });

  it("normalizes colors to uppercase", () => {
    setupTasks([
      makeTask({ id: "t1", color: "#aabbcc" }),
      makeTask({ id: "t2", color: "#AABBCC" }),
    ]);
    const { result } = renderHook(() => useProjectColors());
    // Both are the same color — should appear once
    expect(result.current).toEqual(["#AABBCC"]);
  });

  it("sorts colors by frequency, most used first", () => {
    setupTasks([
      makeTask({ id: "t1", color: "#FF0000" }),
      makeTask({ id: "t2", color: "#00FF00" }),
      makeTask({ id: "t3", color: "#FF0000" }),
      makeTask({ id: "t4", color: "#0000FF" }),
      makeTask({ id: "t5", color: "#0000FF" }),
      makeTask({ id: "t6", color: "#0000FF" }),
    ]);
    const { result } = renderHook(() => useProjectColors());
    // #0000FF appears 3×, #FF0000 2×, #00FF00 1×
    expect(result.current[0]).toBe("#0000FF");
    expect(result.current[1]).toBe("#FF0000");
    expect(result.current[2]).toBe("#00FF00");
  });

  it("respects maxColors parameter", () => {
    const tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: `t${i}`, color: `#${String(i).padStart(6, "0")}` })
    );
    setupTasks(tasks);

    const { result } = renderHook(() => useProjectColors(5));
    expect(result.current).toHaveLength(5);
  });

  it("uses default maxColors of 12", () => {
    const tasks = Array.from({ length: 20 }, (_, i) =>
      makeTask({ id: `t${i}`, color: `#${String(i).padStart(6, "0")}` })
    );
    setupTasks(tasks);

    const { result } = renderHook(() => useProjectColors());
    expect(result.current.length).toBeLessThanOrEqual(12);
  });

  it("returns all colors when count is below maxColors", () => {
    setupTasks([
      makeTask({ id: "t1", color: "#111111" }),
      makeTask({ id: "t2", color: "#222222" }),
    ]);
    const { result } = renderHook(() => useProjectColors(12));
    expect(result.current).toHaveLength(2);
  });

  it("skips tasks with falsy color values", () => {
    setupTasks([
      makeTask({ id: "t1", color: "#FF0000" }),
      makeTask({ id: "t2", color: "" as never }),
      makeTask({ id: "t3", color: "#FF0000" }),
    ]);
    const { result } = renderHook(() => useProjectColors());
    expect(result.current).toEqual(["#FF0000"]);
  });
});

// ---------------------------------------------------------------------------
// getAllSwatches
// ---------------------------------------------------------------------------

describe("getAllSwatches", () => {
  it("returns a flat array of all curated swatches", () => {
    const result = getAllSwatches();
    const expected = [
      ...CURATED_SWATCHES.blues,
      ...CURATED_SWATCHES.greens,
      ...CURATED_SWATCHES.warm,
      ...CURATED_SWATCHES.grays,
    ];
    expect(result).toEqual(expected);
  });

  it("contains no duplicates", () => {
    const result = getAllSwatches();
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it("returns the correct total count (5 per family × 4 families)", () => {
    expect(getAllSwatches()).toHaveLength(20);
  });

  it("all entries are valid hex color strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const color of getAllSwatches()) {
      expect(color).toMatch(hexPattern);
    }
  });
});
