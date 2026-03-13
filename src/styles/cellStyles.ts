/**
 * Shared cell styling utilities for the task table.
 *
 * Used by Cell.tsx and NewTaskPlaceholderRow.tsx to avoid duplicating
 * density-aware CSS custom property logic.
 */

import type { CSSProperties } from "react";
import { CELL, Z_INDEX } from "./design-tokens";
import { NAME_COLUMN_ID } from "@/config/tableColumns";

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
 * Shared base for active/editing cell styles.
 * Both states use the same brand-colored inset shadow; they differ only in z-index
 * (cellEditing sits above cellActive so the editing input is never obscured).
 */
function buildFocusedCellStyle(
  columnId: string,
  zIndex: number
): CSSProperties {
  return {
    ...getCellStyle(columnId),
    boxShadow: CELL.activeBorderShadow,
    zIndex,
  };
}

/**
 * Active (focused but not editing) cell style — brand-colored inset shadow.
 */
export function getActiveCellStyle(columnId: string): CSSProperties {
  return buildFocusedCellStyle(columnId, Z_INDEX.cellActive);
}

/**
 * Editing cell style — brand-colored inset shadow with elevated z-index
 * so the editing input sits above adjacent active cells.
 */
export function getEditingCellStyle(columnId: string): CSSProperties {
  return buildFocusedCellStyle(columnId, Z_INDEX.cellEditing);
}
