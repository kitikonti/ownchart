/**
 * RowNumberCell - Excel-style row number cell with hover controls.
 *
 * Features:
 * - Row number display (fixed position, doesn't move with task)
 * - Hover controls: drag handle, add row above/below buttons
 * - Click to select row, Shift+click for range selection
 * - Excel-like styling and cursor behavior
 */

import { useState, type MouseEvent } from "react";
import { DotsSixVertical } from "@phosphor-icons/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { HiddenRowIndicator } from "./HiddenRowIndicator";
import { InsertRowButton } from "./InsertRowButton";
import { dragState } from "./dragSelectionState";
import { COLORS, ROW_NUMBER, TYPOGRAPHY } from "../../styles/design-tokens";

// ── Layout constants ────────────────────────────────────────────────────────
const CONTROLS_WIDTH = 20;
const INSERT_LINE_THICKNESS = 2;
const INSERT_LINE_START = 18; // px from left, after the circle
const INSERT_LINE_EXTEND = -2000; // extends across entire table
const Z_INSERT_LINE = 60;
const SELECTION_RADIUS = "3px";

// Row number font sits between TYPOGRAPHY sm (12px) and base (14px)
const ROW_NUMBER_FONT_SIZE = "13px";

// ── Custom cursor (Excel-style right arrow) ─────────────────────────────────
function buildRowSelectCursor(fill: string, stroke: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='14' viewBox='0 0 18 14'><path d='M5 5 L5 9 L10 9 L10 13 L17 7 L10 1 L10 5 Z' fill='${fill}' stroke='${stroke}' stroke-width='1'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 17 7, pointer`;
}

const ROW_SELECT_CURSOR = buildRowSelectCursor(
  COLORS.neutral[900],
  COLORS.neutral[0]
);

// ── Color map (Outlook Blue theme) ──────────────────────────────────────────
const ROW_COLORS = {
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

// ── Props ───────────────────────────────────────────────────────────────────

interface RowNumberCellProps {
  /** Row number to display (1-based) */
  rowNumber: number;
  /** Task ID for this row */
  taskId: string;
  /** Whether this row is selected */
  isSelected: boolean;
  /** Position in selection for border-radius */
  selectionPosition?: {
    isFirstSelected: boolean;
    isLastSelected: boolean;
  };
  /** Hidden rows exist below this row (Excel-style double-line at bottom) */
  hasHiddenBelow?: boolean;
  /** Number of hidden rows below (for tooltip text) */
  hiddenBelowCount?: number;
  /** Callback to unhide hidden rows below */
  onUnhideBelow?: () => void;
  /** Select this row (Excel-style: normal=replace, Shift=range, Ctrl=toggle) */
  onSelectRow: (taskId: string, shiftKey: boolean, ctrlKey: boolean) => void;
  /** Insert a new row above this one */
  onInsertAbove?: () => void;
  /** Insert a new row below this one */
  onInsertBelow?: () => void;
  /** Density-aware row height */
  rowHeight: string;
  /** DnD attributes for drag handle */
  dragAttributes?: DraggableAttributes;
  /** DnD listeners for drag handle */
  dragListeners?: SyntheticListenerMap;
  /** Task name for accessibility */
  taskName?: string;
}

export function RowNumberCell({
  rowNumber,
  taskId,
  isSelected,
  selectionPosition,
  hasHiddenBelow = false,
  hiddenBelowCount,
  onUnhideBelow,
  onSelectRow,
  onInsertAbove,
  onInsertBelow,
  rowHeight,
  dragAttributes,
  dragListeners,
  taskName = "",
}: RowNumberCellProps): JSX.Element {
  const densityConfig = useDensityConfig();

  const [isHovered, setIsHovered] = useState(false);
  const [hoveredControl, setHoveredControl] = useState<
    "drag" | "addAbove" | "addBelow" | null
  >(null);

  // Handle drag selection - select range as mouse moves over rows
  const handleDragSelect = (targetTaskId: string): void => {
    if (dragState.startTaskId) {
      onSelectRow(targetTaskId, true, false); // Shift-style range selection
    }
  };

  // Start drag selection on mousedown (only on number area, not controls)
  const handleMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0 || hoveredControl !== null) return;

    dragState.isDragging = true;
    dragState.onDragSelect = handleDragSelect;

    // Only set anchor when NOT shift-clicking, so shift+click uses
    // the previous anchor (lastSelectedTaskId) for correct range selection
    if (!e.shiftKey) {
      dragState.startTaskId = taskId;
    }

    onSelectRow(taskId, e.shiftKey, e.ctrlKey || e.metaKey);
  };

  // Extend selection when mouse enters during drag
  const handleMouseEnter = (): void => {
    setIsHovered(true);

    if (dragState.isDragging && dragState.onDragSelect) {
      dragState.onDragSelect(taskId);
    }
  };

  // Determine cursor based on what's being hovered
  const getCursor = (): string => {
    if (hoveredControl === "drag") return "grab";
    if (hoveredControl === "addAbove" || hoveredControl === "addBelow")
      return "pointer";
    if (isHovered) return ROW_SELECT_CURSOR;
    return "default";
  };

  // Calculate border-radius for selected cells
  const getBorderRadius = (): string | undefined => {
    if (!isSelected) return undefined;
    const isFirst = selectionPosition?.isFirstSelected ?? true;
    const isLast = selectionPosition?.isLastSelected ?? true;
    return `${isFirst ? SELECTION_RADIUS : "0"} 0 0 ${isLast ? SELECTION_RADIUS : "0"}`;
  };

  return (
    <div
      className="row-number-cell relative select-none"
      style={{
        height: rowHeight,
        backgroundColor: isSelected
          ? ROW_COLORS.bgSelected
          : isHovered
            ? ROW_COLORS.bgHover
            : ROW_COLORS.bgInactive,
        borderRight: `1px solid ${ROW_COLORS.border}`,
        borderBottom: `1px solid ${ROW_COLORS.border}`,
        borderRadius: getBorderRadius(),
        cursor: getCursor(),
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: "8px",
        transition: "background-color 0.1s ease",
        overflow: "visible", // Allow insert line to extend beyond cell
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredControl(null);
      }}
      onMouseDown={handleMouseDown}
      role="gridcell"
      tabIndex={-1}
      aria-label={`Row ${rowNumber}${isSelected ? ", selected" : ""}`}
    >
      {/* Hover controls container - appears on left side */}
      {isHovered && (
        <div
          className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center"
          style={{ width: `${CONTROLS_WIDTH}px` }}
        >
          <InsertRowButton
            position="above"
            rowNumber={rowNumber}
            isActive={hoveredControl === "addAbove"}
            onInsert={onInsertAbove}
            onHoverStart={() => setHoveredControl("addAbove")}
            onHoverEnd={() => setHoveredControl(null)}
            controlsColor={ROW_COLORS.controlsColor}
          />

          {/* Drag handle */}
          <div
            className="flex items-center justify-center"
            style={{ cursor: "grab" }}
            onMouseEnter={() => setHoveredControl("drag")}
            onMouseLeave={() => setHoveredControl(null)}
            {...dragAttributes}
            {...dragListeners}
            aria-label={`Drag to reorder ${taskName || `row ${rowNumber}`}`}
          >
            <DotsSixVertical
              size={16}
              weight="bold"
              color={
                isSelected ? ROW_COLORS.textSelected : ROW_COLORS.textInactive
              }
            />
          </div>

          <InsertRowButton
            position="below"
            rowNumber={rowNumber}
            isActive={hoveredControl === "addBelow"}
            onInsert={onInsertBelow}
            onHoverStart={() => setHoveredControl("addBelow")}
            onHoverEnd={() => setHoveredControl(null)}
            controlsColor={ROW_COLORS.controlsColor}
          />
        </div>
      )}

      {/* Insert line above - starts after the circle, extends across entire table row */}
      {hoveredControl === "addAbove" && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-1px",
            left: `${INSERT_LINE_START}px`,
            right: `${INSERT_LINE_EXTEND}px`,
            height: `${INSERT_LINE_THICKNESS}px`,
            backgroundColor: ROW_COLORS.insertLineColor,
            zIndex: Z_INSERT_LINE,
          }}
        />
      )}

      {/* Insert line below - starts after the circle, extends across entire table row */}
      {hoveredControl === "addBelow" && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-1px",
            left: `${INSERT_LINE_START}px`,
            right: `${INSERT_LINE_EXTEND}px`,
            height: `${INSERT_LINE_THICKNESS}px`,
            backgroundColor: ROW_COLORS.insertLineColor,
            zIndex: Z_INSERT_LINE,
          }}
        />
      )}

      {/* Row number */}
      <span
        style={{
          color: isSelected ? ROW_COLORS.textSelected : ROW_COLORS.textInactive,
          fontWeight: isSelected
            ? TYPOGRAPHY.fontWeight.semibold
            : TYPOGRAPHY.fontWeight.normal,
          fontSize: ROW_NUMBER_FONT_SIZE,
          userSelect: "none",
        }}
      >
        {rowNumber}
      </span>

      {/* Excel-style double-line indicator for hidden rows below */}
      {hasHiddenBelow && (
        <HiddenRowIndicator
          rowHeight={densityConfig.rowHeight}
          hiddenBelowCount={hiddenBelowCount}
          onUnhideBelow={onUnhideBelow}
          controlsColor={ROW_COLORS.controlsColor}
          indicatorColor={ROW_COLORS.hiddenIndicator}
        />
      )}
    </div>
  );
}
