/**
 * InsertRowButton — Small circle that expands on hover to show a "+" icon.
 * Used in RowNumberCell for inserting rows above/below.
 */

import { type MouseEvent } from "react";
import { Plus } from "@phosphor-icons/react";
import { ROW_NUMBER, Z_INDEX } from "../../styles/design-tokens";

// Insert button layout
const BUTTON_HIT_AREA = 18;
const BUTTON_OFFSET_LEFT = 1;
const BUTTON_POSITION_OFFSET = BUTTON_HIT_AREA / 2; // centers button on row edge
const CIRCLE_SIZE_HOVER = 14;
const CIRCLE_SIZE_DEFAULT = 7;

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

export function InsertRowButton({
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
        width: `${BUTTON_HIT_AREA}px`,
        height: `${BUTTON_HIT_AREA}px`,
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
          <Plus size={10} weight="bold" color={controlsColor} />
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
}
