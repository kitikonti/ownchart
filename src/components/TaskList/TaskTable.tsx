/**
 * TaskTable container component.
 * Excel-like spreadsheet table for task management.
 * Supports hidden rows with Excel-style row number gaps and indicator lines.
 */

import { useMemo, useState, useCallback, Fragment } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EyeSlash } from "@phosphor-icons/react";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";
import { TaskTableRow } from "./TaskTableRow";
import { NewTaskPlaceholderRow } from "./NewTaskPlaceholderRow";
import { HiddenRowsIndicator } from "./HiddenRowsIndicator";
import {
  getDensityAwareWidth,
  getVisibleColumns,
} from "../../config/tableColumns";
import { ColumnResizer } from "./ColumnResizer";
import { useTableDimensions } from "../../hooks/useTableDimensions";
import { useFlattenedTasks } from "../../hooks/useFlattenedTasks";
import { useAutoColumnWidth } from "../../hooks/useAutoColumnWidth";
import { useHideOperations } from "../../hooks/useHideOperations";
import {
  ContextMenu,
  type ContextMenuPosition,
} from "../ContextMenu/ContextMenu";

interface TaskTableProps {
  hideHeader?: boolean;
}

export function TaskTable({ hideHeader = true }: TaskTableProps): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const reorderTasks = useTaskStore((state) => state.reorderTasks);
  const columnWidths = useTaskStore((state) => state.columnWidths);
  const setColumnWidth = useTaskStore((state) => state.setColumnWidth);
  const autoFitColumn = useTaskStore((state) => state.autoFitColumn);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const selectAllTasks = useTaskStore((state) => state.selectAllTasks);
  const clearSelection = useTaskStore((state) => state.clearSelection);
  const clipboardTaskIds = useTaskStore((state) => state.clipboardTaskIds);
  const densityConfig = useDensityConfig();
  const hiddenColumns = useChartStore((state) => state.hiddenColumns);
  const hiddenTaskIds = useChartStore((state) => state.hiddenTaskIds);

  // Centralized hide/unhide operations (command recording, dirty, toast)
  const { hideRows, showAll, unhideRange } = useHideOperations();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    taskId?: string;
  } | null>(null);

  // Get visible columns based on settings
  const visibleColumns = useMemo(
    () => getVisibleColumns(hiddenColumns),
    [hiddenColumns]
  );

  // Get total column width for proper scrolling
  const { totalColumnWidth } = useTableDimensions();

  // Build flattened list respecting collapsed state (centralized in hook)
  const { flattenedTasks, allFlattenedTasks } = useFlattenedTasks();

  // Extract visible task IDs in display order (for correct range selection)
  const visibleTaskIds = useMemo(
    () => flattenedTasks.map(({ task }) => task.id),
    [flattenedTasks]
  );

  // Auto-fit columns when density or task content changes
  useAutoColumnWidth();

  // Build sets for quick lookup
  const clipboardSet = useMemo(
    () => new Set(clipboardTaskIds),
    [clipboardTaskIds]
  );
  const selectedSet = useMemo(
    () => new Set(selectedTaskIds),
    [selectedTaskIds]
  );

  const allSelected =
    tasks.length > 0 &&
    tasks.every((task) => selectedTaskIds.includes(task.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderTasks(String(active.id), String(over.id));
    }
  };

  const handleHeaderCheckboxClick = (): void => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAllTasks();
    }
  };

  /** Handle right-click on a task row */
  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, taskId: string): void => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        taskId,
      });
    },
    []
  );

  /** Build context menu items */
  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];

    const items = [];

    if (contextMenu.taskId) {
      const taskIdsToHide =
        selectedTaskIds.length > 0 &&
        selectedTaskIds.includes(contextMenu.taskId)
          ? selectedTaskIds
          : [contextMenu.taskId];

      const count = taskIdsToHide.length;
      items.push({
        id: "hide",
        label: count > 1 ? `Hide ${count} Rows` : "Hide Row",
        icon: <EyeSlash size={14} weight="regular" />,
        onClick: () => hideRows(taskIdsToHide),
      });
    }

    return items;
  }, [contextMenu, selectedTaskIds, hideRows]);

  /**
   * Generate CSS grid template columns based on column widths.
   */
  const gridTemplateColumns = useMemo(() => {
    return visibleColumns
      .map((col) => {
        const customWidth = columnWidths[col.id];
        return customWidth
          ? `${customWidth}px`
          : getDensityAwareWidth(col.id, densityConfig);
      })
      .join(" ");
  }, [columnWidths, densityConfig, visibleColumns]);

  /**
   * Get current width of a column in pixels.
   */
  const getColumnWidth = (columnId: string): number => {
    const customWidth = columnWidths[columnId];
    if (customWidth) return customWidth;

    const densityWidth = getDensityAwareWidth(columnId, densityConfig);
    const match = densityWidth.match(/(\d+)px/);
    if (match) return parseInt(match[1], 10);

    const minmaxMatch = densityWidth.match(/minmax\((\d+)px/);
    if (minmaxMatch) return parseInt(minmaxMatch[1], 10);

    return 200;
  };

  const handleColumnResize = (columnId: string, width: number): void => {
    setColumnWidth(columnId, width);
  };

  // Compute trailing gap (hidden rows after last visible task)
  const trailingGap = useMemo(() => {
    if (flattenedTasks.length === 0) return 0;
    const lastVisible = flattenedTasks[flattenedTasks.length - 1];
    return allFlattenedTasks.length - lastVisible.globalRowNumber;
  }, [flattenedTasks, allFlattenedTasks]);

  return (
    <div className="task-table-container bg-white border-r border-neutral-200 select-none">
      {/* Table Content - no overflow here, handled by parent */}
      <div className="task-table-wrapper">
        <div
          className="task-table"
          style={{
            display: "grid",
            gridTemplateColumns,
            minWidth: totalColumnWidth,
          }}
          role="grid"
          aria-label="Task spreadsheet"
        >
          {/* Header Row - Hidden when rendered on App level */}
          {!hideHeader && (
            <div className="task-table-header contents" role="row">
              {visibleColumns.map((column) => (
                <div
                  key={column.id}
                  className={`task-table-header-cell sticky top-0 z-10 ${column.id === "name" ? "pr-3" : "px-3"} py-4 bg-neutral-50 border-b ${column.id !== "color" ? "border-r" : ""} border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider relative`}
                  role="columnheader"
                >
                  {column.id === "rowNumber" ? (
                    <button
                      onClick={handleHeaderCheckboxClick}
                      className="w-full h-full flex items-center justify-center"
                      title={allSelected ? "Deselect all" : "Select all"}
                      aria-label={
                        allSelected ? "Deselect all tasks" : "Select all tasks"
                      }
                    />
                  ) : column.id === "color" ? (
                    ""
                  ) : (
                    column.label
                  )}
                  {/* Column Resizer - only for name column */}
                  {column.id === "name" && (
                    <ColumnResizer
                      columnId={column.id}
                      currentWidth={getColumnWidth(column.id)}
                      onResize={handleColumnResize}
                      onAutoResize={autoFitColumn}
                      minWidth={100}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Task Rows with Drag and Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flattenedTasks.map(({ task }) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {flattenedTasks.map(
                ({ task, level, hasChildren, globalRowNumber }, index) => {
                  const isInClipboard = clipboardSet.has(task.id);
                  const prevTask = index > 0 ? flattenedTasks[index - 1] : null;
                  const nextTask =
                    index < flattenedTasks.length - 1
                      ? flattenedTasks[index + 1]
                      : null;

                  // Check if previous/next tasks are also in clipboard
                  const prevInClipboard = prevTask
                    ? clipboardSet.has(prevTask.task.id)
                    : false;
                  const nextInClipboard = nextTask
                    ? clipboardSet.has(nextTask.task.id)
                    : false;

                  // Check if previous/next tasks are also selected
                  const isSelected = selectedSet.has(task.id);
                  const prevSelected = prevTask
                    ? selectedSet.has(prevTask.task.id)
                    : false;
                  const nextSelected = nextTask
                    ? selectedSet.has(nextTask.task.id)
                    : false;

                  // Detect gap before this row (hidden rows indicator)
                  const prevRowNum = prevTask ? prevTask.globalRowNumber : 0;
                  const gap = globalRowNumber - prevRowNum - 1;

                  return (
                    <Fragment key={task.id}>
                      {gap > 0 && (
                        <HiddenRowsIndicator
                          count={gap}
                          onUnhide={() =>
                            unhideRange(prevRowNum, globalRowNumber)
                          }
                        />
                      )}
                      <div
                        onContextMenu={(e) => handleRowContextMenu(e, task.id)}
                        className="contents"
                      >
                        <TaskTableRow
                          task={task}
                          globalRowNumber={globalRowNumber}
                          level={level}
                          hasChildren={hasChildren}
                          visibleTaskIds={visibleTaskIds}
                          clipboardPosition={
                            isInClipboard
                              ? {
                                  isFirst: !prevInClipboard,
                                  isLast: !nextInClipboard,
                                }
                              : undefined
                          }
                          selectionPosition={
                            isSelected
                              ? {
                                  isFirstSelected: !prevSelected,
                                  isLastSelected: !nextSelected,
                                }
                              : undefined
                          }
                        />
                      </div>
                    </Fragment>
                  );
                }
              )}
            </SortableContext>
          </DndContext>

          {/* Hidden rows at the end (after last visible task) */}
          {trailingGap > 0 && (
            <HiddenRowsIndicator
              count={trailingGap}
              onUnhide={() => {
                const lastVisible = flattenedTasks[flattenedTasks.length - 1];
                unhideRange(
                  lastVisible.globalRowNumber,
                  allFlattenedTasks.length + 1
                );
              }}
            />
          )}

          {/* All tasks hidden — show single indicator to unhide all */}
          {flattenedTasks.length === 0 && hiddenTaskIds.length > 0 && (
            <HiddenRowsIndicator
              count={hiddenTaskIds.length}
              onUnhide={showAll}
            />
          )}

          {/* Placeholder row for adding new tasks */}
          <NewTaskPlaceholderRow />
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          items={contextMenuItems}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
