/**
 * AppToolbar - Main application toolbar
 * Contains logo, task actions, and zoom controls
 */

import { ChartBarHorizontal, Plus } from "@phosphor-icons/react";
import { FileButtons } from "../Toolbar/FileButtons";
import { HierarchyButtons } from "../TaskList/HierarchyButtons";
import { UndoRedoButtons } from "../Toolbar/UndoRedoButtons";
import { ClipboardButtons } from "../Toolbar/ClipboardButtons";
import { InsertButtons } from "../Toolbar/InsertButtons";
import { ZoomControls } from "../Toolbar/ZoomControls";
import { ExportButton } from "../Toolbar/ExportButton";
import { HelpButton } from "../Toolbar/HelpButton";
import { useTaskStore } from "../../store/slices/taskSlice";

export function AppToolbar() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);

  const handleAddTask = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date: Date): string => {
      return date.toISOString().split("T")[0];
    };

    addTask({
      name: "New Task",
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
      duration: 7,
      progress: 0,
      color: "#3b82f6",
      order: tasks.length,
      type: "task",
      parent: undefined,
      metadata: {},
    });
  };

  return (
    <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center">
      {/* Logo */}
      <ChartBarHorizontal
        size={24}
        weight="regular"
        className="text-gray-700 mr-3"
      />

      {/* File Operations Group */}
      <div className="mr-2">
        <FileButtons />
      </div>

      {/* Undo/Redo Group */}
      <div className="mr-2">
        <UndoRedoButtons />
      </div>

      {/* Clipboard Operations Group */}
      <div className="mr-2">
        <ClipboardButtons />
      </div>

      {/* Insert Task Buttons */}
      <div className="mr-4">
        <InsertButtons />
      </div>

      {/* Task Actions Group */}
      <button
        onClick={handleAddTask}
        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1.5 mr-2"
        aria-label="Add new task"
      >
        <Plus size={16} weight="bold" />
        Add Task
      </button>

      {/* Hierarchy Controls */}
      <HierarchyButtons />

      {/* Separator */}
      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Export Button */}
      <div className="mr-2">
        <ExportButton />
      </div>

      {/* Spacer to push help and zoom controls to the right */}
      <div className="flex-1" />

      {/* Help Button */}
      <div className="mr-2">
        <HelpButton />
      </div>

      {/* Zoom Controls */}
      <ZoomControls />
    </header>
  );
}
