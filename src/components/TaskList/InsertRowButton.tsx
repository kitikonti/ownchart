/**
 * InsertRowButton — Small circle that expands on hover to show a "+" icon.
 * Used in RowNumberCell for inserting rows above/below.
 */

import { type MouseEvent } from "react";
import { Plus } from "@phosphor-icons/react";
import { ROW_NUMBER } from "../../styles/design-tokens";

// Insert button layout
const BUTTON_HIT_AREA = 18;
const BUTTON_OFFSET_LEFT = 1;
const CIRCLE_SIZE_HOVER = 14;
const CIRCLE_SIZE_DEFAULT = 7;
const Z_INSERT_BUTTON = 45;

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
      ? { top: `${-(BUTTON_HIT_AREA / 2)}px` }
      : { bottom: `${-(BUTTON_HIT_AREA / 2)}px` };

  return (
    <button
      className="flex items-center justify-center"
      style={{
        width: `${BUTTON_HIT_AREA}px`,
        height: `${BUTTON_HIT_AREA}px`,
        position: "absolute",
        ...positionStyle,
        left: `${BUTTON_OFFSET_LEFT}px`,
        zIndex: Z_INSERT_BUTTON,
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={handleClick}
      aria-label={`Insert row ${position} row ${rowNumber}`}
    >
      {isActive ? (
        <div
          style={{
            width: `${CIRCLE_SIZE_HOVER}px`,
            height: `${CIRCLE_SIZE_HOVER}px`,
            borderRadius: "50%",
            backgroundColor: ROW_NUMBER.controlBg,
            border: `1px solid ${controlsColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={10} weight="bold" color={controlsColor} />
        </div>
      ) : (
        <div
          style={{
            width: `${CIRCLE_SIZE_DEFAULT}px`,
            height: `${CIRCLE_SIZE_DEFAULT}px`,
            borderRadius: "50%",
            backgroundColor: ROW_NUMBER.controlBg,
            border: `1px solid ${controlsColor}`,
          }}
        />
      )}
    </button>
  );
}
