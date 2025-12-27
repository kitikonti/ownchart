/**
 * TaskTypeIcon component.
 * Renders type-specific icons using Phosphor Icons.
 * Based on SVAR React Gantt pattern.
 */

import { Folder, File, Flag } from '@phosphor-icons/react';
import type { TaskType } from '../../types/chart.types';

interface TaskTypeIconProps {
  type?: TaskType;
}

export function TaskTypeIcon({ type = 'task' }: TaskTypeIconProps): JSX.Element {
  switch (type) {
    case 'summary':
      return <Folder size={16} weight="regular" className="text-blue-600 flex-shrink-0" />;

    case 'milestone':
      return <Flag size={16} weight="regular" className="text-purple-600 flex-shrink-0" />;

    case 'task':
    default:
      return <File size={16} weight="regular" className="text-gray-500 flex-shrink-0" />;
  }
}
