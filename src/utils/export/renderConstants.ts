/**
 * Shared rendering constants for export functionality.
 * These values are the single source of truth for geometry and colour used
 * by both the app (TaskBar.tsx, elbowPath.ts) and the export path (svgExport,
 * pdfExport, taskTableRenderer) to guarantee visual consistency.
 */

import { getContrastTextColor } from "@/utils/colorUtils";
import { COLORS, SLATE_800 } from "@/styles/design-tokens";

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
 * Angle (in degrees) of the downward-pointing tips on a summary bracket.
 * A 60° angle produces a relatively narrow tip; increase toward 90° for a
 * wider/flatter tip. Changing this value automatically updates tipWidthFactor.
 */
const SUMMARY_BRACKET_TIP_ANGLE_DEG = 60;

/**
 * Summary bracket shape geometry — single source of truth.
 * Consumed by renderConstants (export path) and TaskBar.tsx (app rendering path).
 *
 * All values are ratios or unitless factors applied to the rendered height.
 */
export const SUMMARY_BRACKET = {
  /** Horizontal bar thickness as ratio of total height (30%) */
  barThicknessRatio: 0.3,
  /** Downward tip height as ratio of total height (50%) */
  tipHeightRatio: 0.5,
  /**
   * Tip width factor derived from the tip angle: 1/tan(angle).
   * At 60° this equals 1/√3 ≈ 0.577. Computed at module-load time from
   * SUMMARY_BRACKET_TIP_ANGLE_DEG so that changing the angle constant is
   * sufficient to update the geometry.
   */
  tipWidthFactor: 1 / Math.tan((SUMMARY_BRACKET_TIP_ANGLE_DEG * Math.PI) / 180),
  /**
   * Radius for top outer corners of the bracket bar (px).
   * Matches the visual corner radius used in the SummaryBracket component.
   * Clamped at runtime to barThickness/2 to avoid broken geometry on short rows.
   */
  cornerRadius: 10,
  /** Radius for inner corners where tips meet the bar */
  innerRadius: 3,
  /** Fill opacity for summary bracket shapes */
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

// ─── Slate scale aliases for readability ─────────────────────────────────────
//
// These reference the unified Slate scale via COLORS, avoiding
// duplicated hex literals.

/** slate[100] — weekend background and header chrome */
const SLATE_100 = COLORS.slate[100];

/** slate[200] — grid lines and table borders */
const SLATE_200 = COLORS.slate[200];

/** slate[600] — header text labels */
const SLATE_600 = COLORS.slate[600];

/**
 * Default colors used in rendering.
 * Defined before LABEL_RENDER_CONSTANTS so label colors can reference these
 * as the single source of truth for shared hex values.
 *
 * Values sourced from COLORS / design-tokens where available to prevent
 * drift when design tokens change.  Composited values (weekendBackground,
 * holidayBackground) and colors from Tailwind scales not exported by the
 * design-token module remain as documented hex literals.
 */
export const RENDER_COLORS = {
  /**
   * Default task color (brand-600)
   */
  taskDefault: COLORS.brand[600],

  /**
   * Preview outline color during drag (brand-400)
   */
  previewOutline: COLORS.brand[400],

  /**
   * Text color for external labels (before/after positions).
   * slate[600] — matches COLORS.chart.text.
   */
  textExternal: COLORS.chart.text,

  /**
   * Text color for internal labels (inside position).
   * Pure white (slate-0).
   */
  textInternal: COLORS.slate[0],

  /**
   * Dependency line color.
   * Matches COLORS.chart.dependencyDefault (slate[400]).
   */
  dependency: COLORS.chart.dependencyDefault,

  /**
   * Weekend background color.
   * Derived from slate-100 (rgba(241,245,249,0.5)) composited over white →
   * #f8fafc. If the source opacity or color changes, re-derive this hex value.
   */
  weekendBackground: SLATE_100,

  /**
   * Holiday background color.
   * Derived from amber-100 (rgba(254,243,199,0.5)) composited over white →
   * #fef9e3. If the source opacity or color changes, re-derive this hex value.
   */
  holidayBackground: "#fef9e3",

  /**
   * Grid line color (slate[200]).
   */
  gridLine: SLATE_200,

  /**
   * Today marker color (brand-600).
   * Intentionally the same token as taskDefault — separate entry because the
   * semantic roles differ and each may diverge independently in future themes.
   */
  todayMarker: COLORS.chart.todayMarker,

  /**
   * Today header cell highlight color (brand-50)
   */
  todayHighlight: COLORS.chart.todayHighlight,

  /**
   * Header background color (slate[100]).
   */
  headerBackground: SLATE_100,

  /**
   * Header text color (slate[600]).
   */
  headerText: SLATE_600,

  /**
   * Table border color (slate[200]).
   */
  tableBorder: SLATE_200,

  /**
   * Table text color (slate[800]).
   */
  tableText: SLATE_800,

  /**
   * Table header text color (slate[500]).
   */
  tableHeaderText: COLORS.chart.dependencyHover,
} as const;

/**
 * Label rendering constants - matching TaskBar label positioning.
 * Colors reference RENDER_COLORS to avoid duplication.
 */
export const LABEL_RENDER_CONSTANTS = {
  /**
   * Horizontal padding from task bar edge
   */
  padding: 8,

  /**
   * Color for labels outside the bar (before/after positions)
   */
  externalColor: RENDER_COLORS.textExternal,

  /**
   * Color for labels inside the bar
   */
  internalColor: RENDER_COLORS.textInternal,

  /**
   * Vertical offset factor for centering (fontSize / 3 ≈ 0.333 gives good visual center).
   * Applied as: y = rowHeight / 2 + fontSize * verticalOffsetFactor
   * This compensates for SVG text being anchored at its baseline rather than its
   * visual midpoint, producing more accurate vertical centering than rowHeight/2 alone.
   */
  verticalOffsetFactor: 1 / 3,

  /**
   * Font weight for task labels
   */
  fontWeight: 600,
} as const;

/**
 * Dependency arrow constants - matching elbowPath.ts
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
   * Stroke color for dependency lines — references RENDER_COLORS.dependency
   * as the single source of truth for this colour.
   */
  strokeColor: RENDER_COLORS.dependency,

  /**
   * Stroke width for dependency lines
   */
  strokeWidth: 1.5,

  /**
   * Extra padding for minimum gap calculation (switch to S-curve earlier).
   * Zero means the S-curve threshold is purely based on task geometry with
   * no additional buffer — keeps arrows tight to task bars.
   */
  elbowGapPadding: 0,
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
 * Minimum corner radius for dependency arrows at extreme zoom-out.
 * Prevents sharp 90° corners when scaling produces very small radii.
 * Exported so callers can reason about the effective lower bound when
 * computing row-height-scaled radii.
 */
export const MIN_CORNER_RADIUS = 4;

/**
 * Calculate corner radius scaled by row height.
 * Matches elbowPath.ts scaling logic.
 */
export function getScaledCornerRadius(rowHeight: number): number {
  const scale = rowHeight / DEPENDENCY_RENDER_CONSTANTS.baseRowHeight;
  return Math.max(
    MIN_CORNER_RADIUS,
    Math.round(DEPENDENCY_RENDER_CONSTANTS.baseCornerRadius * scale)
  );
}

/**
 * Computed geometry for a summary bracket shape.
 * All lengths are in px, derived from the bracket's overall width and height.
 */
export interface BracketGeometry {
  tipHeight: number;
  barThickness: number;
  /** Tip width, clamped so the two tips never overlap on very narrow tasks */
  tipWidth: number;
  /** Outer corner radius, clamped to barThickness/2 to avoid broken arcs */
  cornerRadius: number;
  /** Inner corner radius where tips meet the bar, clamped to barThickness/2 */
  innerRadius: number;
}

/**
 * Compute the clamped geometry values for a summary bracket of the given size.
 * Extracted so the clamping logic is independently testable and
 * {@link generateSummaryBracketPath} can focus on path assembly only.
 *
 * @returns {@link BracketGeometry} with all dimensions clamped to safe ranges
 * @internal
 */
export function computeBracketGeometry(
  width: number,
  height: number
): BracketGeometry {
  const tipHeight = height * SUMMARY_BRACKET.tipHeightRatio;
  const barThickness = height * SUMMARY_BRACKET.barThicknessRatio;
  // Clamp tipWidth so the two tips never overlap on very narrow tasks.
  const rawTipWidth = tipHeight * SUMMARY_BRACKET.tipWidthFactor;
  const tipWidth = Math.min(rawTipWidth, width / 2);
  // Clamp corner radii to half the bar thickness so arcs never exceed the bar
  // height — this prevents invalid / visually broken geometry on short rows
  // (e.g. barThickness < cornerRadius, which occurs when height < ~34 px).
  const cornerRadius = Math.min(SUMMARY_BRACKET.cornerRadius, barThickness / 2);
  const innerRadius = Math.min(SUMMARY_BRACKET.innerRadius, barThickness / 2);
  return { tipHeight, barThickness, tipWidth, cornerRadius, innerRadius };
}

/**
 * Collapses template-literal indentation from SVG path strings.
 * Safe to apply to path data because SVG path numbers never contain embedded spaces.
 */
function normalizePath(d: string): string {
  return d.trim().replace(/\s+/g, " ");
}

/**
 * Generate SVG path for a summary bracket shape.
 * Matches the SummaryBracket component exactly.
 *
 * The shape consists of a horizontal bar at the top with rounded outer corners,
 * plus two downward-pointing triangular tips at each end (like a bracket: ▼…▼).
 * The tips have inner-corner rounding (`innerRadius`) where they meet the
 * horizontal bar, preventing sharp re-entrant angles in the SVG path.
 * All proportions are driven by {@link SUMMARY_BRACKET} ratios applied to `height`.
 *
 * Returns an empty string for degenerate inputs (width or height ≤ 0) so callers
 * can safely skip rendering zero-size shapes.
 *
 * Coordinates are expressed in the caller's local coordinate space; apply a
 * `translate` transform on the enclosing `<g>` element to reposition the bracket
 * within the SVG canvas rather than adjusting `x`/`y` directly.
 *
 * @param x - Left edge of the bracket in px
 * @param y - Top edge of the bracket in px
 * @param width - Total width of the bracket in px
 * @param height - Total height of the bracket (bar + tip) in px
 * @returns SVG path `d` attribute string, or `""` for degenerate dimensions
 */
export function generateSummaryBracketPath(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  if (width <= 0 || height <= 0) return "";

  const { tipHeight, barThickness, tipWidth, cornerRadius, innerRadius } =
    computeBracketGeometry(width, height);

  return normalizePath(`
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
  `);
}

/**
 * Generate SVG path for a milestone diamond shape.
 * Matches the MilestoneDiamond component exactly.
 *
 * Returns an empty string for degenerate inputs (size ≤ 0) so callers can
 * safely skip rendering zero-size diamonds.
 *
 * @param centerX - Center X of the diamond in px
 * @param centerY - Center Y of the diamond in px
 * @param size - Half-width/half-height (radius) of the diamond in px
 * @returns SVG path `d` attribute string, or `""` for degenerate dimensions
 */
export function generateMilestonePath(
  centerX: number,
  centerY: number,
  size: number
): string {
  if (size <= 0) return "";

  return normalizePath(`
    M ${centerX} ${centerY - size}
    L ${centerX + size} ${centerY}
    L ${centerX} ${centerY + size}
    L ${centerX - size} ${centerY}
    Z
  `);
}

/**
 * Computed label position and styling for a task bar label.
 * Returned by {@link getLabelConfig}.
 */
export interface LabelConfig {
  /** X offset in px relative to the task bar's left edge */
  x: number;
  /** Y position in px (baseline-adjusted for visual vertical centering) */
  y: number;
  /** SVG text-anchor value */
  textAnchor: "start" | "end";
  /** CSS/SVG fill color for the label text */
  fill: string;
  /** Whether the label should be clipped to the task bar bounds */
  clip: boolean;
}

/**
 * Input parameters for {@link getLabelConfig}.
 */
export interface LabelConfigInput {
  /** Width of the task bar in px */
  taskWidth: number;
  /** Height of the task bar in px */
  taskHeight: number;
  /** Position of the label ("before", "inside", or "after") */
  labelPosition: "before" | "inside" | "after";
  /** Font size in px used for vertical offset calculation */
  fontSize: number;
  /** Optional task background color for dynamic contrast calculation (inside labels only) */
  taskColor?: string;
}

/**
 * Calculate label position and styling based on position mode.
 * Returns x offset relative to task bar start, y position, text anchor, fill color, and clip flag.
 *
 * @param input - {@link LabelConfigInput} describing the task bar geometry and label position
 * @returns {@link LabelConfig} describing where and how to render the label
 */
export function getLabelConfig(input: LabelConfigInput): LabelConfig {
  const { taskWidth, taskHeight, labelPosition, fontSize, taskColor } = input;
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
    default: {
      // TypeScript exhaustiveness check — this branch is unreachable at compile
      // time but provides a runtime guard if the union is ever widened or the
      // function is called via an unsafe cast.
      const _exhaustive: never = labelPosition;
      throw new Error(`Unknown labelPosition: ${String(_exhaustive)}`);
    }
  }
}
