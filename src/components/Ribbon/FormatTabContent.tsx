/**
 * FormatTabContent - Ribbon Format tab toolbar content.
 *
 * Contains: Labels, Calendar (working days, first day), and Display
 * (density, date format, week numbering) settings.
 */

import {
  Tag,
  NumberSquareOne,
  ArrowsOutLineVertical,
  Calendar,
  Hash,
} from "@phosphor-icons/react";

import {
  ToolbarGroup,
  ToolbarSeparator,
  TOOLBAR_TOKENS,
} from "../Toolbar/ToolbarPrimitives";
import { ToolbarDropdown } from "../Toolbar/ToolbarDropdown";
import { WorkingDaysDropdown } from "./WorkingDaysDropdown";

import { useChartStore } from "../../store/slices/chartSlice";
import { useUserPreferencesStore } from "../../store/slices/userPreferencesSlice";
import {
  LABEL_OPTIONS,
  DENSITY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  FIRST_DAY_OF_WEEK_OPTIONS,
  WEEK_NUMBERING_OPTIONS,
} from "../../config/preferencesOptions";

const ICON_SIZE = TOOLBAR_TOKENS.iconSize;

export function FormatTabContent(): JSX.Element {
  // Chart store
  const taskLabelPosition = useChartStore((state) => state.taskLabelPosition);
  const setTaskLabelPosition = useChartStore(
    (state) => state.setTaskLabelPosition
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

  return (
    <>
      {/* Labels */}
      <ToolbarGroup label="Labels">
        <ToolbarDropdown
          value={taskLabelPosition}
          options={LABEL_OPTIONS}
          onChange={setTaskLabelPosition}
          icon={<Tag size={ICON_SIZE} weight="light" />}
          labelPrefix="Labels"
          aria-label="Task label position"
          title="Task Label Position"
          labelPriority={1}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Calendar */}
      <ToolbarGroup label="Calendar">
        <WorkingDaysDropdown labelPriority={1} />
        <ToolbarDropdown
          value={firstDayOfWeek}
          options={FIRST_DAY_OF_WEEK_OPTIONS}
          onChange={setFirstDayOfWeek}
          icon={<NumberSquareOne size={ICON_SIZE} weight="light" />}
          labelPrefix="Week Start"
          aria-label="First Day of Week"
          title="First Day of Week"
          labelPriority={1}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* Display */}
      <ToolbarGroup label="Display">
        <ToolbarDropdown
          value={uiDensity}
          options={DENSITY_OPTIONS}
          onChange={setUiDensity}
          icon={<ArrowsOutLineVertical size={ICON_SIZE} weight="light" />}
          labelPrefix="Density"
          aria-label="UI Density"
          title="UI Density"
          labelPriority={2}
        />
        <ToolbarDropdown
          value={dateFormat}
          options={DATE_FORMAT_OPTIONS}
          onChange={setDateFormat}
          icon={<Calendar size={ICON_SIZE} weight="light" />}
          labelPrefix="Date Format"
          aria-label="Date Format"
          title="Date Format"
          labelPriority={2}
        />
        <ToolbarDropdown
          value={weekNumberingSystem}
          options={WEEK_NUMBERING_OPTIONS}
          onChange={setWeekNumberingSystem}
          icon={<Hash size={ICON_SIZE} weight="light" />}
          labelPrefix="Week"
          aria-label="Week Numbering System"
          title="Week Numbering System"
          labelPriority={2}
        />
      </ToolbarGroup>
    </>
  );
}
