/**
 * Default working days configuration for project settings.
 */

import type { WorkingDaysConfig } from "../types/preferences.types";

export const DEFAULT_WORKING_DAYS_CONFIG: WorkingDaysConfig = {
  excludeSaturday: true,
  excludeSunday: true,
  excludeHolidays: true,
};
