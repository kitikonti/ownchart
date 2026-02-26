/**
 * Shared cell styling utilities for the task table.
 *
 * Used by Cell.tsx and NewTaskPlaceholderRow.tsx to avoid duplicating
 * density-aware CSS custom property logic.
 */

import type { CSSProperties } from "react";
import { NAME_COLUMN_ID } from "../config/tableColumns";
import { CELL, Z_INDEX } from "./design-tokens";

/**
 * Density-aware cell style using CSS custom properties.
 * Name column omits paddingLeft because hierarchy indentation handles it.
 */
export function getCellStyle(columnId: string): CSSProperties {
  return {
    height: "var(--density-row-height)",
    paddingTop: "var(--density-cell-padding-y)",
    paddingBottom: "var(--density-cell-padding-y)",
    paddingLeft:
      columnId === NAME_COLUMN_ID ? undefined : "var(--density-cell-padding-x)",
    paddingRight: "var(--density-cell-padding-x)",
    fontSize: "var(--density-font-size-cell)",
  };
}

/**
 * Active/editing cell style — extends base cell style with brand-colored inset shadow.
 */
export function getActiveCellStyle(columnId: string): CSSProperties {
  return {
    ...getCellStyle(columnId),
    boxShadow: CELL.activeBorderShadow,
    zIndex: Z_INDEX.cellActive,
  };
}

/**
 * Editing cell style — extends base cell style with brand-colored inset shadow
 * and elevated z-index to sit above active cells.
 */
export function getEditingCellStyle(columnId: string): CSSProperties {
  return {
    ...getCellStyle(columnId),
    boxShadow: CELL.activeBorderShadow,
    zIndex: Z_INDEX.cellEditing,
  };
}
