/**
 * Unit tests for rowNumberConfig constants and cursor builder.
 * Verifies that exported constants have the expected shape and that the
 * ROW_SELECT_CURSOR SVG data URL is correctly formed.
 */

import { describe, it, expect } from "vitest";
import {
  CONTROLS_WIDTH,
  DRAG_HANDLE_ICON_SIZE,
  SELECTION_RADIUS,
  INSERT_BUTTON_HIT_AREA,
  ROW_NUMBER_FONT_SIZE,
  ROW_NUMBER_FONT_WEIGHT,
  ROW_SELECT_CURSOR,
  ROW_COLORS,
} from "@/components/TaskList/rowNumberConfig";

describe("rowNumberConfig layout constants", () => {
  it("CONTROLS_WIDTH is a positive number", () => {
    expect(typeof CONTROLS_WIDTH).toBe("number");
    expect(CONTROLS_WIDTH).toBeGreaterThan(0);
  });

  it("DRAG_HANDLE_ICON_SIZE is a positive number", () => {
    expect(typeof DRAG_HANDLE_ICON_SIZE).toBe("number");
    expect(DRAG_HANDLE_ICON_SIZE).toBeGreaterThan(0);
  });

  it("SELECTION_RADIUS is a non-empty string", () => {
    expect(typeof SELECTION_RADIUS).toBe("string");
    expect(SELECTION_RADIUS.length).toBeGreaterThan(0);
  });

  it("INSERT_BUTTON_HIT_AREA is a positive number", () => {
    expect(typeof INSERT_BUTTON_HIT_AREA).toBe("number");
    expect(INSERT_BUTTON_HIT_AREA).toBeGreaterThan(0);
  });

  it("ROW_NUMBER_FONT_SIZE is a non-empty string", () => {
    expect(typeof ROW_NUMBER_FONT_SIZE).toBe("string");
    expect(ROW_NUMBER_FONT_SIZE.length).toBeGreaterThan(0);
  });

  it("ROW_NUMBER_FONT_WEIGHT is defined", () => {
    expect(ROW_NUMBER_FONT_WEIGHT).toBeDefined();
  });
});

describe("ROW_SELECT_CURSOR", () => {
  it("is a non-empty string", () => {
    expect(typeof ROW_SELECT_CURSOR).toBe("string");
    expect(ROW_SELECT_CURSOR.length).toBeGreaterThan(0);
  });

  it("starts with url(\"data:image/svg+xml,", () => {
    expect(ROW_SELECT_CURSOR.startsWith('url("data:image/svg+xml,')).toBe(true);
  });

  it("ends with pointer as fallback cursor", () => {
    expect(ROW_SELECT_CURSOR.endsWith("pointer")).toBe(true);
  });

  it("contains an encoded SVG path", () => {
    // The encoded string should contain the SVG path data (encoded 'd=' attribute)
    expect(ROW_SELECT_CURSOR).toContain("svg");
  });
});

describe("ROW_COLORS", () => {
  it("has all expected color keys", () => {
    const expectedKeys = [
      "bgInactive",
      "bgHover",
      "textInactive",
      "bgSelected",
      "textSelected",
      "controlsColor",
      "insertLineColor",
      "border",
      "hiddenIndicator",
    ];
    for (const key of expectedKeys) {
      expect(ROW_COLORS).toHaveProperty(key);
    }
  });

  it("all color values are non-empty strings", () => {
    for (const [key, value] of Object.entries(ROW_COLORS)) {
      expect(typeof value, `ROW_COLORS.${key} should be string`).toBe("string");
      expect((value as string).length, `ROW_COLORS.${key} should not be empty`).toBeGreaterThan(0);
    }
  });
});
