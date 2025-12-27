/**
 * Table column configuration for the task spreadsheet.
 * Defines column properties, widths, and editing behavior.
 */

import type { EditableField } from '../store/slices/taskSlice';
import type { ValidationResult } from '../utils/validation';
import {
  validateTaskName,
  validateDateString,
  validateProgress,
  validateColor,
} from '../utils/validation';

/**
 * Column renderer types.
 */
export type CellRenderer = 'text' | 'date' | 'number' | 'color' | 'custom';

/**
 * Column definition interface.
 */
export interface ColumnDefinition {
  /** Unique column identifier */
  id: string;

  /** Task field name (null for non-data columns like drag handle) */
  field?: EditableField;

  /** Column header label */
  label: string;

  /** Default column width (CSS grid value) */
  defaultWidth: string;

  /** Whether the column is editable */
  editable: boolean;

  /** Cell renderer type */
  renderer?: CellRenderer;

  /** Validation function for the field */
  validator?: (value: unknown) => ValidationResult;

  /** Formatter function to display value */
  formatter?: (value: unknown) => string;
}

/**
 * Task table column definitions.
 */
export const TASK_COLUMNS: ColumnDefinition[] = [
  {
    id: 'dragHandle',
    label: '',
    defaultWidth: '40px',
    editable: false,
    renderer: 'custom',
  },
  {
    id: 'checkbox',
    label: '',
    defaultWidth: '48px',
    editable: false,
    renderer: 'custom',
  },
  {
    id: 'color',
    field: 'color',
    label: '',
    defaultWidth: '32px',
    editable: true,
    renderer: 'color',
    validator: (value) => validateColor(String(value)),
  },
  {
    id: 'name',
    field: 'name',
    label: 'Task Name',
    defaultWidth: 'minmax(200px, 1fr)',
    editable: true,
    renderer: 'text',
    validator: (value) => validateTaskName(String(value)),
  },
  {
    id: 'startDate',
    field: 'startDate',
    label: 'Start Date',
    defaultWidth: '130px',
    editable: true,
    renderer: 'date',
    validator: (value) => validateDateString(String(value)),
  },
  {
    id: 'endDate',
    field: 'endDate',
    label: 'End Date',
    defaultWidth: '130px',
    editable: true,
    renderer: 'date',
    validator: (value) => validateDateString(String(value)),
  },
  {
    id: 'duration',
    field: 'duration',
    label: 'Duration',
    defaultWidth: '100px',
    editable: true, // Editable per user request
    renderer: 'number',
    validator: (value) => {
      const num = Number(value);
      if (isNaN(num) || num < 1) {
        return { valid: false, error: 'Duration must be at least 1 day' };
      }
      return { valid: true };
    },
    formatter: (value) => `${value} ${Number(value) === 1 ? 'day' : 'days'}`,
  },
  {
    id: 'progress',
    field: 'progress',
    label: 'Progress',
    defaultWidth: '100px',
    editable: true,
    renderer: 'number',
    validator: (value) => validateProgress(Number(value)),
    formatter: (value) => `${value}%`,
  },
  {
    id: 'delete',
    label: '',
    defaultWidth: '40px',
    editable: false,
    renderer: 'custom',
  },
];
