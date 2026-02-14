/**
 * HiddenRowsIndicator - Thin dashed line showing where hidden tasks are.
 * Rendered between visible rows when there's a globalRowNumber gap.
 * Click to unhide the hidden tasks in that gap.
 */

/** Height of the indicator row in pixels */
export const HIDDEN_INDICATOR_HEIGHT = 6;

/** Color for the hidden row indicator dashed line (neutral-400) */
export const HIDDEN_INDICATOR_COLOR = "#9ca3af";

/** Describes a gap in the visible task list caused by hidden rows */
export interface HiddenRowGap {
  /** Index in the visible task array after which this gap appears */
  afterVisibleIndex: number;
  /** Number of hidden rows in this gap */
  count: number;
}

interface HiddenRowsIndicatorProps {
  /** Number of hidden rows in this gap */
  count: number;
  /** Callback to unhide tasks in this gap */
  onUnhide: () => void;
}

export function HiddenRowsIndicator({
  count,
  onUnhide,
}: HiddenRowsIndicatorProps): JSX.Element {
  return (
    <div
      className="hidden-rows-indicator col-span-full relative group cursor-pointer"
      style={{
        height: `${HIDDEN_INDICATOR_HEIGHT}px`,
        // Expand click target beyond visual height for easier interaction
        padding: "4px 0",
        margin: "-4px 0",
      }}
      role="button"
      tabIndex={0}
      aria-label={`Show ${count} hidden row${count !== 1 ? "s" : ""}`}
      title={`${count} hidden row${count !== 1 ? "s" : ""} — click to unhide`}
      onClick={onUnhide}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onUnhide();
        }
      }}
    >
      {/* Dashed line */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2"
        style={{
          borderTop: `1px dashed ${HIDDEN_INDICATOR_COLOR}`,
        }}
      />
      {/* Hover label */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] leading-none text-neutral-500 bg-white px-2 relative z-10">
          {count} hidden
        </span>
      </div>
    </div>
  );
}
