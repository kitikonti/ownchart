/**
 * SplitPaneDivider - Visual divider with drag handle for the split pane.
 */

interface SplitPaneDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export function SplitPaneDivider({
  onMouseDown,
  isDragging,
}: SplitPaneDividerProps) {
  return (
    <div
      className={`split-divider w-1 cursor-col-resize flex-shrink-0 bg-neutral-200 hover:bg-neutral-400 transition-colors duration-150 relative group ${isDragging ? "bg-neutral-500" : ""}`}
      onMouseDown={onMouseDown}
    >
      {/* Visual indicator on hover - extends hit area */}
      <div
        className={`absolute inset-y-0 -left-1 -right-1 ${isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      />
    </div>
  );
}
