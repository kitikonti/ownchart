/**
 * ViewTabContent - Ribbon View tab toolbar content.
 *
 * Contains: Show/Hide toggles, Zoom controls, and Layout settings.
 */

import {
  FlowArrow,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutLineHorizontal,
  CalendarDot,
  CalendarDots,
  Island,
  TrendUp,
  SidebarSimple,
} from "@phosphor-icons/react";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";
import { HolidayRegionPopover } from "./HolidayRegionPopover";
import { ColumnsDropdown } from "./ColumnsDropdown";
import { ZoomDropdown } from "./ZoomDropdown";

import { useTaskStore } from "../../store/slices/taskSlice";
import { useChartStore } from "../../store/slices/chartSlice";
import { getViewportCenterAnchor, applyScrollLeft } from "../../hooks/useZoom";
import { MIN_ZOOM, MAX_ZOOM } from "../../utils/timelineUtils";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

// Preset zoom levels
const PRESET_ZOOM_LEVELS = [5, 10, 25, 50, 75, 100, 150, 200, 300];

export function ViewTabContent(): JSX.Element {
  // Task store (for fitToView)
  const tasks = useTaskStore((state) => state.tasks);

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
  const isTaskTableCollapsed = useChartStore(
    (state) => state.isTaskTableCollapsed
  );
  const setTaskTableCollapsed = useChartStore(
    (state) => state.setTaskTableCollapsed
  );

  // Derived zoom state
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

  // Handlers
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

  return (
    <>
      {/* Show/Hide Toggles */}
      <ToolbarGroup label="Show/Hide">
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
          labelPriority={1}
        />
        <ToolbarButton
          variant="toggle"
          isActive={showWeekends}
          onClick={toggleWeekends}
          title={showWeekends ? "Hide Weekends" : "Show Weekends"}
          aria-label={showWeekends ? "Hide Weekends" : "Show Weekends"}
          icon={<CalendarDots size={ICON_SIZE} weight="light" />}
          label="Weekends"
          labelPriority={1}
        />
        <ToolbarButton
          variant="toggle"
          isActive={showHolidays}
          onClick={toggleHolidays}
          title={showHolidays ? "Hide Holidays (H)" : "Show Holidays (H)"}
          aria-label={showHolidays ? "Hide Holidays" : "Show Holidays"}
          icon={<Island size={ICON_SIZE} weight="light" />}
          label="Holidays"
          labelPriority={1}
        />
        <HolidayRegionPopover />
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
          labelPriority={2}
        />
        <ToolbarButton
          variant="toggle"
          isActive={showProgress}
          onClick={toggleProgress}
          title={showProgress ? "Hide Progress (P)" : "Show Progress (P)"}
          aria-label={showProgress ? "Hide Progress" : "Show Progress"}
          icon={<TrendUp size={ICON_SIZE} weight="light" />}
          label="Progress"
          labelPriority={2}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Zoom Controls */}
      <ToolbarGroup label="Zoom">
        <ToolbarButton
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          title="Zoom Out"
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
          title="Zoom In"
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

      {/* Layout */}
      <ToolbarGroup label="Layout">
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
          labelPriority={3}
        />
        <ColumnsDropdown labelPriority={3} />
      </ToolbarGroup>
    </>
  );
}
