/**
 * TaskTypeIcon component.
 * Renders type-specific icons using Phosphor Icons.
 * Based on SVAR React Gantt pattern.
 */

import { Folder, CheckSquare, Diamond } from '@phosphor-icons/react';
import type { TaskType } from '../../types/chart.types';

interface TaskTypeIconProps {
  type?: TaskType;
}

export function TaskTypeIcon({ type = 'task' }: TaskTypeIconProps): JSX.Element {
  switch (type) {
    case 'summary':
      return <Folder size={16} weight="light" className="text-gray-600 flex-shrink-0" />;

    case 'milestone':
      return <Diamond size={16} weight="light" className="text-gray-600 flex-shrink-0" />;

    case 'task':
    default:
      return <CheckSquare size={16} weight="light" className="text-gray-600 flex-shrink-0" />;
  }
}
