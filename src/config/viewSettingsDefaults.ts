/**
 * Default values for ViewSettings used in file operations.
 * Single source of truth for optional ViewSettings field defaults
 * when loading .ownchart files that may lack newer fields.
 */

import type { ViewSettings } from "@/utils/fileOperations/types";
import { DEFAULT_COLOR_MODE_STATE } from "./colorModeDefaults";
import { DEFAULT_WORKING_DAYS_CONFIG } from "./workingDaysConfig";

/**
 * Apply defaults for optional ViewSettings fields.
 * Used when loading files that predate certain features.
 *
 * @param loaded - Raw ViewSettings from a .ownchart file (may be missing newer fields added after the file was saved).
 */
export function applyViewSettingsDefaults(loaded: ViewSettings): ViewSettings {
  return {
    // Required fields — pass through as-is
    zoom: loaded.zoom,
    panOffset: loaded.panOffset,
    // viewAnchorDate: date-based scroll position. Pass through from file;
    // undefined means the file predates this field — useInfiniteScroll falls
    // back to SCROLL_OFFSET_DAYS for positioning.
    viewAnchorDate: loaded.viewAnchorDate,
    scrollTop: loaded.scrollTop,
    showWeekends: loaded.showWeekends,
    showTodayMarker: loaded.showTodayMarker,
    taskTableWidth: loaded.taskTableWidth,
    columnWidths: loaded.columnWidths,

    // Optional fields — apply defaults for older file versions
    autoScheduling: loaded.autoScheduling ?? false,
    showHolidays: loaded.showHolidays ?? true,
    showDependencies: loaded.showDependencies ?? true,
    showProgress: loaded.showProgress ?? true,
    taskLabelPosition: loaded.taskLabelPosition ?? "inside",
    workingDaysMode: loaded.workingDaysMode ?? false,
    workingDaysConfig:
      loaded.workingDaysConfig ?? structuredClone(DEFAULT_WORKING_DAYS_CONFIG),
    // intentionally undefined when absent — chartSlice falls back to detectLocaleHolidayRegion()
    holidayRegion: loaded.holidayRegion,
    projectTitle: loaded.projectTitle ?? "",
    projectAuthor: loaded.projectAuthor ?? "",
    colorModeState:
      loaded.colorModeState ?? structuredClone(DEFAULT_COLOR_MODE_STATE),
    hiddenColumns: loaded.hiddenColumns ?? [],
    isTaskTableCollapsed: loaded.isTaskTableCollapsed ?? false,
    hiddenTaskIds: loaded.hiddenTaskIds ?? [],
    projectLogo: loaded.projectLogo,
  };
}

/** Default chart name when none is provided */
export const DEFAULT_CHART_NAME = "Untitled";
