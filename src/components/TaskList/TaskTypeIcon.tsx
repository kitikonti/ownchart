/**
 * TaskTypeIcon component.
 * Renders type-specific icons using Phosphor Icons.
 * Based on SVAR React Gantt pattern.
 *
 * When onClick is provided, the icon is wrapped in a keyboard-accessible
 * button so users can cycle task types via Enter/Space.
 */

import { memo } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Folder, CheckSquare, Diamond } from "@phosphor-icons/react";
import type { TaskType } from "@/types/chart.types";

const TASK_TYPE_ICON_SIZE = 16;

/** Display labels for screen readers */
const TYPE_LABELS: Record<TaskType, string> = {
  task: "Task",
  summary: "Summary",
  milestone: "Milestone",
};

interface TaskTypeIconProps {
  type?: TaskType;
  onClick?: () => void;
  className?: string;
}

export const TaskTypeIcon = memo(function TaskTypeIcon({
  type = "task",
  onClick,
  className = "",
}: TaskTypeIconProps): JSX.Element {
  const iconClassName = `text-slate-600 flex-shrink-0 ${className}`;

  const Icon =
    type === "summary" ? Folder : type === "milestone" ? Diamond : CheckSquare;

  // Hoisted to avoid re-creating inside the conditional branch on every render
  const handleClick = (e: MouseEvent): void => {
    e.stopPropagation();
    onClick?.();
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onClick?.();
    }
  };

  // Hide from screen readers only when inside a button that already has an aria-label.
  // When rendered without onClick, the icon is the sole semantic element in the cell.
  const icon = (
    <Icon
      size={TASK_TYPE_ICON_SIZE}
      weight="light"
      className={iconClassName}
      aria-hidden={!!onClick}
    />
  );

  // When interactive, wrap in an accessible button
  if (onClick) {
    return (
      <button
        type="button"
        tabIndex={0}
        aria-label={`Task type: ${TYPE_LABELS[type]}. Click to change`}
        className="inline-flex cursor-pointer hover:text-slate-800 transition-colors bg-transparent border-0 p-0"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {icon}
      </button>
    );
  }

  return icon;
});
