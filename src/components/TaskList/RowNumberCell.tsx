/**
 * RowNumberCell - Excel-style row number cell with hover controls.
 *
 * Features:
 * - Row number display (fixed position, doesn't move with task)
 * - Hover controls: drag handle, add row above/below buttons
 * - Click to select row, Shift+click for range selection
 * - Excel-like styling and cursor behavior
 */

import { useState, useRef, useEffect, type MouseEvent } from "react";
import { DotsSixVertical, Plus } from "@phosphor-icons/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

// Global drag selection state (shared between all RowNumberCell instances)
// Exported so TaskTableRow can also respond to drag selection
export const dragState = {
  isDragging: false,
  startTaskId: null as string | null,
  onDragSelect: null as ((taskId: string) => void) | null,
};

// Custom cursor for row selection (Excel-style right arrow with shaft)
const ROW_SELECT_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='14' viewBox='0 0 18 14'%3E%3Cpath d='M5 5 L5 9 L10 9 L10 13 L17 7 L10 1 L10 5 Z' fill='black' stroke='white' stroke-width='1'/%3E%3C/svg%3E") 17 7, pointer`;

// OwnChart brand colors (Teal)
const COLORS = {
  // Inactive state
  bgInactive: "#F3F3F3",
  bgHover: "#E8E8E8",
  textInactive: "#5F6368",
  // Selected state - OwnChart teal
  bgSelected: "#008A99",
  textSelected: "#FFFFFF",
  // Hover controls - OwnChart teal
  controlsColor: "#008A99",
  insertLineColor: "#008A99",
  // Border
  border: "#E1E1E1",
};

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
  onSelectRow,
  onInsertAbove,
  onInsertBelow,
  rowHeight,
  dragAttributes,
  dragListeners,
  taskName = "",
}: RowNumberCellProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredControl, setHoveredControl] = useState<
    "drag" | "addAbove" | "addBelow" | null
  >(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // Handle drag selection - select range as mouse moves over rows
  const handleDragSelect = (targetTaskId: string) => {
    if (dragState.startTaskId) {
      onSelectRow(targetTaskId, true, false); // Shift-style range selection
    }
  };

  // Start drag selection on mousedown
  const handleMouseDown = (e: MouseEvent) => {
    // Only handle left mouse button on the number area, not on controls
    if (e.button !== 0 || hoveredControl === "drag") return;

    // Start drag selection
    dragState.isDragging = true;
    dragState.startTaskId = taskId;
    dragState.onDragSelect = handleDragSelect;

    // Select this row (replace selection on normal click)
    onSelectRow(taskId, e.shiftKey, e.ctrlKey || e.metaKey);
  };

  // Extend selection when mouse enters during drag
  const handleMouseEnter = () => {
    setIsHovered(true);

    // If dragging, extend selection to this row
    if (dragState.isDragging && dragState.onDragSelect) {
      dragState.onDragSelect(taskId);
    }
  };

  // End drag selection on mouseup (global listener)
  useEffect(() => {
    const handleMouseUp = () => {
      dragState.isDragging = false;
      dragState.startTaskId = null;
      dragState.onDragSelect = null;
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleInsertAbove = (e: MouseEvent) => {
    e.stopPropagation();
    onInsertAbove?.();
  };

  const handleInsertBelow = (e: MouseEvent) => {
    e.stopPropagation();
    onInsertBelow?.();
  };

  // Determine cursor based on what's being hovered
  const getCursor = () => {
    if (hoveredControl === "drag") return "grab";
    if (hoveredControl === "addAbove" || hoveredControl === "addBelow")
      return "pointer";
    if (isHovered) return ROW_SELECT_CURSOR; // Excel-style row select cursor
    return "default";
  };

  // Calculate border-radius for selected cells
  const getBorderRadius = () => {
    if (!isSelected) return undefined;
    const radius = "3px";
    const isFirst = selectionPosition?.isFirstSelected ?? true;
    const isLast = selectionPosition?.isLastSelected ?? true;
    return `${isFirst ? radius : "0"} 0 0 ${isLast ? radius : "0"}`;
  };

  return (
    <div
      ref={cellRef}
      className="row-number-cell relative select-none"
      style={{
        height: rowHeight,
        backgroundColor: isSelected
          ? COLORS.bgSelected
          : isHovered
            ? COLORS.bgHover
            : COLORS.bgInactive,
        borderRight: `1px solid ${COLORS.border}`,
        borderBottom: `1px solid ${COLORS.border}`,
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
          style={{ width: "20px" }}
        >
          {/* Add row above button */}
          <button
            className="flex items-center justify-center"
            style={{
              width: "18px",
              height: "18px",
              position: "absolute",
              top: "-9px",
              left: "1px",
              zIndex: 30,
            }}
            onMouseEnter={() => setHoveredControl("addAbove")}
            onMouseLeave={() => setHoveredControl(null)}
            onClick={handleInsertAbove}
            aria-label={`Insert row above row ${rowNumber}`}
          >
            {hoveredControl === "addAbove" ? (
              // Hover state: larger circle with plus
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  border: `1px solid ${COLORS.controlsColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={10} weight="bold" color={COLORS.controlsColor} />
              </div>
            ) : (
              // Normal state: small ring
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  border: `1px solid ${COLORS.controlsColor}`,
                }}
              />
            )}
          </button>

          {/* Drag handle */}
          <div
            className="flex items-center justify-center"
            style={{
              cursor: "grab",
            }}
            onMouseEnter={() => setHoveredControl("drag")}
            onMouseLeave={() => setHoveredControl(null)}
            {...dragAttributes}
            {...dragListeners}
            aria-label={`Drag to reorder ${taskName || `row ${rowNumber}`}`}
          >
            <DotsSixVertical
              size={16}
              weight="bold"
              color={isSelected ? COLORS.textSelected : COLORS.textInactive}
            />
          </div>

          {/* Add row below button */}
          <button
            className="flex items-center justify-center"
            style={{
              width: "18px",
              height: "18px",
              position: "absolute",
              bottom: "-9px",
              left: "1px",
              zIndex: 30,
            }}
            onMouseEnter={() => setHoveredControl("addBelow")}
            onMouseLeave={() => setHoveredControl(null)}
            onClick={handleInsertBelow}
            aria-label={`Insert row below row ${rowNumber}`}
          >
            {hoveredControl === "addBelow" ? (
              // Hover state: larger circle with plus
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  border: `1px solid ${COLORS.controlsColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={10} weight="bold" color={COLORS.controlsColor} />
              </div>
            ) : (
              // Normal state: small ring
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "white",
                  border: `1px solid ${COLORS.controlsColor}`,
                }}
              />
            )}
          </button>
        </div>
      )}

      {/* Insert line above - starts after the circle, extends across entire table row */}
      {hoveredControl === "addAbove" && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-1px",
            left: "18px", // Start after the circle
            right: "-2000px", // Extend across entire table
            height: "2px",
            backgroundColor: COLORS.insertLineColor,
            zIndex: 60,
          }}
        />
      )}

      {/* Insert line below - starts after the circle, extends across entire table row */}
      {hoveredControl === "addBelow" && (
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-1px",
            left: "18px", // Start after the circle
            right: "-2000px", // Extend across entire table
            height: "2px",
            backgroundColor: COLORS.insertLineColor,
            zIndex: 60,
          }}
        />
      )}

      {/* Row number */}
      <span
        style={{
          color: isSelected ? COLORS.textSelected : COLORS.textInactive,
          fontWeight: isSelected ? 600 : 400,
          fontSize: "13px",
          userSelect: "none",
        }}
      >
        {rowNumber}
      </span>
    </div>
  );
}
