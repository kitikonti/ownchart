/**
 * useComputedTaskColor - Compute display color based on color mode
 *
 * Returns the appropriate color for a task based on the current color mode:
 * - None (manual): Returns task.color directly
 * - Theme: Returns color from selected palette (hierarchy-aware, hash-based)
 * - Summary: Returns parent's color (or own color if root); summaries keep own color
 * - Task Type: Returns color based on task type
 * - Hierarchy: Returns lightened color based on depth level
 *
 * colorOverride: In automatic modes (theme, summary, taskType, hierarchy),
 * if task.colorOverride is set, it takes priority. Ignored in "None" mode.
 */

import { useMemo } from "react";
import { useChartStore } from "../store/slices/chartSlice";
import { useTaskStore } from "../store/slices/taskSlice";
import type { Task } from "../types/chart.types";
import type { ColorModeState } from "../types/colorMode.types";
import { getPaletteById } from "../utils/colorPalettes";
import {
  generateMonochromePalette,
  hexToHSL,
  hslToHex,
  lightenColor,
  stableHash,
} from "../utils/colorUtils";

/**
 * Get the hierarchy depth of a task
 */
function getTaskDepth(task: Task, allTasks: Task[]): number {
  let depth = 0;
  let currentTask: Task | undefined = task;

  while (currentTask?.parent) {
    depth++;
    currentTask = allTasks.find((t) => t.id === currentTask?.parent);
  }

  return depth;
}

/**
 * Get the nearest summary parent of a task
 */
function getNearestSummaryParent(
  task: Task,
  allTasks: Task[]
): Task | undefined {
  if (!task.parent) return undefined;

  const parent = allTasks.find((t) => t.id === task.parent);
  if (!parent) return undefined;

  if (parent.type === "summary") {
    return parent;
  }

  // Recursively check parent's parent
  return getNearestSummaryParent(parent, allTasks);
}

/**
 * Get root-level summary tasks
 */
function getRootSummaries(allTasks: Task[]): Task[] {
  return allTasks.filter((t) => t.type === "summary" && !t.parent);
}

/**
 * For theme mode: find the "color-giver" summary for a task.
 * - If there's only one root summary, use its level-1 children as color-givers.
 * - Otherwise use direct summary parents.
 */
function getThemeColorGiver(task: Task, allTasks: Task[]): Task | undefined {
  const rootSummaries = getRootSummaries(allTasks);

  // Special case: single root summary → use its level-1 children as color-givers
  if (rootSummaries.length === 1) {
    const singleRoot = rootSummaries[0];

    // If this IS the single root, no color-giver
    if (task.id === singleRoot.id) return undefined;

    // Check if this task is a direct child of the single root
    if (task.parent === singleRoot.id) {
      return task; // This task IS the color-giver for its subtree
    }

    // Walk up to find the level-1 ancestor (direct child of single root)
    let current: Task | undefined = task;
    while (current?.parent) {
      const parent = allTasks.find((t) => t.id === current?.parent);
      if (!parent) break;
      if (parent.parent === singleRoot.id) {
        return parent; // Found the level-1 color-giver
      }
      current = parent;
    }

    return undefined;
  }

  // Multiple roots → walk ALL THE WAY UP to the root ancestor
  // so all descendants of the same root group share one base color
  let current: Task | undefined = task;
  while (current?.parent) {
    const parent = allTasks.find((t) => t.id === current?.parent);
    if (!parent) break;
    current = parent;
  }
  // current = root ancestor (or task itself if already root)
  if (!current || task.id === current.id) return undefined;
  return current;
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
  const withHash = colorGiverIds.map((id) => ({
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
  allTasks: Task[]
): number {
  let depth = 0;
  let current: Task | undefined = task;

  while (current && current.id !== colorGiver.id) {
    depth++;
    if (!current.parent) break;
    current = allTasks.find((t) => t.id === current?.parent);
  }

  return depth;
}

/**
 * Compute the display color for a task based on color mode
 */
function computeTaskColor(
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState
): string {
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
      // Get the active palette
      let paletteColors: string[] = [];

      if (themeOptions.customMonochromeBase) {
        paletteColors = generateMonochromePalette(
          themeOptions.customMonochromeBase
        );
      } else if (themeOptions.selectedPaletteId) {
        const palette = getPaletteById(themeOptions.selectedPaletteId);
        if (palette) {
          paletteColors = palette.colors;
        }
      }

      if (paletteColors.length === 0) {
        return task.color;
      }

      // Deconflicted palette assignment for maximum color diversity
      const assignment = assignPaletteIndices(
        getColorGiverIds(allTasks),
        paletteColors.length
      );

      const colorGiver = getThemeColorGiver(task, allTasks);

      if (!colorGiver) {
        // Root-level task / color-giver itself → use assigned index
        const idx =
          assignment.get(task.id) ?? stableHash(task.id) % paletteColors.length;
        return paletteColors[idx];
      }

      // Color-giver determines base color from palette
      const baseIdx =
        assignment.get(colorGiver.id) ??
        stableHash(colorGiver.id) % paletteColors.length;
      const baseColor = paletteColors[baseIdx];

      // If this task IS the color-giver itself, use base color directly
      if (task.id === colorGiver.id) {
        return baseColor;
      }

      // Children: create a variation of the base color
      const depth = getDepthRelativeToColorGiver(task, colorGiver, allTasks);
      const taskHash = stableHash(task.id);
      const hsl = hexToHSL(baseColor);

      // Lightness: always lighter than parent, small hash variation per sibling
      const lightnessShift = depth * 7 + (taskHash % 5) * 2; // always positive
      hsl.l = Math.min(88, hsl.l + lightnessShift);

      // Hue: minimal shift for sibling differentiation (±2°)
      const hueShift = (taskHash % 5) - 2;
      hsl.h = (hsl.h + hueShift + 360) % 360;

      return hslToHex(hsl);
    }

    case "summary": {
      // Check if this is a milestone and should use accent color
      if (task.type === "milestone" && summaryOptions.useMilestoneAccent) {
        return summaryOptions.milestoneAccentColor;
      }

      // Summaries show their own color (they DEFINE the group color)
      if (task.type === "summary") {
        return task.color;
      }

      // Non-summary children inherit from nearest summary parent
      const summaryParent = getNearestSummaryParent(task, allTasks);
      if (summaryParent) {
        return summaryParent.color;
      }

      // Root level tasks keep their own color
      return task.color;
    }

    case "taskType": {
      // Return color based on task type
      switch (task.type) {
        case "summary":
          return taskTypeOptions.summaryColor;
        case "milestone":
          return taskTypeOptions.milestoneColor;
        case "task":
        default:
          return taskTypeOptions.taskColor;
      }
    }

    case "hierarchy": {
      // Calculate depth and apply lightening
      const depth = getTaskDepth(task, allTasks);
      const lightenAmount = Math.min(
        depth * (hierarchyOptions.lightenPercentPerLevel / 100),
        hierarchyOptions.maxLightenPercent / 100
      );

      return lightenColor(hierarchyOptions.baseColor, lightenAmount);
    }

    default:
      return task.color;
  }
}

/**
 * Hook to get computed color for a single task
 */
export function useComputedTaskColor(task: Task): string {
  const colorModeState = useChartStore((state) => state.colorModeState);
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    return computeTaskColor(task, tasks, colorModeState);
  }, [task, tasks, colorModeState]);
}

/**
 * Hook to get computed colors for all tasks
 * Returns a Map from task ID to computed color
 */
export function useComputedTaskColors(): Map<string, string> {
  const colorModeState = useChartStore((state) => state.colorModeState);
  const tasks = useTaskStore((state) => state.tasks);

  return useMemo(() => {
    const colorMap = new Map<string, string>();

    tasks.forEach((task) => {
      const color = computeTaskColor(task, tasks, colorModeState);
      colorMap.set(task.id, color);
    });

    return colorMap;
  }, [tasks, colorModeState]);
}

/**
 * Get computed color without hooks (for use in non-component contexts)
 */
export function getComputedTaskColor(
  task: Task,
  allTasks: Task[],
  colorModeState: ColorModeState
): string {
  return computeTaskColor(task, allTasks, colorModeState);
}
