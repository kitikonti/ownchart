/**
 * Shared rendering constants for export functionality.
 * These values are extracted from TaskBar.tsx and bezierPath.ts
 * to ensure consistent rendering between app and exports.
 */

import { getContrastTextColor } from "../colorUtils";

/**
 * Task rendering constants - matching TaskBar.tsx exactly
 */
export const TASK_RENDER_CONSTANTS = {
  /**
   * Corner radius for regular task bars (rx, ry in SVG)
   */
  taskCornerRadius: 4,

  /**
   * Background opacity when progress is shown
   */
  taskBackgroundOpacity: 0.65,

  /**
   * Progress bar uses full opacity
   */
  taskProgressOpacity: 1.0,
} as const;

/**
 * Summary bracket constants - matching SummaryBracket component
 */
export const SUMMARY_RENDER_CONSTANTS = {
  /**
   * Horizontal bar thickness as ratio of total height (30%)
   */
  barThicknessRatio: 0.3,

  /**
   * Downward tip height as ratio of total height (50%)
   */
  tipHeightRatio: 0.5,

  /**
   * Tip width factor for 60° angle (tan(60°) ≈ 1.732, so 1/tan(60°) ≈ 0.577)
   */
  tipWidthFactor: 0.577,

  /**
   * Radius for top corners of the bracket bar
   */
  cornerRadius: 10,

  /**
   * Radius for inner corners where tips meet the bar
   */
  innerRadius: 3,

  /**
   * Fill opacity for summary brackets
   */
  fillOpacity: 0.9,
} as const;

/**
 * Milestone rendering constants - matching MilestoneDiamond component
 */
export const MILESTONE_RENDER_CONSTANTS = {
  /**
   * Minimum size for milestone diamond
   */
  minSize: 6,

  /**
   * Maximum size for milestone diamond
   */
  maxSize: 10,

  /**
   * Factor to calculate size from pixelsPerDay (pixelsPerDay / 2)
   */
  sizeFactor: 0.5,
} as const;

/**
 * Label rendering constants - matching TaskBar label positioning
 */
export const LABEL_RENDER_CONSTANTS = {
  /**
   * Horizontal padding from task bar edge
   */
  padding: 8,

  /**
   * Color for labels outside the bar (before/after positions)
   */
  externalColor: "#495057",

  /**
   * Color for labels inside the bar
   */
  internalColor: "#ffffff",

  /**
   * Vertical offset factor for centering (fontSize / 3 gives good visual center)
   */
  verticalOffsetFactor: 1 / 3,

  /**
   * Font weight for task labels
   */
  fontWeight: 600,
} as const;

/**
 * Dependency arrow constants - matching bezierPath.ts
 */
export const DEPENDENCY_RENDER_CONSTANTS = {
  /**
   * Horizontal segment length coming out of/into tasks
   */
  horizontalSegment: 15,

  /**
   * Base corner radius for 90° turns (at comfortable/44px row height)
   */
  baseCornerRadius: 8,

  /**
   * Base row height for scaling calculations
   */
  baseRowHeight: 44,

  /**
   * Arrowhead size (triangle pointing into target task)
   */
  arrowheadSize: 8,

  /**
   * Stroke color for dependency lines (neutral-400)
   */
  strokeColor: "#94a3b8",

  /**
   * Stroke width for dependency lines
   */
  strokeWidth: 1.5,

  /**
   * Extra padding for minimum gap calculation (switch to S-curve earlier)
   */
  elbowGapPadding: 0,
} as const;

/**
 * Default colors used in rendering
 */
export const RENDER_COLORS = {
  /**
   * Default task color (brand-600)
   */
  taskDefault: "#0F6CBD",

  /**
   * Preview outline color during drag (brand-400)
   */
  previewOutline: "#2B88D8",

  /**
   * Text color for external labels
   */
  textExternal: "#495057",

  /**
   * Text color for internal labels
   */
  textInternal: "#ffffff",

  /**
   * Dependency line color
   */
  dependency: "#94a3b8",

  /**
   * Weekend background color (neutral-100 blended with white at 50% opacity)
   * Original: rgba(241, 245, 249, 0.5) -> blended to #f8fafc
   */
  weekendBackground: "#f8fafc",

  /**
   * Holiday background color (amber-100 blended with white at 50% opacity)
   * Original: rgba(254, 243, 199, 0.5) -> blended to #fef9e3
   */
  holidayBackground: "#fef9e3",

  /**
   * Grid line color
   */
  gridLine: "#e2e8f0",

  /**
   * Today marker color (brand-600)
   */
  todayMarker: "#0F6CBD",

  /**
   * Today header cell highlight color (brand-50)
   */
  todayHighlight: "#EBF3FC",

  /**
   * Header background color
   */
  headerBackground: "#f8fafc",

  /**
   * Header text color
   */
  headerText: "#475569",

  /**
   * Table border color
   */
  tableBorder: "#e2e8f0",

  /**
   * Table text color
   */
  tableText: "#1e293b",

  /**
   * Table header text color
   */
  tableHeaderText: "#64748b",
} as const;

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
 * Matches bezierPath.ts scaling logic.
 */
export function getScaledCornerRadius(rowHeight: number): number {
  const scale = rowHeight / DEPENDENCY_RENDER_CONSTANTS.baseRowHeight;
  return Math.max(
    4,
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
  const tipHeight = height * SUMMARY_RENDER_CONSTANTS.tipHeightRatio;
  const barThickness = height * SUMMARY_RENDER_CONSTANTS.barThicknessRatio;
  const tipWidth = tipHeight * SUMMARY_RENDER_CONSTANTS.tipWidthFactor;
  const cornerRadius = SUMMARY_RENDER_CONSTANTS.cornerRadius;
  const innerRadius = SUMMARY_RENDER_CONSTANTS.innerRadius;

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
 *
 * @param taskWidth - Width of the task bar
 * @param taskHeight - Height of the task bar
 * @param labelPosition - Position of the label (before, inside, after)
 * @param fontSize - Font size for vertical offset calculation
 * @param taskColor - Optional task background color for dynamic contrast calculation (inside labels only)
 */
export function getLabelConfig(
  taskWidth: number,
  taskHeight: number,
  labelPosition: "before" | "inside" | "after",
  fontSize: number,
  taskColor?: string
): {
  x: number;
  y: number;
  textAnchor: "start" | "end";
  fill: string;
  clip: boolean;
} {
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
