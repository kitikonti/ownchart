/**
 * Default values for task fields.
 * Business-logic modules (e.g. clipboard utils) should import task defaults
 * from here, not directly from the styles layer.
 */
import type { TaskType } from "../types/chart.types";

export { DEFAULT_TASK_COLOR } from "../styles/design-tokens";

export const DEFAULT_TASK_TYPE: TaskType = "task";
