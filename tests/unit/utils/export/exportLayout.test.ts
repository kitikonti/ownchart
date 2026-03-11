/**
 * Unit tests for exportLayout.ts — computeExportLayout and calculateExportDimensions.
 */

import { describe, it, expect } from "vitest";
import {
  computeExportLayout,
  calculateExportDimensions,
} from "../../../../src/utils/export/exportLayout";
import { DEFAULT_EXPORT_OPTIONS } from "../../../../src/utils/export/types";
import type { ExportLayoutInput } from "../../../../src/utils/export/types";
import type { Task } from "../../../../src/types/chart.types";
import { toTaskId } from "../../../../src/types/branded.types";

function makeTask(
  id: string,
  startDate: string,
  endDate: string,
  parentId: string | null = null
): Task {
  return {
    id: toTaskId(id),
    name: `Task ${id}`,
    type: "task",
    startDate,
    endDate,
    progress: 0,
    parentId: parentId ? toTaskId(parentId) : null,
    sortOrder: 0,
    color: null,
  };
}

const baseInput: ExportLayoutInput = {
  tasks: [],
  options: { ...DEFAULT_EXPORT_OPTIONS },
  currentAppZoom: 1,
};

describe("computeExportLayout", () => {
  it("handles an empty task list without error", () => {
    const layout = computeExportLayout(baseInput);
    expect(layout.flattenedTasks).toHaveLength(0);
    expect(layout.orderedTasks).toHaveLength(0);
    expect(layout.contentHeight).toBe(0);
  });

  it("returns correct task count for a flat task list", () => {
    const tasks = [
      makeTask("a", "2025-01-01", "2025-01-10"),
      makeTask("b", "2025-01-05", "2025-01-15"),
    ];
    const layout = computeExportLayout({ ...baseInput, tasks });
    expect(layout.flattenedTasks).toHaveLength(2);
    expect(layout.orderedTasks).toHaveLength(2);
  });

  it("sets hasTaskList to false when no columns are selected", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-01-10")];
    const layout = computeExportLayout({
      ...baseInput,
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: [] },
    });
    expect(layout.hasTaskList).toBe(false);
    expect(layout.taskTableWidth).toBe(0);
  });

  it("sets hasTaskList to true when columns are selected", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-01-10")];
    const layout = computeExportLayout({
      ...baseInput,
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, selectedColumns: ["name"] },
    });
    expect(layout.hasTaskList).toBe(true);
    expect(layout.taskTableWidth).toBeGreaterThan(0);
  });

  it("uses currentAppZoom for currentView zoomMode", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-03-31")];
    const layout = computeExportLayout({
      ...baseInput,
      tasks,
      currentAppZoom: 2,
      options: { ...DEFAULT_EXPORT_OPTIONS, zoomMode: "currentView" },
    });
    expect(layout.effectiveZoom).toBe(2);
  });

  it("uses timelineZoom for custom zoomMode", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-03-31")];
    const layout = computeExportLayout({
      ...baseInput,
      tasks,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        zoomMode: "custom",
        timelineZoom: 0.5,
      },
    });
    expect(layout.effectiveZoom).toBe(0.5);
  });

  it("totalHeight includes header height when includeHeader is true", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-01-10")];
    const withHeader = computeExportLayout({
      ...baseInput,
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: true },
    });
    const withoutHeader = computeExportLayout({
      ...baseInput,
      tasks,
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: false },
    });
    expect(withHeader.totalHeight).toBeGreaterThan(withoutHeader.totalHeight);
  });

  it("totalWidth equals taskTableWidth + timelineWidth when not fitToWidth", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-03-31")];
    const layout = computeExportLayout({
      ...baseInput,
      tasks,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        zoomMode: "currentView",
        selectedColumns: ["name"],
      },
    });
    expect(layout.totalWidth).toBeCloseTo(
      layout.taskTableWidth + layout.timelineWidth,
      0
    );
  });

  it("returns fitToWidth as totalWidth when zoomMode is fitToWidth", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-06-30")];
    const fitToWidth = 1920;
    const layout = computeExportLayout({
      ...baseInput,
      tasks,
      options: {
        ...DEFAULT_EXPORT_OPTIONS,
        zoomMode: "fitToWidth",
        fitToWidth,
        selectedColumns: [],
      },
    });
    expect(layout.totalWidth).toBe(fitToWidth);
  });
});

describe("calculateExportDimensions", () => {
  it("returns rounded width and height", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-06-30")];
    const dims = calculateExportDimensions({ ...baseInput, tasks });
    expect(Number.isInteger(dims.width)).toBe(true);
    expect(Number.isInteger(dims.height)).toBe(true);
  });

  it("returns effectiveZoom from layout computation", () => {
    const tasks = [makeTask("a", "2025-01-01", "2025-06-30")];
    const dims = calculateExportDimensions({
      ...baseInput,
      tasks,
      currentAppZoom: 1.5,
      options: { ...DEFAULT_EXPORT_OPTIONS, zoomMode: "currentView" },
    });
    expect(dims.effectiveZoom).toBe(1.5);
  });

  it("returns zero height for empty task list", () => {
    const dims = calculateExportDimensions({
      ...baseInput,
      options: { ...DEFAULT_EXPORT_OPTIONS, includeHeader: false },
    });
    expect(dims.height).toBe(0);
  });
});
