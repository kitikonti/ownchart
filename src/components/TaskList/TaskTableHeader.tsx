/**
 * TaskTableHeader component - Renders the sticky header for the task table
 * Extracted to be used on App level for synchronized scrolling
 */

import { useMemo } from "react";
import { useTaskStore } from "../../store/slices/taskSlice";
import { TASK_COLUMNS } from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";

export function TaskTableHeader(): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);

  // Get total column width for proper scrolling
  const { totalColumnWidth } = useTableDimensions();

  const allSelected =
    tasks.length > 0 &&
    tasks.every((task) => selectedTaskIds.includes(task.id));
  const someSelected =
    tasks.some((task) => selectedTaskIds.includes(task.id)) && !allSelected;

  /**
   * Generate CSS grid template columns based on column widths.
   */
  const gridTemplateColumns = useMemo(() => {
    return TASK_COLUMNS.map((col) => {
      const customWidth = columnWidths[col.id];
      return customWidth ? `${customWidth}px` : col.defaultWidth;
    }).join(" ");
  }, [columnWidths]);

  /**
   * Get current width of a column in pixels.
   */
  const getColumnWidth = (columnId: string): number => {
    const customWidth = columnWidths[columnId];
    if (customWidth) return customWidth;

    const column = TASK_COLUMNS.find((col) => col.id === columnId);
    if (!column) return 100;

    const match = column.defaultWidth.match(/(\d+)px/);
    if (match) return parseInt(match[1], 10);

    return 200;
  };

  /**
   * Handle column resize.
   */
  const handleColumnResize = (columnId: string, width: number) => {
    setColumnWidth(columnId, width);
  };

  /**
   * Calculate optimal width for a column based on content.
   */
  const calculateOptimalWidth = (columnId: string): number => {
    const column = TASK_COLUMNS.find((col) => col.id === columnId);
    if (!column || !column.field) return 100;

    const field = column.field;
    let maxLength = column.label.length;

    tasks.forEach((task) => {
      let valueStr = "";

      if (column.formatter) {
        valueStr = column.formatter(task[field]);
      } else {
        valueStr = String(task[field]);
      }

      maxLength = Math.max(maxLength, valueStr.length);
    });

    const estimatedWidth = Math.max(60, maxLength * 8 + 40);
    return Math.min(estimatedWidth, 400);
  };

  /**
   * Handle auto-resize on double-click.
   */
  const handleAutoResize = (columnId: string) => {
    const optimalWidth = calculateOptimalWidth(columnId);
    setColumnWidth(columnId, optimalWidth);
  };

  const handleHeaderCheckboxClick = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  return (
    <div
      className="task-table-header-row bg-gray-50"
      style={{
        display: "grid",
        gridTemplateColumns,
        minWidth: totalColumnWidth,
      }}
      role="row"
    >
      {TASK_COLUMNS.map((column, index) => (
        <div
          key={column.id}
          className={`task-table-header-cell ${column.id === "name" ? "pr-3" : "px-3"} py-4 bg-gray-50 border-b ${column.id !== "color" ? "border-r" : ""} border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider relative`}
          role="columnheader"
        >
          {column.id === "checkbox" ? (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={handleHeaderCheckboxClick}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                title={allSelected ? "Deselect all" : "Select all"}
              />
            </div>
          ) : column.id === "color" ? (
            ""
          ) : (
            column.label
          )}
          {/* Column Resizer - not on last column */}
          {index < TASK_COLUMNS.length - 1 && (
            <ColumnResizer
              columnId={column.id}
              currentWidth={getColumnWidth(column.id)}
              onResize={handleColumnResize}
              onAutoResize={handleAutoResize}
              minWidth={40}
            />
          )}
        </div>
      ))}
    </div>
  );
}
