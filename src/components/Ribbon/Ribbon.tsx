/**
 * Ribbon - MS Office-style ribbon menu
 *
 * Design: Collapsed ribbon with tab navigation and icon toolbar
 *
 * Layout Structure:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ [Logo] │ File │ Home │ View │ Help │                      right actions │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ [Tab-specific toolbar content - 40px height]                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { useState } from "react";
import {
  Plus,
  ArrowCounterClockwise,
  ArrowClockwise,
  Copy,
  Scissors,
  ClipboardText,
  Trash,
  RowsPlusTop,
  RowsPlusBottom,
  TextOutdent,
  TextIndent,
  FlowArrow,
  Question,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutLineHorizontal,
  ArrowsOutLineVertical,
  CalendarDot,
  CalendarDots,
  Island,
  TrendUp,
  Tag,
  Calendar,
  NumberSquareOne,
  Hash,
  SidebarSimple,
} from "@phosphor-icons/react";

import OwnChartLogo from "../../assets/logo.svg?react";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";
import { ToolbarDropdown } from "../Toolbar/ToolbarDropdown";
import { ColorModeDropdown } from "./ColorModeDropdown";
import { ColorOptionsDropdown } from "./ColorOptionsDropdown";
import { RegenerateButton } from "./RegenerateButton";
import { HolidayRegionPopover } from "./HolidayRegionPopover";
import { WorkingDaysDropdown } from "./WorkingDaysDropdown";
import { ColumnsDropdown } from "./ColumnsDropdown";
import { InlineProjectTitle } from "./InlineProjectTitle";
import { ZoomDropdown } from "./ZoomDropdown";
import { FileMenu } from "./FileMenu";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { useHistoryStore } from "../../store/slices/historySlice";
import { useUIStore } from "../../store/slices/uiSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import { useFileOperations } from "../../hooks/useFileOperations";
import { useClipboardOperations } from "../../hooks/useClipboardOperations";
import { getViewportCenterAnchor, applyScrollLeft } from "../../hooks/useZoom";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";
import {
  LABEL_OPTIONS,
  DENSITY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  FIRST_DAY_OF_WEEK_OPTIONS,
  WEEK_NUMBERING_OPTIONS,
} from "../../config/preferencesOptions";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

type RibbonTab = "home" | "view" | "help";

// Preset zoom levels
const PRESET_ZOOM_LEVELS = [5, 10, 25, 50, 75, 100, 150, 200, 300];

export function Ribbon(): JSX.Element {
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");

  // ─────────────────────────────────────────────────────────────────────────
  // Store Hooks
  // ─────────────────────────────────────────────────────────────────────────

  // Task store
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  const selectedTaskIds = useTaskStore((state) => state.selectedTaskIds);
  const activeCell = useTaskStore((state) => state.activeCell);
  const insertTaskAbove = useTaskStore((state) => state.insertTaskAbove);
  const insertTaskBelow = useTaskStore((state) => state.insertTaskBelow);
  const deleteSelectedTasks = useTaskStore(
    (state) => state.deleteSelectedTasks
  );
  const indentSelectedTasks = useTaskStore(
    (state) => state.indentSelectedTasks
  );
  const outdentSelectedTasks = useTaskStore(
    (state) => state.outdentSelectedTasks
  );
  const canIndent = useTaskStore((state) => state.canIndentSelection());
  const canOutdent = useTaskStore((state) => state.canOutdentSelection());

  // Chart store
  const zoom = useChartStore((state) => state.zoom);
  const zoomIn = useChartStore((state) => state.zoomIn);
  const zoomOut = useChartStore((state) => state.zoomOut);
  const fitToView = useChartStore((state) => state.fitToView);
  const showTodayMarker = useChartStore((state) => state.showTodayMarker);
  const toggleTodayMarker = useChartStore((state) => state.toggleTodayMarker);
  const showWeekends = useChartStore((state) => state.showWeekends);
  const toggleWeekends = useChartStore((state) => state.toggleWeekends);
  const showHolidays = useChartStore((state) => state.showHolidays);
  const toggleHolidays = useChartStore((state) => state.toggleHolidays);
  const showDependencies = useChartStore((state) => state.showDependencies);
  const toggleDependencies = useChartStore((state) => state.toggleDependencies);
  const showProgress = useChartStore((state) => state.showProgress);
  const toggleProgress = useChartStore((state) => state.toggleProgress);
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);
  const setTaskLabelPosition = useChartStore(
    (state) => state.setTaskLabelPosition
  );
  const isTaskTableCollapsed = useChartStore(
    (state) => state.isTaskTableCollapsed
  );
  const setTaskTableCollapsed = useChartStore(
    (state) => state.setTaskTableCollapsed
  );

  // User preferences store
  const uiDensity = useUserPreferencesStore(
    (state) => state.preferences.uiDensity
  );
  const setUiDensity = useUserPreferencesStore((state) => state.setUiDensity);
  const dateFormat = useUserPreferencesStore(
    (state) => state.preferences.dateFormat
  );
  const setDateFormat = useUserPreferencesStore((state) => state.setDateFormat);
  const firstDayOfWeek = useUserPreferencesStore(
    (state) => state.preferences.firstDayOfWeek
  );
  const setFirstDayOfWeek = useUserPreferencesStore(
    (state) => state.setFirstDayOfWeek
  );
  const weekNumberingSystem = useUserPreferencesStore(
    (state) => state.preferences.weekNumberingSystem
  );
  const setWeekNumberingSystem = useUserPreferencesStore(
    (state) => state.setWeekNumberingSystem
  );

  // History store
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) =>
    state.getUndoDescription()
  );
  const redoDescription = useHistoryStore((state) =>
    state.getRedoDescription()
  );

  // UI store
  const openExportDialog = useUIStore((state) => state.openExportDialog);
  const openHelpPanel = useUIStore((state) => state.openHelpPanel);

  // File operations
  const { handleNew, handleOpen, handleSave, handleSaveAs } =
    useFileOperations();

  // Clipboard operations
  const { handleCopy, handleCut, handlePaste, canCopyOrCut, canPaste } =
    useClipboardOperations();

  // ─────────────────────────────────────────────────────────────────────────
  // Derived State
  // ─────────────────────────────────────────────────────────────────────────

  const singleSelectedTaskId =
    selectedTaskIds.length === 1
      ? selectedTaskIds[0]
      : selectedTaskIds.length === 0 && activeCell.taskId
        ? activeCell.taskId
        : null;

  const canInsert = singleSelectedTaskId !== null;
  const canDelete = selectedTaskIds.length > 0;

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < MAX_ZOOM;
  const canZoomOut = zoom > MIN_ZOOM;

  const zoomOptions = [...PRESET_ZOOM_LEVELS];
  if (!PRESET_ZOOM_LEVELS.includes(zoomPercentage)) {
    const insertIndex = zoomOptions.findIndex(
      (level) => level > zoomPercentage
    );
    if (insertIndex === -1) {
      zoomOptions.push(zoomPercentage);
    } else {
      zoomOptions.splice(insertIndex, 0, zoomPercentage);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddTask = (): void => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);

    const formatDate = (date: Date): string => date.toISOString().split("T")[0];

    addTask({
      name: "New Task",
      startDate: formatDate(today),
      endDate: formatDate(nextWeek),
      duration: 7,
      progress: 0,
      color: "#0F6CBD",
      order: tasks.length,
      type: "task",
      parent: undefined,
      metadata: {},
    });
  };

  const handleInsertAbove = (): void => {
    if (singleSelectedTaskId) insertTaskAbove(singleSelectedTaskId);
  };

  const handleInsertBelow = (): void => {
    if (singleSelectedTaskId) insertTaskBelow(singleSelectedTaskId);
  };

  const handleZoomIn = (): void => {
    const anchor = getViewportCenterAnchor();
    const result = zoomIn(anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  const handleZoomOut = (): void => {
    const anchor = getViewportCenterAnchor();
    const result = zoomOut(anchor);
    applyScrollLeft(result.newScrollLeft);
  };

  const handleZoomLevelSelect = (level: number | "fit"): void => {
    if (level === "fit") {
      fitToView(tasks);
    } else {
      const anchor = getViewportCenterAnchor();
      const result = useChartStore.getState().setZoom(level / 100, anchor);
      applyScrollLeft(result.newScrollLeft);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Tab Content Renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderHomeTab = (): JSX.Element => (
    <>
      {/* Primary Action - Prominent (Outlook-style) */}
      <ToolbarButton
        variant="primary"
        size="large"
        onClick={handleAddTask}
        aria-label="Add new task"
        icon={<Plus size={20} weight="regular" />}
        label="Add Task"
      />

      {/* History */}
      <ToolbarGroup label="History">
        <ToolbarButton
          onClick={undo}
          disabled={!canUndo}
          title={
            canUndo ? `Undo: ${undoDescription} (Ctrl+Z)` : "Nothing to undo"
          }
          aria-label={canUndo ? `Undo: ${undoDescription}` : "Nothing to undo"}
          icon={<ArrowCounterClockwise size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={redo}
          disabled={!canRedo}
          title={
            canRedo
              ? `Redo: ${redoDescription} (Ctrl+Shift+Z)`
              : "Nothing to redo"
          }
          aria-label={canRedo ? `Redo: ${redoDescription}` : "Nothing to redo"}
          icon={<ArrowClockwise size={ICON_SIZE} weight="light" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Clipboard */}
      <ToolbarGroup label="Clipboard">
        <ToolbarButton
          onClick={handleCopy}
          disabled={!canCopyOrCut}
          title="Copy (Ctrl+C)"
          aria-label="Copy"
          icon={<Copy size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handleCut}
          disabled={!canCopyOrCut}
          title="Cut (Ctrl+X)"
          aria-label="Cut"
          icon={<Scissors size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handlePaste}
          disabled={!canPaste}
          title="Paste (Ctrl+V)"
          aria-label="Paste"
          icon={<ClipboardText size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={deleteSelectedTasks}
          disabled={!canDelete}
          title="Delete (Del)"
          aria-label="Delete"
          icon={<Trash size={ICON_SIZE} weight="light" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Insert & Hierarchy */}
      <ToolbarGroup label="Structure">
        <ToolbarButton
          onClick={handleInsertAbove}
          disabled={!canInsert}
          title="Insert task above"
          aria-label="Insert task above"
          icon={<RowsPlusTop size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={handleInsertBelow}
          disabled={!canInsert}
          title="Insert task below"
          aria-label="Insert task below"
          icon={<RowsPlusBottom size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={outdentSelectedTasks}
          disabled={!canOutdent}
          title="Move left (outdent) - Shift+Tab"
          aria-label="Outdent"
          icon={<TextOutdent size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={indentSelectedTasks}
          disabled={!canIndent}
          title="Move right (indent) - Tab"
          aria-label="Indent"
          icon={<TextIndent size={ICON_SIZE} weight="light" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Color Mode (Smart Color Management) */}
      <ToolbarGroup label="Colors">
        <ColorModeDropdown />
        <ColorOptionsDropdown />
        <RegenerateButton />
      </ToolbarGroup>
    </>
  );

  const renderViewTab = (): JSX.Element => (
    <>
      {/* Timeline Toggles */}
      <ToolbarGroup label="Timeline">
        <ToolbarButton
          variant="toggle"
          isActive={showTodayMarker}
          onClick={toggleTodayMarker}
          title={
            showTodayMarker ? "Hide Today Marker (T)" : "Show Today Marker (T)"
          }
          aria-label={
            showTodayMarker ? "Hide Today Marker" : "Show Today Marker"
          }
          icon={<CalendarDot size={ICON_SIZE} weight="light" />}
          label="Today"
        />
        <ToolbarButton
          variant="toggle"
          isActive={showWeekends}
          onClick={toggleWeekends}
          title={showWeekends ? "Hide Weekends" : "Show Weekends"}
          aria-label={showWeekends ? "Hide Weekends" : "Show Weekends"}
          icon={<CalendarDots size={ICON_SIZE} weight="light" />}
          label="Weekends"
        />
        <ToolbarButton
          variant="toggle"
          isActive={showHolidays}
          onClick={toggleHolidays}
          title={showHolidays ? "Hide Holidays (H)" : "Show Holidays (H)"}
          aria-label={showHolidays ? "Hide Holidays" : "Show Holidays"}
          icon={<Island size={ICON_SIZE} weight="light" />}
          label="Holidays"
        />
        <HolidayRegionPopover />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Task Display Toggles */}
      <ToolbarGroup label="Tasks">
        <ToolbarButton
          variant="toggle"
          isActive={showDependencies}
          onClick={toggleDependencies}
          title={
            showDependencies ? "Hide Dependencies (D)" : "Show Dependencies (D)"
          }
          aria-label={
            showDependencies ? "Hide Dependencies" : "Show Dependencies"
          }
          icon={<FlowArrow size={ICON_SIZE} weight="light" />}
          label="Dependencies"
        />
        <ToolbarButton
          variant="toggle"
          isActive={showProgress}
          onClick={toggleProgress}
          title={showProgress ? "Hide Progress (P)" : "Show Progress (P)"}
          aria-label={showProgress ? "Hide Progress" : "Show Progress"}
          icon={<TrendUp size={ICON_SIZE} weight="light" />}
          label="Progress"
        />
        <ToolbarDropdown
          value={taskLabelPosition}
          options={LABEL_OPTIONS}
          onChange={setTaskLabelPosition}
          icon={<Tag size={ICON_SIZE} weight="light" />}
          labelPrefix="Labels"
          aria-label="Task label position"
          title="Task Label Position"
        />
        <WorkingDaysDropdown />
        <ColumnsDropdown />
        <ToolbarButton
          variant="toggle"
          isActive={!isTaskTableCollapsed}
          onClick={() => setTaskTableCollapsed(!isTaskTableCollapsed)}
          title={isTaskTableCollapsed ? "Show Task Table" : "Hide Task Table"}
          aria-label={
            isTaskTableCollapsed ? "Show Task Table" : "Hide Task Table"
          }
          icon={<SidebarSimple size={ICON_SIZE} weight="light" />}
          label="Table"
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Zoom Controls */}
      <ToolbarGroup label="Zoom">
        <ToolbarButton
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          title="Zoom Out (Ctrl+-)"
          aria-label="Zoom out"
          icon={<MagnifyingGlassMinus size={ICON_SIZE} weight="light" />}
        />
        <ZoomDropdown
          zoomPercentage={zoomPercentage}
          zoomOptions={zoomOptions}
          onSelectLevel={handleZoomLevelSelect}
        />
        <ToolbarButton
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          title="Zoom In (Ctrl++)"
          aria-label="Zoom in"
          icon={<MagnifyingGlassPlus size={ICON_SIZE} weight="light" />}
        />
        <ToolbarButton
          onClick={() => fitToView(tasks)}
          title="Fit to width (F)"
          aria-label="Fit to width"
          icon={<ArrowsOutLineHorizontal size={ICON_SIZE} weight="light" />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Format Settings */}
      <ToolbarGroup label="Format">
        <ToolbarDropdown
          value={uiDensity}
          options={DENSITY_OPTIONS}
          onChange={setUiDensity}
          icon={<ArrowsOutLineVertical size={ICON_SIZE} weight="light" />}
          labelPrefix="Density"
          aria-label="UI Density"
          title="UI Density"
        />
        <ToolbarDropdown
          value={dateFormat}
          options={DATE_FORMAT_OPTIONS}
          onChange={setDateFormat}
          icon={<Calendar size={ICON_SIZE} weight="light" />}
          labelPrefix="Date Format"
          aria-label="Date Format"
          title="Date Format"
        />
        <ToolbarDropdown
          value={firstDayOfWeek}
          options={FIRST_DAY_OF_WEEK_OPTIONS}
          onChange={setFirstDayOfWeek}
          icon={<NumberSquareOne size={ICON_SIZE} weight="light" />}
          labelPrefix="Week Start"
          aria-label="First Day of Week"
          title="First Day of Week"
        />
        <ToolbarDropdown
          value={weekNumberingSystem}
          options={WEEK_NUMBERING_OPTIONS}
          onChange={setWeekNumberingSystem}
          icon={<Hash size={ICON_SIZE} weight="light" />}
          labelPrefix="Week"
          aria-label="Week Numbering System"
          title="Week Numbering System"
        />
      </ToolbarGroup>
    </>
  );

  const renderHelpTab = (): JSX.Element => (
    <>
      <ToolbarGroup label="Help">
        <ToolbarButton
          onClick={openHelpPanel}
          title="Help (?)"
          aria-label="Help"
          icon={<Question size={ICON_SIZE} weight="light" />}
          label="Help"
        />
      </ToolbarGroup>
    </>
  );

  const renderTabContent = (): JSX.Element => {
    switch (activeTab) {
      case "home":
        return renderHomeTab();
      case "view":
        return renderViewTab();
      case "help":
        return renderHelpTab();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "view", label: "View" },
    { id: "help", label: "Help" },
  ];

  return (
    <header
      className="flex-shrink-0 relative"
      style={{ zIndex: 100, backgroundColor: "#f5f5f5", paddingBottom: "8px" }}
    >
      {/* Tab Bar - Fixed at top (MS uses colorNeutralBackground3 = #f5f5f5) */}
      <div
        className="flex items-center"
        style={{
          height: "36px",
        }}
      >
        {/* Tabs - MS Office style */}
        <div
          className="flex items-center h-full"
          role="tablist"
          style={{ paddingLeft: "8px" }}
        >
          {/* File Button - Opens dropdown instead of switching tabs */}
          <FileMenu
            onNew={handleNew}
            onOpen={handleOpen}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onExport={openExportDialog}
          />

          {/* Regular tabs */}
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const classes = [
              "ribbon-tab",
              "ribbon-tab-standard",
              isActive ? "ribbon-tab-active" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={classes}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Project title - centered, inline-editable (Figma-style) */}
        <InlineProjectTitle />

        <ToolbarSpacer />

        {/* Logo - right side */}
        <div className="flex items-center px-3 h-full">
          <OwnChartLogo
            width={18}
            height={18}
            style={{ color: "#0F6CBD" }}
            aria-label="OwnChart"
          />
        </div>
      </div>

      {/* Floating Toolbar - MS Office style */}
      <div
        className="flex items-center justify-between px-3 gap-1"
        style={{
          height: "40px",
          backgroundColor: "#ffffff",
          boxShadow:
            "0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)",
          borderRadius: "8px",
          width: "calc(100% - 16px)",
          margin: "0 8px",
          position: "relative",
          zIndex: 2,
          transition: "height 150ms cubic-bezier(0.1, 0.9, 0.2, 1)",
        }}
      >
        {renderTabContent()}
        <ToolbarSpacer />
      </div>
    </header>
  );
}
