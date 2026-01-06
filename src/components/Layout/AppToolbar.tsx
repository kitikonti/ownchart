/**
 * AppToolbar - Main application toolbar
 * Contains logo, task actions, and zoom controls
 */

import { ChartBarHorizontal, Plus, Sliders } from "@phosphor-icons/react";
import { FileButtons } from "../Toolbar/FileButtons";
import { HierarchyButtons } from "../TaskList/HierarchyButtons";
import { UndoRedoButtons } from "../Toolbar/UndoRedoButtons";
import { ClipboardButtons } from "../Toolbar/ClipboardButtons";
import { InsertButtons } from "../Toolbar/InsertButtons";
import { ZoomControls } from "../Toolbar/ZoomControls";
import { ExportButton } from "../Toolbar/ExportButton";
import { PreferencesButton } from "../Toolbar/PreferencesButton";
import { HelpButton } from "../Toolbar/HelpButton";
import { QuickToggles } from "../Toolbar/QuickToggles";
import { useTaskStore } from "../../store/slices/taskSlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { useDensityConfig } from "../../store/slices/userPreferencesSlice";

export function AppToolbar() {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const openChartSettingsDialog = useUIStore(
    (state) => state.openChartSettingsDialog
  );
  const densityConfig = useDensityConfig();

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

      {/* Spacer to push controls to the right */}
      <div className="flex-1" />

      {/* Quick Toggle Buttons (Dependencies) */}
      <div className="mr-2">
        <QuickToggles />
      </div>

      {/* Separator */}
      <div className="mx-2 h-6 w-px bg-gray-200" />

      {/* Chart Settings Button */}
      <button
        type="button"
        onClick={openChartSettingsDialog}
        aria-label="Chart Settings"
        title="Chart Settings"
        className="flex items-center justify-center p-1.5 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <Sliders size={densityConfig.iconSize} weight="regular" />
      </button>

      {/* Preferences Button */}
      <div className="mr-2">
        <PreferencesButton />
      </div>

      {/* Help Button */}
      <div className="mr-2">
        <HelpButton />
      </div>

      {/* Zoom Controls */}
      <ZoomControls />
    </header>
  );
}
