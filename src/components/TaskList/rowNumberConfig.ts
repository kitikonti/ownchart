/**
 * RowNumberCell configuration — layout constants, colors, and cursor.
 * Extracted from RowNumberCell to keep the component under 200 LOC.
 */

import { COLORS, ROW_NUMBER, TYPOGRAPHY } from "../../styles/design-tokens";

// ── Layout constants ────────────────────────────────────────────────────────
export const CONTROLS_WIDTH = 20;
export const DRAG_HANDLE_ICON_SIZE = 16;
export const SELECTION_RADIUS = "3px";

// Row number font sits between TYPOGRAPHY sm (12px) and base (14px)
export const ROW_NUMBER_FONT_SIZE = "13px";

// Re-export for RowNumberCell's font weight usage
export const ROW_NUMBER_FONT_WEIGHT = TYPOGRAPHY.fontWeight;

// ── Custom cursor (Excel-style right arrow) ─────────────────────────────────
function buildRowSelectCursor(fill: string, stroke: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='14' viewBox='0 0 18 14'><path d='M5 5 L5 9 L10 9 L10 13 L17 7 L10 1 L10 5 Z' fill='${fill}' stroke='${stroke}' stroke-width='1'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 17 7, pointer`;
}

export const ROW_SELECT_CURSOR = buildRowSelectCursor(
  COLORS.neutral[900],
  COLORS.neutral[0]
);

// ── Color map (Outlook Blue theme) ──────────────────────────────────────────
export const ROW_COLORS = {
  bgInactive: ROW_NUMBER.bgInactive,
  bgHover: ROW_NUMBER.bgHover,
  textInactive: ROW_NUMBER.textInactive,
  bgSelected: COLORS.brand[600],
  textSelected: ROW_NUMBER.textSelected,
  controlsColor: COLORS.brand[600],
  insertLineColor: COLORS.brand[600],
  border: ROW_NUMBER.border,
  hiddenIndicator: ROW_NUMBER.hiddenIndicator,
};
