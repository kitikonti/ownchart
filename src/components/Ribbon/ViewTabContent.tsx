/**
 * ViewTabContent - Ribbon View tab toolbar content.
 *
 * Contains: Show/Hide toggles, Zoom controls, and Layout settings.
 *
 * Pure presentational component — all logic lives in useViewTabActions.
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
import { ZoomDropdown } from "./ZoomDropdown";
import { useViewTabActions } from "../../hooks/useViewTabActions";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

export function ViewTabContent(): JSX.Element {
  const {
    showTodayMarker,
    toggleTodayMarker,
    showWeekends,
    toggleWeekends,
    showHolidays,
    toggleHolidays,
    showDependencies,
    toggleDependencies,
    showProgress,
    toggleProgress,
    zoomPercentage,
    zoomOptions,
    canZoomIn,
    canZoomOut,
    handleZoomIn,
    handleZoomOut,
    handleZoomLevelSelect,
    isTaskTableCollapsed,
    toggleTaskTableCollapsed,
  } = useViewTabActions();

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
          onClick={() => handleZoomLevelSelect("fit")}
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
          onClick={toggleTaskTableCollapsed}
          title={isTaskTableCollapsed ? "Show Task Table" : "Hide Task Table"}
          aria-label={
            isTaskTableCollapsed ? "Show Task Table" : "Hide Task Table"
          }
          icon={<SidebarSimple size={ICON_SIZE} weight="light" />}
          label="Table"
          labelPriority={3}
        />
      </ToolbarGroup>
    </>
  );
}
