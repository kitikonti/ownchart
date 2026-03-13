/**
 * InsertRowButton — Small circle that expands on hover to show a "+" icon.
 * Used in RowNumberCell for inserting rows above/below.
 */

import { memo, type MouseEvent } from "react";
import { Plus } from "@phosphor-icons/react";
import { ROW_NUMBER, Z_INDEX } from "@/styles/design-tokens";
import { INSERT_BUTTON_HIT_AREA } from "./rowNumberConfig";

// Insert button layout
const BUTTON_OFFSET_LEFT = 1; // 1px inset so the button circle doesn't clip the cell border
const BUTTON_POSITION_OFFSET = INSERT_BUTTON_HIT_AREA / 2; // centers button on row edge
const CIRCLE_SIZE_HOVER = 14; // expanded circle diameter on hover
const CIRCLE_SIZE_DEFAULT = CIRCLE_SIZE_HOVER / 2; // dot diameter at rest
const PLUS_ICON_SIZE = 10; // icon is smaller than the hover circle to leave padding

interface InsertRowButtonProps {
  /** Position relative to the row */
  position: "above" | "below";
  /** Row number for accessibility label */
  rowNumber: number;
  /** Whether this button is currently hovered */
  isActive: boolean;
  /** Insert callback */
  onInsert?: () => void;
  /** Called when mouse enters the button */
  onHoverStart: () => void;
  /** Called when mouse leaves the button */
  onHoverEnd: () => void;
  /** Brand color for the circle border and plus icon */
  controlsColor: string;
}

export const InsertRowButton = memo(function InsertRowButton({
  position,
  rowNumber,
  isActive,
  onInsert,
  onHoverStart,
  onHoverEnd,
  controlsColor,
}: InsertRowButtonProps): JSX.Element {
  const handleClick = (e: MouseEvent): void => {
    e.stopPropagation();
    onInsert?.();
  };

  const positionStyle =
    position === "above"
      ? { top: `${-BUTTON_POSITION_OFFSET}px` }
      : { bottom: `${-BUTTON_POSITION_OFFSET}px` };

  return (
    <button
      type="button"
      className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-full"
      style={{
        width: `${INSERT_BUTTON_HIT_AREA}px`,
        height: `${INSERT_BUTTON_HIT_AREA}px`,
        position: "absolute",
        ...positionStyle,
        left: `${BUTTON_OFFSET_LEFT}px`,
        zIndex: Z_INDEX.rowControls,
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={handleClick}
      aria-label={`Insert ${position} row ${rowNumber}`}
    >
      {isActive ? (
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: `${CIRCLE_SIZE_HOVER}px`,
            height: `${CIRCLE_SIZE_HOVER}px`,
            backgroundColor: ROW_NUMBER.controlBg,
            border: `1px solid ${controlsColor}`,
          }}
        >
          <Plus size={PLUS_ICON_SIZE} weight="bold" color={controlsColor} />
        </div>
      ) : (
        <div
          className="rounded-full"
          style={{
            width: `${CIRCLE_SIZE_DEFAULT}px`,
            height: `${CIRCLE_SIZE_DEFAULT}px`,
            backgroundColor: ROW_NUMBER.controlBg,
            border: `1px solid ${controlsColor}`,
          }}
        />
      )}
    </button>
  );
});
