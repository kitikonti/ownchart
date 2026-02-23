/**
 * InsertLine — visual feedback line when hovering insert row buttons.
 * Extracted from RowNumberCell to DRY up the above/below variants.
 */

import { ROW_COLORS } from "./rowNumberConfig";

const INSERT_LINE_THICKNESS = 2;
const INSERT_LINE_START = 18; // px from left, after the circle
const INSERT_LINE_EXTEND = -2000; // extends across entire table
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
        right: `${INSERT_LINE_EXTEND}px`,
        height: `${INSERT_LINE_THICKNESS}px`,
        backgroundColor: ROW_COLORS.insertLineColor,
        zIndex: Z_INSERT_LINE,
      }}
    />
  );
}
