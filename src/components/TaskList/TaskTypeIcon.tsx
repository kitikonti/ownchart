/**
 * TaskTypeIcon component.
 * Renders type-specific icons using Heroicons.
 * Based on SVAR React Gantt pattern.
 */

import { FolderIcon, DocumentIcon, FlagIcon } from '@heroicons/react/24/outline';
import type { TaskType } from '../../types/chart.types';

interface TaskTypeIconProps {
  type?: TaskType;
}

export function TaskTypeIcon({ type = 'task' }: TaskTypeIconProps): JSX.Element {
  switch (type) {
    case 'summary':
      return <FolderIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />;

    case 'milestone':
      return <FlagIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />;

    case 'task':
    default:
      return <DocumentIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
}
