/**
 * ViewTabContent - Ribbon View tab toolbar content.
 *
 * Contains: Show/Hide toggles, Zoom controls, and Layout settings.
 *
 * Pure presentational component — all logic lives in useViewTabActions.
 */

import {
  FlowArrow,
  Lightning,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsOutLineHorizontal,
  CalendarDot,
  CalendarDots,
  Island,
  TrendUp,
  SidebarSimple,
  CircleHalf,
  FrameCorners,
} from "@phosphor-icons/react";

import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/Toolbar/ToolbarPrimitives";
import { TOOLBAR } from "@/styles/design-tokens";
import { HolidayRegionPopover } from "./HolidayRegionPopover";
import { ZoomDropdown } from "./ZoomDropdown";
import { useViewTabActions } from "@/hooks/useViewTabActions";
import { useChartStore } from "@/store/slices/chartSlice";
import { useEffect } from "react";

const ICON_SIZE = TOOLBAR.iconSize;

export function ViewTabContent(): JSX.Element {
  // Alt-key listener: temporarily inverts the auto-scheduling indicator
  const altKeyHeld = useChartStore((s) => s.altKeyHeld);
  const setAltKeyHeld = useChartStore((s) => s.setAltKeyHeld);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Alt") setAltKeyHeld(true);
    };
    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.key === "Alt") setAltKeyHeld(false);
    };
    // Also reset when window loses focus (user Alt-Tabs away)
    const handleBlur = (): void => setAltKeyHeld(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [setAltKeyHeld]);

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
    autoScheduling,
    toggleAutoScheduling,
    zoomPercentage,
    zoomOptions,
    canZoomIn,
    canZoomOut,
    handleZoomIn,
    handleZoomOut,
    handleZoomLevelSelect,
    handleFitToView,
    isTaskTableCollapsed,
    toggleTaskTableCollapsed,
    isHighContrast,
    toggleHighContrast,
    hideUI,
    toggleHideUI,
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

      {/* Scheduling — Alt key temporarily inverts the visual indicator */}
      <ToolbarGroup label="Scheduling">
        {(() => {
          const displayActive = altKeyHeld ? !autoScheduling : autoScheduling;
          return (
            <ToolbarButton
              variant="toggle"
              isActive={displayActive}
              onClick={toggleAutoScheduling}
              title={
                displayActive
                  ? "Disable Auto-Scheduling"
                  : "Enable Auto-Scheduling"
              }
              aria-label={
                displayActive
                  ? "Disable Auto-Scheduling"
                  : "Enable Auto-Scheduling"
              }
              icon={<Lightning size={ICON_SIZE} weight="light" />}
              label="Auto-Schedule"
              labelPriority={2}
            />
          );
        })()}
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
          onClick={handleFitToView}
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

      <ToolbarSeparator />

      {/* Display Modes (Issue #69: Projector support) */}
      <ToolbarGroup label="Display">
        <ToolbarButton
          variant="toggle"
          isActive={isHighContrast}
          onClick={toggleHighContrast}
          title={
            isHighContrast
              ? "Disable High Contrast"
              : "High Contrast — better visibility for projectors & screen sharing"
          }
          aria-label={
            isHighContrast ? "Disable High Contrast" : "Enable High Contrast"
          }
          icon={<CircleHalf size={ICON_SIZE} weight="light" />}
          label="Contrast"
          labelPriority={3}
        />
        <ToolbarButton
          variant="toggle"
          isActive={hideUI}
          onClick={toggleHideUI}
          title={hideUI ? "Show Toolbar (Ctrl+\\)" : "Hide Toolbar (Ctrl+\\)"}
          aria-label={hideUI ? "Show Toolbar" : "Hide Toolbar"}
          icon={<FrameCorners size={ICON_SIZE} weight="light" />}
          label="Hide UI"
          labelPriority={3}
        />
      </ToolbarGroup>
    </>
  );
}
