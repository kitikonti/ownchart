import { describe, it, expect } from "vitest";
import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_ZOOM_PRESETS,
  INITIAL_EXPORT_STATE,
} from "../../../../src/utils/export/types";

describe("EXPORT_ZOOM_PRESETS", () => {
  it("should have correct preset values", () => {
    expect(EXPORT_ZOOM_PRESETS.COMPACT).toBe(0.5);
    expect(EXPORT_ZOOM_PRESETS.STANDARD).toBe(1.0);
    expect(EXPORT_ZOOM_PRESETS.DETAILED).toBe(1.5);
    expect(EXPORT_ZOOM_PRESETS.EXPANDED).toBe(2.0);
  });

  it("should have all required presets", () => {
    expect(Object.keys(EXPORT_ZOOM_PRESETS)).toHaveLength(4);
  });
});

describe("DEFAULT_EXPORT_OPTIONS", () => {
  it("should have correct default values", () => {
    expect(DEFAULT_EXPORT_OPTIONS.timelineZoom).toBe(
      EXPORT_ZOOM_PRESETS.STANDARD
    );
    expect(DEFAULT_EXPORT_OPTIONS.selectedColumns).toEqual([]);
    expect(DEFAULT_EXPORT_OPTIONS.includeHeader).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.includeTodayMarker).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.includeDependencies).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.includeGridLines).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.includeWeekends).toBe(true);
    expect(DEFAULT_EXPORT_OPTIONS.background).toBe("white");
  });

  it("should default to standard zoom", () => {
    expect(DEFAULT_EXPORT_OPTIONS.timelineZoom).toBe(
      EXPORT_ZOOM_PRESETS.STANDARD
    );
  });

  it("should default to no task list columns selected", () => {
    expect(DEFAULT_EXPORT_OPTIONS.selectedColumns).toHaveLength(0);
  });
});

describe("INITIAL_EXPORT_STATE", () => {
  it("should have correct initial state", () => {
    expect(INITIAL_EXPORT_STATE.isExporting).toBe(false);
    expect(INITIAL_EXPORT_STATE.progress).toBe(0);
    expect(INITIAL_EXPORT_STATE.error).toBeNull();
  });
});
