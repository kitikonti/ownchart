/**
 * InsertLine — visual feedback line when hovering insert row buttons.
 * Extracted from RowNumberCell to DRY up the above/below variants.
 */

import { ROW_COLORS } from "./rowNumberConfig";

const INSERT_LINE_THICKNESS = 2;
const INSERT_LINE_START = 18; // px from left, after the circle
// Large negative px value for `right:` — extends the line across the full table width
const INSERT_LINE_RIGHT_EXTEND_PX = -2000;
const Z_INSERT_LINE = 60;

interface InsertLineProps {
  position: "above" | "below";
}

export function InsertLine({ position }: InsertLineProps): JSX.Element {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        [position === "above" ? "top" : "bottom"]: "-1px",
        left: `${INSERT_LINE_START}px`,
        right: `${INSERT_LINE_RIGHT_EXTEND_PX}px`,
        height: `${INSERT_LINE_THICKNESS}px`,
        backgroundColor: ROW_COLORS.insertLineColor,
        zIndex: Z_INSERT_LINE,
      }}
    />
  );
}
