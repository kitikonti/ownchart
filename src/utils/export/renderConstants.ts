/**
 * Shared rendering constants for export functionality.
 * These values mirror TaskBar.tsx and elbowPath.ts to ensure consistent
 * rendering between the live app and all export formats (SVG, PDF, PNG).
 *
 * Dependency direction: components import from here, never the other way around.
 */

import { getContrastTextColor } from "../colorUtils";

// =============================================================================
// Summary bracket (single source of truth — TaskBar.tsx imports from here)
// =============================================================================

/**
 * Summary bracket shape geometry.
 * Imported by TaskBar.tsx and the export renderer alike so both always stay
 * in sync without any component → utils dependency inversion.
 */
export const SUMMARY_BRACKET = {
  /** Horizontal bar thickness as ratio of total height (30%) */
  barThicknessRatio: 0.3,
  /** Downward tip height as ratio of total height (50%) */
  tipHeightRatio: 0.5,
  /** Tip width factor for 60° angle (1/tan(60°) ≈ 0.577) */
  tipWidthFactor: 0.577,
  /** Radius for top corners of the bracket bar */
  cornerRadius: 10,
  /** Radius for inner corners where tips meet the bar */
  innerRadius: 3,
  /** Fill opacity for summary bracket shapes */
  fillOpacity: 0.9,
} as const;

// =============================================================================
// Colors (declared first — other constant groups reference these)
// =============================================================================

/**
 * Default colors used in rendering.
 * Single source of truth for all export rendering colors.
 * Individual constant groups below reference these values so there is no
 * duplication between RENDER_COLORS and, e.g., LABEL_RENDER_CONSTANTS.
 */
export const RENDER_COLORS = {
  /** Default task color (brand-600) */
  taskDefault: "#0F6CBD",

  /** Preview outline color during drag (brand-400) */
  previewOutline: "#2B88D8",

  /** Text color for external labels (before/after the bar) */
  textExternal: "#495057",

  /** Text color for internal labels (inside the bar) */
  textInternal: "#ffffff",

  /** Dependency line color (neutral-400) */
  dependency: "#94a3b8",

  /**
   * Weekend background color.
   * Original: rgba(241, 245, 249, 0.5) blended onto white → #f8fafc
   */
  weekendBackground: "#f8fafc",

  /**
   * Holiday background color.
   * Original: rgba(254, 243, 199, 0.5) blended onto white → #fef9e3
   */
  holidayBackground: "#fef9e3",

  /** Grid line color (neutral-200) */
  gridLine: "#e2e8f0",

  /** Today marker color (brand-600) */
  todayMarker: "#0F6CBD",

  /** Today header cell highlight color (brand-50) */
  todayHighlight: "#EBF3FC",

  /** Header background color (neutral-50) */
  headerBackground: "#f8fafc",

  /** Header text color (neutral-600) */
  headerText: "#475569",

  /** Table border color (neutral-200) */
  tableBorder: "#e2e8f0",

  /** Table text color (neutral-900) */
  tableText: "#1e293b",

  /** Table header text color (neutral-500) */
  tableHeaderText: "#64748b",
} as const;

// =============================================================================
// Task rendering
// =============================================================================

/**
 * Task bar rendering constants — matching TaskBar.tsx exactly.
 */
export const TASK_RENDER_CONSTANTS = {
  /** Corner radius for regular task bars (rx, ry in SVG) */
  taskCornerRadius: 4,

  /** Background opacity when progress is shown */
  taskBackgroundOpacity: 0.65,

  /** Progress bar uses full opacity */
  taskProgressOpacity: 1.0,
} as const;

// =============================================================================
// Milestone rendering
// =============================================================================

/**
 * Milestone diamond rendering constants — matching MilestoneDiamond component.
 */
export const MILESTONE_RENDER_CONSTANTS = {
  /** Minimum size for milestone diamond (px) */
  minSize: 6,

  /** Maximum size for milestone diamond (px) */
  maxSize: 10,

  /** Size factor: pixelsPerDay × sizeFactor = diamond half-size */
  sizeFactor: 0.5,
} as const;

// =============================================================================
// Label rendering
// =============================================================================

/**
 * Task label rendering constants — matching TaskBar label positioning.
 * Colors reference RENDER_COLORS to avoid duplication.
 */
export const LABEL_RENDER_CONSTANTS = {
  /** Horizontal padding from task bar edge (px) */
  padding: 8,

  /** Color for labels outside the bar (before/after positions) */
  externalColor: RENDER_COLORS.textExternal,

  /** Color for labels inside the bar */
  internalColor: RENDER_COLORS.textInternal,

  /** Vertical offset factor: fontSize × factor centres text visually */
  verticalOffsetFactor: 1 / 3,

  /** Font weight for task labels */
  fontWeight: 600,
} as const;

// =============================================================================
// Dependency arrow rendering
// =============================================================================

/**
 * Dependency arrow rendering constants — matching elbowPath.ts.
 * Colors reference RENDER_COLORS to avoid duplication.
 */
export const DEPENDENCY_RENDER_CONSTANTS = {
  /** Horizontal segment length coming out of / into tasks (px) */
  horizontalSegment: 15,

  /** Base corner radius for 90° turns at the comfortable (44px) row height */
  baseCornerRadius: 8,

  /** Minimum corner radius after scaling — prevents radius from collapsing at small row heights */
  minCornerRadius: 4,

  /** Base row height used as the scaling reference (px) */
  baseRowHeight: 44,

  /** Arrowhead size — triangle pointing into target task (px) */
  arrowheadSize: 8,

  /** Stroke color for dependency lines */
  strokeColor: RENDER_COLORS.dependency,

  /** Stroke width for dependency lines (px) */
  strokeWidth: 1.5,

  /** Extra padding for minimum gap calculation (triggers S-curve sooner) */
  elbowGapPadding: 0,
} as const;

// =============================================================================
// Types
// =============================================================================

/** Resolved label position and styling for a task bar label */
export interface LabelConfig {
  /** X offset relative to task bar start */
  x: number;
  /** Y position for text baseline */
  y: number;
  /** SVG text-anchor value */
  textAnchor: "start" | "end";
  /** Fill color for the label text */
  fill: string;
  /** Whether the label should be clipped to the task bar bounds */
  clip: boolean;
}

/** Options for getLabelConfig */
export interface GetLabelConfigOptions {
  /** Width of the task bar */
  taskWidth: number;
  /** Height of the task bar */
  taskHeight: number;
  /** Position of the label (before, inside, after) */
  labelPosition: "before" | "inside" | "after";
  /** Font size for vertical offset calculation */
  fontSize: number;
  /** Optional task background color for dynamic contrast (inside labels only) */
  taskColor?: string;
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Calculate milestone size based on pixels per day.
 * Matches the app's responsive milestone sizing.
 */
export function calculateMilestoneSize(pixelsPerDay: number): number {
  return Math.min(
    MILESTONE_RENDER_CONSTANTS.maxSize,
    Math.max(
      MILESTONE_RENDER_CONSTANTS.minSize,
      pixelsPerDay * MILESTONE_RENDER_CONSTANTS.sizeFactor
    )
  );
}

/**
 * Calculate corner radius scaled by row height.
 * Matches elbowPath.ts scaling logic.
 */
export function getScaledCornerRadius(rowHeight: number): number {
  const scale = rowHeight / DEPENDENCY_RENDER_CONSTANTS.baseRowHeight;
  return Math.max(
    DEPENDENCY_RENDER_CONSTANTS.minCornerRadius,
    Math.round(DEPENDENCY_RENDER_CONSTANTS.baseCornerRadius * scale)
  );
}

/**
 * Generate SVG path for a summary bracket shape.
 * Matches the SummaryBracket component exactly.
 */
export function generateSummaryBracketPath(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const tipHeight = height * SUMMARY_BRACKET.tipHeightRatio;
  const barThickness = height * SUMMARY_BRACKET.barThicknessRatio;
  const tipWidth = tipHeight * SUMMARY_BRACKET.tipWidthFactor;
  const cornerRadius = SUMMARY_BRACKET.cornerRadius;
  const innerRadius = SUMMARY_BRACKET.innerRadius;

  return `
    M ${x + cornerRadius} ${y}
    L ${x + width - cornerRadius} ${y}
    Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
    L ${x + width} ${y + barThickness}
    L ${x + width} ${y + barThickness + tipHeight}
    L ${x + width - tipWidth + innerRadius} ${y + barThickness + innerRadius}
    Q ${x + width - tipWidth} ${y + barThickness} ${x + width - tipWidth - innerRadius} ${y + barThickness}
    L ${x + tipWidth + innerRadius} ${y + barThickness}
    Q ${x + tipWidth} ${y + barThickness} ${x + tipWidth - innerRadius} ${y + barThickness + innerRadius}
    L ${x} ${y + barThickness + tipHeight}
    L ${x} ${y + barThickness}
    L ${x} ${y + cornerRadius}
    Q ${x} ${y} ${x + cornerRadius} ${y}
    Z
  `
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Generate SVG path for a milestone diamond shape.
 * Matches the MilestoneDiamond component exactly.
 */
export function generateMilestonePath(
  centerX: number,
  centerY: number,
  size: number
): string {
  return `
    M ${centerX} ${centerY - size}
    L ${centerX + size} ${centerY}
    L ${centerX} ${centerY + size}
    L ${centerX - size} ${centerY}
    Z
  `
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Calculate label position and styling based on position mode.
 * Returns x offset relative to task bar start, y position, text anchor, fill color, and clip flag.
 */
export function getLabelConfig(options: GetLabelConfigOptions): LabelConfig {
  const { taskWidth, taskHeight, labelPosition, fontSize, taskColor } = options;
  const padding = LABEL_RENDER_CONSTANTS.padding;
  const yOffset = fontSize * LABEL_RENDER_CONSTANTS.verticalOffsetFactor;
  const y = taskHeight / 2 + yOffset;

  switch (labelPosition) {
    case "before":
      return {
        x: -padding,
        y,
        textAnchor: "end",
        fill: LABEL_RENDER_CONSTANTS.externalColor,
        clip: false,
      };
    case "inside":
      return {
        x: padding,
        y,
        textAnchor: "start",
        fill: taskColor
          ? getContrastTextColor(taskColor)
          : LABEL_RENDER_CONSTANTS.internalColor,
        clip: true,
      };
    case "after":
      return {
        x: taskWidth + padding,
        y,
        textAnchor: "start",
        fill: LABEL_RENDER_CONSTANTS.externalColor,
        clip: false,
      };
  }
}
