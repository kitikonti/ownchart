/**
 * Shared test factory for creating Task objects with sensible defaults.
 * Use the `overrides` parameter to set only the fields relevant to each test.
 */

import type { Task } from "../../../src/types/chart.types";

export function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    duration: 10,
    progress: 0,
    color: "#0F6CBD",
    order: 0,
    metadata: {},
    type: "task",
    ...overrides,
  };
}
