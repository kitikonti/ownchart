/**
 * TaskTypeIcon component.
 * Renders type-specific icons using Phosphor Icons.
 * Based on SVAR React Gantt pattern.
 */

import { Folder, CheckSquare, Diamond } from "@phosphor-icons/react";
import type { TaskType } from "../../types/chart.types";

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
  const iconClassName = `text-neutral-600 flex-shrink-0 ${onClick ? "cursor-pointer hover:text-neutral-800 transition-colors" : ""} ${className}`;

  const handleClick = (e: React.MouseEvent): void => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  switch (type) {
    case "summary":
      return (
        <Folder
          size={16}
          weight="light"
          className={iconClassName}
          onClick={handleClick}
        />
      );

    case "milestone":
      return (
        <Diamond
          size={16}
          weight="light"
          className={iconClassName}
          onClick={handleClick}
        />
      );

    case "task":
    default:
      return (
        <CheckSquare
          size={16}
          weight="light"
          className={iconClassName}
          onClick={handleClick}
        />
      );
  }
}
