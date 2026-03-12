/**
 * InsertLine — visual feedback line when hovering insert row buttons.
 * Extracted from RowNumberCell to DRY up the above/below variants.
 */

import { Z_INDEX } from "../../styles/design-tokens";
import { ROW_COLORS } from "./rowNumberConfig";

const INSERT_LINE_THICKNESS = 2;
const INSERT_LINE_START = 18; // px from left, after the insert-button circle
// Intentionally large negative `right` value so the line visually extends across
// both the task-list panel and the timeline/chart panel, regardless of viewport width.
// A CSS-only solution (e.g. width: 100vw) would require overflow:visible on every
// ancestor, which is not feasible here. 9999px covers any realistic screen width.
const INSERT_LINE_RIGHT_EXTEND_PX = -9999;

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
        zIndex: Z_INDEX.insertLine,
      }}
    />
  );
}
