/**
 * TaskTypeIcon component.
 * Renders type-specific icons using Phosphor Icons.
 * Based on SVAR React Gantt pattern.
 *
 * When onClick is provided, the icon is wrapped in a keyboard-accessible
 * button so users can cycle task types via Enter/Space.
 */

import type { KeyboardEvent } from "react";
import { Folder, CheckSquare, Diamond } from "@phosphor-icons/react";
import type { TaskType } from "../../types/chart.types";

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

export function TaskTypeIcon({
  type = "task",
  onClick,
  className = "",
}: TaskTypeIconProps): JSX.Element {
  const iconClassName = `text-neutral-600 flex-shrink-0 ${className}`;

  const Icon =
    type === "summary" ? Folder : type === "milestone" ? Diamond : CheckSquare;

  const icon = (
    <Icon size={16} weight="light" className={iconClassName} aria-hidden />
  );

  // When interactive, wrap in an accessible button
  if (onClick) {
    const handleClick = (e: React.MouseEvent): void => {
      e.stopPropagation();
      onClick();
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }
    };

    return (
      <span
        role="button"
        tabIndex={0}
        aria-label={`Task type: ${TYPE_LABELS[type]}. Click to change`}
        className="inline-flex cursor-pointer hover:text-neutral-800 transition-colors"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {icon}
      </span>
    );
  }

  return icon;
}
