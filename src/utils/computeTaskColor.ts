/**
 * Pure functions for computing task display colors based on color mode.
 *
 * Extracted from hooks/useComputedTaskColor.ts so that non-React code
 * (store slices, export utils) can use them without a hooks-layer import.
 *
 * Color modes:
 * - manual: Returns task.color directly
 * - theme: Returns color from selected palette (hierarchy-aware, hash-based)
 * - summary: Returns parent's color (or own color if root); summaries keep own color
 * - taskType: Returns color based on task type
 * - hierarchy: Returns lightened color based on depth level
 *
 * colorOverride: In automatic modes (theme, summary, taskType, hierarchy),
 * if task.colorOverride is set, it takes priority. Ignored in "manual" mode.
 */

import { getPaletteById } from "./colorPalettes";
import { stableHash } from "./hashUtils";
import {
  generateMonochromePalette,
  hexToHSL,
  hslToHex,
  lightenColor,
} from "./colorUtils";
import type { Task } from "../types/chart.types";
import type { ColorModeState } from "../types/colorMode.types";
import type { HexColor } from "../types/branded.types";

/**
 * Build a Map<id, Task> for O(1) parent lookups during tree traversal.
 * All internal helpers that walk the task hierarchy accept this map instead
 * of the raw array so repeated allTasks.find() calls are eliminated.
 */
function buildTaskMap(allTasks: Task[]): Map<string, Task> {
  const map = new Map<string, Task>();
  for (const t of allTasks) {
    map.set(t.id, t);
  }
  return map;
}

/**
 * Get the hierarchy depth of a task
 */
function getTaskDepth(task: Task, taskMap: Map<string, Task>): number {
  let depth = 0;
  let currentTask: Task | undefined = task;

  while (currentTask?.parent) {
    depth++;
    currentTask = taskMap.get(currentTask.parent);
  }

  return depth;
}

/**
 * Get the nearest summary parent of a task
 */
function getNearestSummaryParent(
  task: Task,
  taskMap: Map<string, Task>
): Task | undefined {
  if (!task.parent) return undefined;

  const parent = taskMap.get(task.parent);
  if (!parent) return undefined;

  if (parent.type === "summary") {
    return parent;
  }

  // Recursively check parent's parent
  return getNearestSummaryParent(parent, taskMap);
}

/**
 * Get root-level summary tasks
 */
function getRootSummaries(allTasks: Task[]): Task[] {
  return allTasks.filter((t) => t.type === "summary" && !t.parent);
}

/**
 * Walk up the task tree from `task` to find its level-1 ancestor —
 * the direct child of `singleRoot`. Returns that ancestor task, or
 * `undefined` if `task` is not a descendant of `singleRoot`.
 */
function findLevel1Ancestor(
  task: Task,
  singleRoot: Task,
  taskMap: Map<string, Task>
): Task | undefined {
  // task is already a direct child of singleRoot
  if (task.parent === singleRoot.id) return task;

  let current: Task | undefined = task;
  while (current?.parent) {
    const parent = taskMap.get(current.parent);
    if (!parent) break;
    if (parent.parent === singleRoot.id) {
      return parent; // Found the level-1 color-giver
    }
    current = parent;
  }
  return undefined;
}

/**
 * Walk ALL THE WAY UP to the root ancestor of `task`.
 * Returns the root Task, or `undefined` if `task` is already at the root
 * (i.e. no ancestor exists — `task` itself would be the root).
 *
 * Note: deliberately type-agnostic — the root may be any TaskType, not only
 * "summary". All descendants of the same root group share one base color.
 */
function findRootAncestor(
  task: Task,
  taskMap: Map<string, Task>
): Task | undefined {
  let current: Task | undefined = task;
  while (current?.parent) {
    const parent = taskMap.get(current.parent);
    if (!parent) break;
    current = parent;
  }
  // If current is still task, it has no ancestor → return undefined
  if (!current || task.id === current.id) return undefined;
  return current;
}

/**
 * For theme mode: find the "color-giver" summary for a task.
 * - If there's only one root summary, use its level-1 children as color-givers.
 * - Otherwise use direct summary parents.
 */
function getThemeColorGiver(
  task: Task,
  taskMap: Map<string, Task>,
  rootSummaries: Task[]
): Task | undefined {
  // Special case: single root summary → use its level-1 children as color-givers
  if (rootSummaries.length === 1) {
    const singleRoot = rootSummaries[0];
    // If this IS the single root, no color-giver
    if (task.id === singleRoot.id) return undefined;
    return findLevel1Ancestor(task, singleRoot, taskMap);
  }

  // Multiple roots → walk all the way up; descendants share root's base color
  return findRootAncestor(task, taskMap);
}

/**
 * Collect IDs of all "color-givers" — the tasks that determine palette color
 * for their group.
 */
function getColorGiverIds(allTasks: Task[]): string[] {
  const rootSummaries = getRootSummaries(allTasks);

  if (rootSummaries.length === 1) {
    // Single root: level-1 children are the color-givers
    return allTasks
      .filter((t) => t.parent === rootSummaries[0].id)
      .map((t) => t.id);
  }

  // Multiple roots (or zero): all root-level tasks are color-givers
  return allTasks.filter((t) => !t.parent).map((t) => t.id);
}

/** Intermediate record used inside assignPaletteIndices. */
interface PaletteCandidate {
  id: string;
  /** Raw DJB2 hash — used for deterministic sort order. */
  hash: number;
  /** Preferred palette index (hash % paletteSize). */
  pref: number;
}

/**
 * Assign palette indices to color-givers using hash + collision avoidance.
 * Maximizes color diversity while keeping assignments stable across reorders.
 *
 * Algorithm:
 * 1. Each color-giver hashes to a "preferred" palette index
 * 2. Process in hash-value order (deterministic, independent of task array order)
 * 3. Non-colliding get their preferred index
 * 4. Colliding get the nearest free index
 * 5. If more color-givers than palette colors, remaining get their preferred (duplicates)
 */
function assignPaletteIndices(
  colorGiverIds: string[],
  paletteSize: number
): Map<string, number> {
  const withHash: PaletteCandidate[] = colorGiverIds.map((id) => ({
    id,
    hash: stableHash(id),
    pref: stableHash(id) % paletteSize,
  }));

  // Sort by hash for deterministic processing order
  withHash.sort((a, b) => a.hash - b.hash);

  const assigned = new Map<string, number>();
  const taken = new Set<number>();

  // First pass: non-colliding get their preferred index
  for (const r of withHash) {
    if (!taken.has(r.pref)) {
      assigned.set(r.id, r.pref);
      taken.add(r.pref);
    }
  }

  // Second pass: colliding get nearest free index
  for (const r of withHash) {
    if (!assigned.has(r.id)) {
      for (let offset = 1; offset <= paletteSize; offset++) {
        const tryIdx = (r.pref + offset) % paletteSize;
        if (!taken.has(tryIdx)) {
          assigned.set(r.id, tryIdx);
          taken.add(tryIdx);
          break;
        }
      }
    }
  }

  // More color-givers than palette colors: remaining get preferred (duplicates OK)
  for (const r of withHash) {
    if (!assigned.has(r.id)) {
      assigned.set(r.id, r.pref);
    }
  }

  return assigned;
}

/**
 * Get depth relative to the color-giver
 */
function getDepthRelativeToColorGiver(
  task: Task,
  colorGiver: Task,
  taskMap: Map<string, Task>
): number {
  let depth = 0;
  let current: Task | undefined = task;

  while (current && current.id !== colorGiver.id) {
    depth++;
    if (!current.parent) break;
    current = taskMap.get(current.parent);
  }

  return depth;
}

// ─── Theme mode helpers ───────────────────────────────────────────────────────

/** Lightness increase per depth level in theme-mode sibling coloring. */
const THEME_LIGHTNESS_SHIFT_PER_DEPTH = 7;
/** Per-sibling lightness variation added via hash to differentiate siblings (%). */
const THEME_SIBLING_LIGHTNESS_VARIATION = 2;
/** Maximum lightness value (%) allowed in theme-mode derived colors. */
const THEME_MAX_LIGHTNESS = 88;
/** Half-range for per-sibling hue variation (±degrees) in theme mode. */
const THEME_SIBLING_HUE_HALF_RANGE = 2;
/** Modulus applied to taskHash for sibling variation — yields values 0..4 for both lightness and hue variation. */
const THEME_SIBLING_HASH_MODULUS = 5;

/** Pre-computed shared state for theme-mode color resolution. */
interface ThemeContext {
  paletteColors: string[];
  assignment: Map<string, number>;
  /** Cached root summaries — used by getThemeColorGiver to avoid re-filtering. */
  rootSummaries: Task[];
  /** O(1) lookup map for parent traversal. */
  taskMap: Map<string, Task>;
}

/**
 * Pre-compute the palette color list and index assignment for theme mode.
 * Returns null when no palette is configured (callers fall back to task.color).
 * Intended to be called once per batch so assignPaletteIndices runs only O(n log n)
 * once rather than once per task (which would be O(n² log n) total).
 */
function buildThemeContext(
  allTasks: Task[],
  themeOptions: ColorModeState["themeOptions"]
): ThemeContext | null {
  let paletteColors: string[] = [];

  if (themeOptions.customMonochromeBase) {
    paletteColors = generateMonochromePalette(
      themeOptions.customMonochromeBase
    );
  } else if (themeOptions.selectedPaletteId) {
    const palette = getPaletteById(themeOptions.selectedPaletteId);
    if (palette) paletteColors = palette.colors;
  }

  if (paletteColors.length === 0) return null;

  const taskMap = buildTaskMap(allTasks);
  const rootSummaries = getRootSummaries(allTasks);
  const assignment = assignPaletteIndices(
    getColorGiverIds(allTasks),
    paletteColors.length
  );
  return { paletteColors, assignment, rootSummaries, taskMap };
}

/**
 * Compute a single task's theme-mode color using a pre-built ThemeContext.
 * The caller is responsible for checking colorOverride before calling this.
 */
function applyThemeColor(task: Task, ctx: ThemeContext): HexColor {
  const { paletteColors, assignment, rootSummaries, taskMap } = ctx;
  const colorGiver = getThemeColorGiver(task, taskMap, rootSummaries);

  if (!colorGiver) {
    const idx =
      assignment.get(task.id) ?? stableHash(task.id) % paletteColors.length;
    return paletteColors[idx] as HexColor;
  }

  const baseIdx =
    assignment.get(colorGiver.id) ??
    stableHash(colorGiver.id) % paletteColors.length;
  const baseColor = paletteColors[baseIdx];

  if (task.id === colorGiver.id) {
    return baseColor as HexColor;
  }

  const depth = getDepthRelativeToColorGiver(task, colorGiver, taskMap);
  const taskHash = stableHash(task.id);
  const hsl = hexToHSL(baseColor);

  // Lightness: always lighter than parent, small hash variation per sibling
  const lightnessShift =
    depth * THEME_LIGHTNESS_SHIFT_PER_DEPTH +
    (taskHash % THEME_SIBLING_HASH_MODULUS) * THEME_SIBLING_LIGHTNESS_VARIATION; // always positive
  hsl.l = Math.min(THEME_MAX_LIGHTNESS, hsl.l + lightnessShift);

  // Hue: minimal shift for sibling differentiation (±THEME_SIBLING_HUE_HALF_RANGE°)
  const hueShift =
    (taskHash % THEME_SIBLING_HASH_MODULUS) - THEME_SIBLING_HUE_HALF_RANGE;
  hsl.h = (hsl.h + hueShift + 360) % 360;

  return hslToHex(hsl) as HexColor;
}

// ─── Per-task mode helpers (single-task variants) ─────────────────────────────

/**
 * Compute a single task's summary-mode color.
 * Mirrors fillSummaryColors for the single-task path in computeTaskColor.
 */
function applySummaryColor(
  task: Task,
  allTasks: Task[],
  summaryOptions: ColorModeState["summaryOptions"]
): HexColor {
  if (task.type === "milestone" && summaryOptions.useMilestoneAccent) {
    return summaryOptions.milestoneAccentColor;
  }
  // Summaries show their own color (they DEFINE the group color)
  if (task.type === "summary") {
    return task.color;
  }
  // Non-summary children inherit from nearest summary parent
  const taskMap = buildTaskMap(allTasks);
  const summaryParent = getNearestSummaryParent(task, taskMap);
  if (summaryParent) {
    return summaryParent.colorOverride || summaryParent.color;
  }
  // Root level tasks keep their own color
  return task.color;
}

/**
 * Compute a single task's hierarchy-mode color.
 * Mirrors fillHierarchyColors for the single-task path in computeTaskColor.
 */
function applyHierarchyColor(
  task: Task,
  allTasks: Task[],
  hierarchyOptions: ColorModeState["hierarchyOptions"]
): HexColor {
  const taskMap = buildTaskMap(allTasks);
  const depth = getTaskDepth(task, taskMap);
  const lightenAmount = Math.min(
    depth * (hierarchyOptions.lightenPercentPerLevel / 100),
    hierarchyOptions.maxLightenPercent / 100
  );
  return lightenColor(hierarchyOptions.baseColor, lightenAmount) as HexColor;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the display color for a task based on color mode.
 * Pure function — no React hooks or store access.
 *
 * @param task           - The task whose display color is being resolved.
 * @param allTasks       - Full task list (needed for hierarchy/summary traversal).
 * @param colorModeState - Active color mode configuration.
 * @returns The resolved `HexColor` for the task.
 *
 * **Performance note (theme mode):** This function calls `buildThemeContext`
 * on every invocation, which runs `assignPaletteIndices` — an O(n log n)
 * operation over all tasks. Calling this in a loop over n tasks results in
 * O(n² log n) total cost. For batch rendering use `computeAllTaskColors`
 * instead, which hoists the shared computation outside the loop.
 */
export function computeTaskColor(
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState
): HexColor {
  const {
    mode,
    themeOptions,
    summaryOptions,
    taskTypeOptions,
    hierarchyOptions,
  } = colorModeState;

  // colorOverride only in automatic modes, not in "None"/manual
  if (mode !== "manual" && task.colorOverride) {
    return task.colorOverride;
  }

  switch (mode) {
    case "manual":
      // In manual mode, always use task's own color
      return task.color;

    case "theme": {
      const themeCtx = buildThemeContext(allTasks, themeOptions);
      if (!themeCtx) return task.color;
      return applyThemeColor(task, themeCtx);
    }

    case "summary":
      return applySummaryColor(task, allTasks, summaryOptions);

    case "taskType":
      // The `default` branch handles "task" and any future TaskType additions
      // gracefully by returning taskColor. If a new type is added, TypeScript
      // strict mode will not catch it here — add an explicit `case` for it.
      switch (task.type) {
        case "summary":
          return taskTypeOptions.summaryColor;
        case "milestone":
          return taskTypeOptions.milestoneColor;
        case "task":
        default:
          return taskTypeOptions.taskColor;
      }

    case "hierarchy":
      return applyHierarchyColor(task, allTasks, hierarchyOptions);

    default:
      return task.color;
  }
}

/**
 * Get computed color without hooks (for use in non-component contexts).
 * Semantic alias for `computeTaskColor` — the "get" prefix reads naturally
 * at call sites in ExportRenderer and chartSlice where a single task's color
 * is resolved in isolation.
 *
 * **Performance note:** Same O(n²) caveat as `computeTaskColor` applies —
 * calling this inside a loop over n tasks rebuilds shared state on every call.
 * Use `computeAllTaskColors` for batch rendering instead.
 */
export function getComputedTaskColor(
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState
): HexColor {
  return computeTaskColor(task, allTasks, colorModeState);
}

// ─── computeAllTaskColors private batch helpers ───────────────────────────────
// Each helper fills `result` for one color mode. Kept private so callers use
// computeAllTaskColors as the single entry point.

function fillThemeColors(
  tasks: Task[],
  colorModeState: ColorModeState,
  result: Map<string, HexColor>
): void {
  const themeCtx = buildThemeContext(tasks, colorModeState.themeOptions);

  if (!themeCtx) {
    // No palette configured — every task falls back to its own color.
    for (const task of tasks) {
      result.set(task.id, task.color as HexColor);
    }
    return;
  }

  for (const task of tasks) {
    // colorOverride check mirrors computeTaskColor's automatic-mode guard.
    // Kept inline here so we can skip applyThemeColor entirely for overridden tasks.
    if (task.colorOverride) {
      result.set(task.id, task.colorOverride);
      continue;
    }
    result.set(task.id, applyThemeColor(task, themeCtx));
  }
}

function fillSummaryColors(
  tasks: Task[],
  summaryOptions: ColorModeState["summaryOptions"],
  result: Map<string, HexColor>
): void {
  // Hoist taskMap so it is built once (O(n)) rather than once per task (O(n²)).
  const taskMap = buildTaskMap(tasks);
  for (const task of tasks) {
    if (task.colorOverride) {
      result.set(task.id, task.colorOverride);
      continue;
    }
    if (task.type === "milestone" && summaryOptions.useMilestoneAccent) {
      result.set(task.id, summaryOptions.milestoneAccentColor);
      continue;
    }
    if (task.type === "summary") {
      result.set(task.id, task.color);
      continue;
    }
    const summaryParent = getNearestSummaryParent(task, taskMap);
    result.set(
      task.id,
      summaryParent
        ? summaryParent.colorOverride || summaryParent.color
        : task.color
    );
  }
}

function fillHierarchyColors(
  tasks: Task[],
  hierarchyOptions: ColorModeState["hierarchyOptions"],
  result: Map<string, HexColor>
): void {
  // Hoist taskMap so it is built once (O(n)) rather than once per task (O(n²)).
  const taskMap = buildTaskMap(tasks);
  for (const task of tasks) {
    if (task.colorOverride) {
      result.set(task.id, task.colorOverride);
      continue;
    }
    const depth = getTaskDepth(task, taskMap);
    const lightenAmount = Math.min(
      depth * (hierarchyOptions.lightenPercentPerLevel / 100),
      hierarchyOptions.maxLightenPercent / 100
    );
    result.set(
      task.id,
      lightenColor(hierarchyOptions.baseColor, lightenAmount) as HexColor
    );
  }
}

function fillManualColors(tasks: Task[], result: Map<string, HexColor>): void {
  for (const task of tasks) {
    result.set(task.id, task.color);
  }
}

function fillTaskTypeColors(
  tasks: Task[],
  taskTypeOptions: ColorModeState["taskTypeOptions"],
  result: Map<string, HexColor>
): void {
  for (const task of tasks) {
    if (task.colorOverride) {
      result.set(task.id, task.colorOverride);
      continue;
    }
    switch (task.type) {
      case "summary":
        result.set(task.id, taskTypeOptions.summaryColor);
        break;
      case "milestone":
        result.set(task.id, taskTypeOptions.milestoneColor);
        break;
      case "task":
      default:
        result.set(task.id, taskTypeOptions.taskColor);
    }
  }
}

/** Exhaustiveness helper — causes a TypeScript error when `x` is not `never`. */
function assertNever(x: never): never {
  throw new Error(`Unhandled ColorMode: ${String(x)}`);
}

// ─── Public API (batch) ───────────────────────────────────────────────────────

/**
 * Compute display colors for all tasks in a single pass.
 *
 * More efficient than calling computeTaskColor per task because expensive
 * shared computations are performed only once:
 * - Theme mode: palette-index assignment (O(n log n)) is hoisted out of the per-task loop,
 *   reducing overall complexity from O(n²) to O(n·depth).
 * - Summary/hierarchy modes: `buildTaskMap` is hoisted so the Map is constructed
 *   once (O(n)) rather than once per task (O(n²)).
 * - Manual/taskType modes: no shared state needed; iterates tasks once.
 *
 * Use this in batch rendering contexts (export) instead of calling
 * getComputedTaskColor inside a render loop.
 *
 * @returns Map<taskId, HexColor> — contains an entry for every task in `tasks`.
 */
export function computeAllTaskColors(
  tasks: Task[],
  colorModeState: ColorModeState
): Map<string, HexColor> {
  const result = new Map<string, HexColor>();

  if (tasks.length === 0) return result;

  const { mode, summaryOptions, hierarchyOptions, taskTypeOptions } =
    colorModeState;

  switch (mode) {
    case "theme":
      fillThemeColors(tasks, colorModeState, result);
      break;
    case "summary":
      fillSummaryColors(tasks, summaryOptions, result);
      break;
    case "hierarchy":
      fillHierarchyColors(tasks, hierarchyOptions, result);
      break;
    case "manual":
      fillManualColors(tasks, result);
      break;
    case "taskType":
      fillTaskTypeColors(tasks, taskTypeOptions, result);
      break;
    default:
      // Exhaustive guard: TypeScript will raise an error here when a new ColorMode
      // variant is added without a corresponding fill* case above. This prevents
      // silent O(n²) regressions caused by falling through to per-task computeTaskColor.
      assertNever(mode);
  }

  return result;
}
