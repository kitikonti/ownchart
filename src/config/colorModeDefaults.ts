/**
 * Default values for the Smart Color Management system.
 * Runtime constants extracted from colorMode.types.ts.
 */

import { COLORS } from "../styles/design-tokens";
import type { ColorModeState } from "../types/colorMode.types";

/** Percentage of lightening applied per hierarchy level */
const HIERARCHY_LIGHTEN_STEP_PERCENT = 12;

/** Maximum total lightening percentage for deepest hierarchy levels */
const HIERARCHY_MAX_LIGHTEN_PERCENT = 36;

/**
 * Default color mode state — used for store initialization and file loading fallback.
 */
export const DEFAULT_COLOR_MODE_STATE: ColorModeState = {
  mode: "manual",
  themeOptions: {
    selectedPaletteId: null,
    customMonochromeBase: null,
  },
  summaryOptions: {
    useMilestoneAccent: true,
    milestoneAccentColor: "#CA8A04", // Gold
  },
  taskTypeOptions: {
    summaryColor: COLORS.brand[900],
    taskColor: COLORS.brand[600],
    milestoneColor: "#CA8A04", // Gold
  },
  hierarchyOptions: {
    baseColor: COLORS.brand[600],
    lightenPercentPerLevel: HIERARCHY_LIGHTEN_STEP_PERCENT,
    maxLightenPercent: HIERARCHY_MAX_LIGHTEN_PERCENT,
  },
};
