/**
 * RowNumberCell - Excel-style row number cell with hover controls.
 *
 * Features:
 * - Row number display (fixed position, doesn't move with task)
 * - Hover controls: drag handle, add row above/below buttons
 * - Click to select row, Shift+click for range selection
 * - Excel-like styling and cursor behavior
 */

import {
  memo,
  useCallback,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { DotsSixVertical } from "@phosphor-icons/react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { TRANSITIONS } from "../../styles/design-tokens";
import { HiddenRowIndicator } from "./HiddenRowIndicator";
import { InsertRowButton } from "./InsertRowButton";
import { InsertLine } from "./InsertLine";
import { dragState } from "./dragSelectionState";
import {
  CONTROLS_WIDTH,
  DRAG_HANDLE_ICON_SIZE,
  SELECTION_RADIUS,
  ROW_NUMBER_FONT_SIZE,
  ROW_NUMBER_FONT_WEIGHT,
  ROW_SELECT_CURSOR,
  ROW_COLORS,
} from "./rowNumberConfig";

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
  /** Task name for drag handle accessibility label */
  taskName?: string;
}

/** Which hover control is active — used for cursor and highlight state. */
type HoveredControl = "drag" | "addAbove" | "addBelow" | null;

export const RowNumberCell = memo(function RowNumberCell({
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
  taskName,
}: RowNumberCellProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const [hoveredControl, setHoveredControl] = useState<HoveredControl>(null);
  const showControls = isHovered || isFocusedWithin;

  // Stabilized hover-control callbacks (safe for future memo on child components)
  const handleHoverDrag = useCallback(
    (): void => setHoveredControl("drag"),
    []
  );
  const handleHoverAbove = useCallback(
    (): void => setHoveredControl("addAbove"),
    []
  );
  const handleHoverBelow = useCallback(
    (): void => setHoveredControl("addBelow"),
    []
  );
  const handleHoverEnd = useCallback((): void => setHoveredControl(null), []);

  // Handle drag selection — select range as mouse moves over rows.
  // This callback is stored in dragState.onDragSelect during mousedown on THIS row,
  // then invoked by OTHER rows on mouseEnter. It captures THIS row's onSelectRow,
  // which works correctly because onSelectRow is a store-backed action that accepts
  // any taskId (it's not specific to this row).
  const handleDragSelect = (targetTaskId: string): void => {
    if (dragState.startTaskId) {
      onSelectRow(targetTaskId, true, false);
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

  // Clear hover state when mouse leaves the cell
  const handleMouseLeave = (): void => {
    setIsHovered(false);
    setHoveredControl(null);
  };

  // Show controls when cell receives keyboard focus
  const handleFocus = useCallback((): void => setIsFocusedWithin(true), []);

  // Hide controls when keyboard focus leaves the cell entirely
  const handleBlur = useCallback((e: FocusEvent): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsFocusedWithin(false);
      setHoveredControl(null);
    }
  }, []);

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
    if (showControls) return ROW_SELECT_CURSOR;
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
      className="row-number-cell relative select-none flex items-center justify-end overflow-visible pr-2"
      style={{
        height: rowHeight,
        backgroundColor: isSelected
          ? ROW_COLORS.bgSelected
          : showControls
            ? ROW_COLORS.bgHover
            : ROW_COLORS.bgInactive,
        borderRight: `1px solid ${ROW_COLORS.border}`,
        borderBottom: `1px solid ${ROW_COLORS.border}`,
        borderRadius: getBorderRadius(),
        cursor: getCursor(),
        transition: `background-color ${TRANSITIONS.fast}`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      role="gridcell"
      tabIndex={-1}
      aria-label={`Row ${rowNumber}${isSelected ? ", selected" : ""}`}
    >
      {/* Hover/focus controls container - appears on left side */}
      {showControls && (
        <div
          className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center"
          style={{ width: `${CONTROLS_WIDTH}px` }}
        >
          <InsertRowButton
            position="above"
            rowNumber={rowNumber}
            isActive={hoveredControl === "addAbove"}
            onInsert={onInsertAbove}
            onHoverStart={handleHoverAbove}
            onHoverEnd={handleHoverEnd}
            controlsColor={ROW_COLORS.controlsColor}
          />

          {/* Drag handle — fallback a11y attrs when DnD attributes not provided */}
          <div
            className="flex items-center justify-center"
            style={{ cursor: "grab" }}
            onMouseEnter={handleHoverDrag}
            onMouseLeave={handleHoverEnd}
            role={dragAttributes ? undefined : "button"}
            tabIndex={dragAttributes ? undefined : 0}
            {...dragAttributes}
            {...dragListeners}
            aria-label={`Drag to reorder ${taskName ?? `row ${rowNumber}`}`}
          >
            <DotsSixVertical
              size={DRAG_HANDLE_ICON_SIZE}
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
            onHoverStart={handleHoverBelow}
            onHoverEnd={handleHoverEnd}
            controlsColor={ROW_COLORS.controlsColor}
          />
        </div>
      )}

      {/* Insert line — visual feedback when hovering add-row buttons */}
      {hoveredControl === "addAbove" && <InsertLine position="above" />}
      {hoveredControl === "addBelow" && <InsertLine position="below" />}

      {/* Row number */}
      <span
        style={{
          color: isSelected ? ROW_COLORS.textSelected : ROW_COLORS.textInactive,
          fontWeight: isSelected
            ? ROW_NUMBER_FONT_WEIGHT.semibold
            : ROW_NUMBER_FONT_WEIGHT.normal,
          fontSize: ROW_NUMBER_FONT_SIZE,
        }}
      >
        {rowNumber}
      </span>

      {/* Excel-style double-line indicator for hidden rows below */}
      {hasHiddenBelow && (
        <HiddenRowIndicator
          hiddenBelowCount={hiddenBelowCount}
          onUnhideBelow={onUnhideBelow}
          controlsColor={ROW_COLORS.controlsColor}
          indicatorColor={ROW_COLORS.hiddenIndicator}
        />
      )}
    </div>
  );
});
