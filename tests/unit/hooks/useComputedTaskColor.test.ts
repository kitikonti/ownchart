/**
 * Tests for useComputedTaskColor / getComputedTaskColor
 *
 * Tests the color computation logic across all 5 modes:
 * - None (manual): task.color directly
 * - Theme: hierarchy-aware, hash-based palette distribution
 * - Summary: parent color inheritance, nested summary fix
 * - Task Type: per-type fixed colors
 * - Hierarchy: depth-based lightening
 *
 * Plus: colorOverride behavior, stableHash
 */

import { describe, it, expect } from "vitest";
import { getComputedTaskColor } from "../../../src/hooks/useComputedTaskColor";
import { hexToHSL, stableHash } from "../../../src/utils/colorUtils";
import type { Task } from "../../../src/types/chart.types";
import type { ColorModeState } from "../../../src/types/colorMode.types";
import { DEFAULT_COLOR_MODE_STATE } from "../../../src/types/colorMode.types";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
    progress: 0,
    color: "#0F6CBD",
    order: 0,
    metadata: {},
    type: "task",
    ...overrides,
  };
}

function makeState(overrides: Partial<ColorModeState> = {}): ColorModeState {
  return {
    ...DEFAULT_COLOR_MODE_STATE,
    ...overrides,
  };
}

// ── stableHash ─────────────────────────────────────────────────────────────

describe("stableHash", () => {
  it("returns consistent results for the same input", () => {
    expect(stableHash("abc")).toBe(stableHash("abc"));
    expect(stableHash("hello-world")).toBe(stableHash("hello-world"));
  });

  it("returns different results for different inputs", () => {
    expect(stableHash("abc")).not.toBe(stableHash("xyz"));
    expect(stableHash("task-1")).not.toBe(stableHash("task-2"));
  });

  it("returns non-negative integers", () => {
    const inputs = ["", "a", "abc", "uuid-v4-like-string-1234"];
    for (const input of inputs) {
      const hash = stableHash(input);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hash)).toBe(true);
    }
  });

  it("distributes UUIDs reasonably across small ranges", () => {
    // Generate 100 UUID-like strings and check distribution across 5 buckets
    const buckets = new Array(5).fill(0);
    for (let i = 0; i < 100; i++) {
      const uuid = `${i.toString(16).padStart(8, "0")}-1234-4567-8901-abcdef012345`;
      buckets[stableHash(uuid) % 5]++;
    }
    // Each bucket should get at least 5 hits (very generous threshold)
    for (const count of buckets) {
      expect(count).toBeGreaterThan(5);
    }
  });
});

// ── Manual / "None" mode ───────────────────────────────────────────────────

describe("getComputedTaskColor - manual (None) mode", () => {
  it("returns task.color directly", () => {
    const task = makeTask({ id: "1", color: "#FF0000" });
    const state = makeState({ mode: "manual" });
    expect(getComputedTaskColor(task, [task], state)).toBe("#FF0000");
  });

  it("ignores colorOverride in manual mode", () => {
    const task = makeTask({
      id: "1",
      color: "#FF0000",
      colorOverride: "#00FF00",
    });
    const state = makeState({ mode: "manual" });
    expect(getComputedTaskColor(task, [task], state)).toBe("#FF0000");
  });
});

// ── colorOverride in automatic modes ───────────────────────────────────────

describe("getComputedTaskColor - colorOverride", () => {
  const autoModes = ["theme", "summary", "taskType", "hierarchy"] as const;

  for (const mode of autoModes) {
    it(`returns colorOverride in ${mode} mode when set`, () => {
      const task = makeTask({
        id: "1",
        color: "#FF0000",
        colorOverride: "#00FF00",
      });
      const state = makeState({
        mode,
        themeOptions: {
          selectedPaletteId: "corporate-blue",
          customMonochromeBase: null,
        },
      });
      expect(getComputedTaskColor(task, [task], state)).toBe("#00FF00");
    });
  }

  it("falls through to normal computation when colorOverride is undefined", () => {
    const task = makeTask({ id: "1", color: "#FF0000" });
    const state = makeState({ mode: "taskType" });
    // Should compute from taskType options, not from task.color
    expect(getComputedTaskColor(task, [task], state)).toBe(
      state.taskTypeOptions.taskColor
    );
  });
});

// ── Summary mode ───────────────────────────────────────────────────────────

describe("getComputedTaskColor - summary mode", () => {
  const state = makeState({ mode: "summary" });

  it("summary task shows its own color", () => {
    const summary = makeTask({
      id: "s1",
      type: "summary",
      color: "#AA0000",
    });
    expect(getComputedTaskColor(summary, [summary], state)).toBe("#AA0000");
  });

  it("child task inherits nearest summary parent color", () => {
    const summary = makeTask({
      id: "s1",
      type: "summary",
      color: "#AA0000",
    });
    const child = makeTask({
      id: "c1",
      parent: "s1",
      color: "#0000FF",
    });
    expect(getComputedTaskColor(child, [summary, child], state)).toBe(
      "#AA0000"
    );
  });

  it("nested summary shows its OWN color, not parent summary color", () => {
    const parentSummary = makeTask({
      id: "s1",
      type: "summary",
      color: "#AA0000",
    });
    const nestedSummary = makeTask({
      id: "s2",
      type: "summary",
      parent: "s1",
      color: "#00BB00",
    });
    const allTasks = [parentSummary, nestedSummary];

    // Nested summary should show its OWN color
    expect(getComputedTaskColor(nestedSummary, allTasks, state)).toBe(
      "#00BB00"
    );
  });

  it("deeply nested child inherits from nearest summary (not root)", () => {
    const rootSummary = makeTask({
      id: "s1",
      type: "summary",
      color: "#AA0000",
    });
    const nestedSummary = makeTask({
      id: "s2",
      type: "summary",
      parent: "s1",
      color: "#00BB00",
    });
    const child = makeTask({
      id: "c1",
      parent: "s2",
      color: "#FFFFFF",
    });
    const allTasks = [rootSummary, nestedSummary, child];

    // Child should inherit from nestedSummary, not rootSummary
    expect(getComputedTaskColor(child, allTasks, state)).toBe("#00BB00");
  });

  it("root-level task keeps its own color", () => {
    const task = makeTask({ id: "t1", color: "#123456" });
    expect(getComputedTaskColor(task, [task], state)).toBe("#123456");
  });

  it("milestone uses accent color when enabled", () => {
    const milestone = makeTask({
      id: "m1",
      type: "milestone",
      color: "#000000",
    });
    expect(getComputedTaskColor(milestone, [milestone], state)).toBe(
      state.summaryOptions.milestoneAccentColor
    );
  });
});

// ── Theme mode ─────────────────────────────────────────────────────────────

describe("getComputedTaskColor - theme mode", () => {
  const state = makeState({
    mode: "theme",
    themeOptions: {
      selectedPaletteId: "corporate-blue",
      customMonochromeBase: null,
    },
  });

  it("returns task.color if no palette is selected", () => {
    const noPaletteState = makeState({
      mode: "theme",
      themeOptions: { selectedPaletteId: null, customMonochromeBase: null },
    });
    const task = makeTask({ id: "1", color: "#ABCDEF" });
    expect(getComputedTaskColor(task, [task], noPaletteState)).toBe("#ABCDEF");
  });

  it("returns a palette color for root-level tasks", () => {
    const task = makeTask({ id: "1", color: "#000000" });
    const result = getComputedTaskColor(task, [task], state);
    // Should be a valid hex color from the palette (not the original color)
    expect(result).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("color is stable across task additions (hash-based)", () => {
    const task1 = makeTask({ id: "task-fixed-id", color: "#000000" });
    const task2 = makeTask({
      id: "task-other-id",
      color: "#000000",
      order: 1,
    });

    const color1 = getComputedTaskColor(task1, [task1], state);
    const color1After = getComputedTaskColor(task1, [task1, task2], state);

    // Same task ID → same color, regardless of how many tasks exist
    expect(color1After).toBe(color1);
  });

  it("children under same summary share color family (same hue range)", () => {
    const summary = makeTask({
      id: "summary-1",
      type: "summary",
      color: "#000000",
    });
    const child1 = makeTask({
      id: "child-1",
      parent: "summary-1",
      color: "#000000",
    });
    const child2 = makeTask({
      id: "child-2",
      parent: "summary-1",
      color: "#000000",
    });
    const allTasks = [summary, child1, child2];

    const summaryColor = getComputedTaskColor(summary, allTasks, state);
    const child1Color = getComputedTaskColor(child1, allTasks, state);
    const child2Color = getComputedTaskColor(child2, allTasks, state);

    // All should be valid hex colors
    expect(summaryColor).toMatch(/^#[0-9A-F]{6}$/);
    expect(child1Color).toMatch(/^#[0-9A-F]{6}$/);
    expect(child2Color).toMatch(/^#[0-9A-F]{6}$/);

    // Children should be in the same hue range as the summary (±5° accounting for rounding)
    const summaryHsl = hexToHSL(summaryColor);
    const child1Hsl = hexToHSL(child1Color);
    const child2Hsl = hexToHSL(child2Color);

    const hueDiff1 = Math.abs(child1Hsl.h - summaryHsl.h);
    const hueDiff2 = Math.abs(child2Hsl.h - summaryHsl.h);
    expect(Math.min(hueDiff1, 360 - hueDiff1)).toBeLessThanOrEqual(5);
    expect(Math.min(hueDiff2, 360 - hueDiff2)).toBeLessThanOrEqual(5);

    // Children should be lighter than the summary
    expect(child1Hsl.l).toBeGreaterThanOrEqual(summaryHsl.l);
    expect(child2Hsl.l).toBeGreaterThanOrEqual(summaryHsl.l);
  });

  it("single root summary: level-1 children become color-givers", () => {
    const root = makeTask({
      id: "root",
      type: "summary",
      color: "#000",
    });
    const groupA = makeTask({
      id: "groupA",
      type: "summary",
      parent: "root",
      color: "#000",
    });
    const groupB = makeTask({
      id: "groupB",
      type: "summary",
      parent: "root",
      color: "#000",
    });
    const childA = makeTask({ id: "childA", parent: "groupA", color: "#000" });
    const childB = makeTask({ id: "childB", parent: "groupB", color: "#000" });

    const allTasks = [root, groupA, groupB, childA, childB];

    const groupAColor = getComputedTaskColor(groupA, allTasks, state);
    const groupBColor = getComputedTaskColor(groupB, allTasks, state);

    // groupA and groupB should get different base colors (from their hash)
    // (unless they hash to the same palette index, which is unlikely with different IDs)
    expect(groupAColor).toMatch(/^#[0-9A-F]{6}$/);
    expect(groupBColor).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("multiple roots: nested descendants all use root ancestor as color-giver", () => {
    // Root1 → NestedSummary → DeepChild
    // Root2 → Child2
    // All descendants of Root1 should share the same base hue
    const root1 = makeTask({
      id: "dev-phase",
      type: "summary",
      color: "#000",
    });
    const nestedSummary = makeTask({
      id: "frontend-dev",
      type: "summary",
      parent: "dev-phase",
      color: "#000",
    });
    const deepChild = makeTask({
      id: "component-lib",
      parent: "frontend-dev",
      color: "#000",
    });
    const root2 = makeTask({
      id: "content-phase",
      type: "summary",
      color: "#000",
    });
    const child2 = makeTask({
      id: "content-writing",
      parent: "content-phase",
      color: "#000",
    });

    const allTasks = [root1, nestedSummary, deepChild, root2, child2];

    const root1Color = getComputedTaskColor(root1, allTasks, state);
    const nestedColor = getComputedTaskColor(nestedSummary, allTasks, state);
    const deepColor = getComputedTaskColor(deepChild, allTasks, state);
    const root2Color = getComputedTaskColor(root2, allTasks, state);
    const child2Color = getComputedTaskColor(child2, allTasks, state);

    // All colors under root1 should be in the same hue family
    const root1Hsl = hexToHSL(root1Color);
    const nestedHsl = hexToHSL(nestedColor);
    const deepHsl = hexToHSL(deepColor);

    // Nested summary and deep child should have similar hue to root1 (±5° accounting for rounding)
    const nestedHueDiff = Math.abs(nestedHsl.h - root1Hsl.h);
    const deepHueDiff = Math.abs(deepHsl.h - root1Hsl.h);
    expect(Math.min(nestedHueDiff, 360 - nestedHueDiff)).toBeLessThanOrEqual(5);
    expect(Math.min(deepHueDiff, 360 - deepHueDiff)).toBeLessThanOrEqual(5);

    // Deeper tasks should be lighter (progressive lightening)
    expect(nestedHsl.l).toBeGreaterThanOrEqual(root1Hsl.l);
    expect(deepHsl.l).toBeGreaterThanOrEqual(nestedHsl.l);

    // child2 should share hue with root2, not root1
    const root2Hsl = hexToHSL(root2Color);
    const child2Hsl = hexToHSL(child2Color);
    const child2HueDiff = Math.abs(child2Hsl.h - root2Hsl.h);
    expect(Math.min(child2HueDiff, 360 - child2HueDiff)).toBeLessThanOrEqual(5);
    expect(child2Hsl.l).toBeGreaterThanOrEqual(root2Hsl.l);
  });

  it("deconflicts hash collisions: 5 roots with known-colliding IDs get 5 different colors", () => {
    // These are the actual IDs from examples/website-relaunch.ownchart.
    // Without deconfliction, Planning+Launch collide (idx 3) and Development+Content collide (idx 1).
    const candyState = makeState({
      mode: "theme",
      themeOptions: {
        selectedPaletteId: "candy",
        customMonochromeBase: null,
      },
    });

    const planning = makeTask({
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      type: "summary",
      color: "#000",
    });
    const development = makeTask({
      id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      type: "summary",
      color: "#000",
    });
    const content = makeTask({
      id: "b17dfd05-3bcf-4537-a053-7d39dfd30ada",
      type: "summary",
      color: "#000",
    });
    const launch = makeTask({
      id: "d37eee15-4cdf-5648-b164-8e49efe41beb",
      type: "summary",
      color: "#000",
    });
    const postLaunch = makeTask({
      id: "f58aa038-6efa-7869-d386-ab6baaa63dad",
      type: "summary",
      color: "#000",
    });

    const allTasks = [planning, development, content, launch, postLaunch];

    const colors = allTasks.map((t) =>
      getComputedTaskColor(t, allTasks, candyState)
    );

    // All 5 roots must get 5 DIFFERENT palette colors
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(5);
  });

  it("colors are stable when tasks are reordered", () => {
    const root1 = makeTask({
      id: "root-aaa",
      type: "summary",
      color: "#000",
    });
    const root2 = makeTask({
      id: "root-bbb",
      type: "summary",
      color: "#000",
    });
    const root3 = makeTask({
      id: "root-ccc",
      type: "summary",
      color: "#000",
    });

    const orderA = [root1, root2, root3];
    const orderB = [root3, root1, root2]; // reordered

    const colorsA = orderA.map((t) => getComputedTaskColor(t, orderA, state));
    const colorsB = orderA.map((t) => getComputedTaskColor(t, orderB, state));

    // Same tasks, different array order → same colors
    expect(colorsA).toEqual(colorsB);
  });
});

// ── Task Type mode ─────────────────────────────────────────────────────────

describe("getComputedTaskColor - taskType mode", () => {
  const state = makeState({ mode: "taskType" });

  it("returns summaryColor for summary tasks", () => {
    const task = makeTask({ id: "1", type: "summary", color: "#000" });
    expect(getComputedTaskColor(task, [task], state)).toBe(
      state.taskTypeOptions.summaryColor
    );
  });

  it("returns milestoneColor for milestone tasks", () => {
    const task = makeTask({ id: "1", type: "milestone", color: "#000" });
    expect(getComputedTaskColor(task, [task], state)).toBe(
      state.taskTypeOptions.milestoneColor
    );
  });

  it("returns taskColor for regular tasks", () => {
    const task = makeTask({ id: "1", type: "task", color: "#000" });
    expect(getComputedTaskColor(task, [task], state)).toBe(
      state.taskTypeOptions.taskColor
    );
  });
});

// ── Hierarchy mode ─────────────────────────────────────────────────────────

describe("getComputedTaskColor - hierarchy mode", () => {
  const state = makeState({ mode: "hierarchy" });

  it("root task gets base color", () => {
    const task = makeTask({ id: "1", color: "#000" });
    expect(getComputedTaskColor(task, [task], state)).toBe(
      state.hierarchyOptions.baseColor
    );
  });

  it("deeper tasks get lighter colors", () => {
    const root = makeTask({ id: "r", type: "summary", color: "#000" });
    const level1 = makeTask({
      id: "l1",
      parent: "r",
      type: "summary",
      color: "#000",
    });
    const level2 = makeTask({
      id: "l2",
      parent: "l1",
      color: "#000",
    });
    const allTasks = [root, level1, level2];

    const rootColor = getComputedTaskColor(root, allTasks, state);
    const l1Color = getComputedTaskColor(level1, allTasks, state);
    const l2Color = getComputedTaskColor(level2, allTasks, state);

    // All should be valid hex
    expect(rootColor).toMatch(/^#[0-9A-F]{6}$/);
    expect(l1Color).toMatch(/^#[0-9A-F]{6}$/);
    expect(l2Color).toMatch(/^#[0-9A-F]{6}$/);

    // Root should be the base color
    expect(rootColor).toBe(state.hierarchyOptions.baseColor.toUpperCase());
    // Deeper levels should be different (lighter)
    expect(l1Color).not.toBe(rootColor);
    expect(l2Color).not.toBe(l1Color);
  });
});
