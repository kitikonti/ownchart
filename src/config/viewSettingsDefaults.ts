/**
 * Default values for ViewSettings used in file operations.
 * Single source of truth for optional ViewSettings field defaults
 * when loading .ownchart files that may lack newer fields.
 */

import type { ViewSettings } from "../utils/fileOperations/types";
import { DEFAULT_COLOR_MODE_STATE } from "./colorModeDefaults";
import { DEFAULT_WORKING_DAYS_CONFIG } from "./workingDaysConfig";

/**
 * Apply defaults for optional ViewSettings fields.
 * Used when loading files that predate certain features.
 */
export function applyViewSettingsDefaults(loaded: ViewSettings): ViewSettings {
  return {
    // Required fields — pass through as-is
    zoom: loaded.zoom,
    panOffset: loaded.panOffset,
    showWeekends: loaded.showWeekends,
    showTodayMarker: loaded.showTodayMarker,
    taskTableWidth: loaded.taskTableWidth,
    columnWidths: loaded.columnWidths,

    // Optional fields — apply defaults for older file versions
    showHolidays: loaded.showHolidays ?? true,
    showDependencies: loaded.showDependencies ?? true,
    showProgress: loaded.showProgress ?? true,
    taskLabelPosition: loaded.taskLabelPosition ?? "inside",
    workingDaysMode: loaded.workingDaysMode ?? false,
    workingDaysConfig: loaded.workingDaysConfig ?? {
      ...DEFAULT_WORKING_DAYS_CONFIG,
    },
    holidayRegion: loaded.holidayRegion,
    projectTitle: loaded.projectTitle ?? "",
    projectAuthor: loaded.projectAuthor ?? "",
    colorModeState: loaded.colorModeState ?? { ...DEFAULT_COLOR_MODE_STATE },
    hiddenColumns: loaded.hiddenColumns ?? [],
    isTaskTableCollapsed: loaded.isTaskTableCollapsed ?? false,
    hiddenTaskIds: loaded.hiddenTaskIds ?? [],
  };
}

/** Default chart name when none is provided */
export const DEFAULT_CHART_NAME = "Untitled";
