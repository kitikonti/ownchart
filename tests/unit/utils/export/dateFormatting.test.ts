/**
 * Unit tests for dateFormatting.ts
 */

import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateRange,
} from "../../../../src/utils/export/dateFormatting";

describe("formatDate", () => {
  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("zero-pads single-digit month and day", () => {
    expect(formatDate(new Date(2024, 0, 5))).toBe("2024-01-05"); // Jan 5
  });

  it("formats double-digit month and day", () => {
    expect(formatDate(new Date(2024, 11, 31))).toBe("2024-12-31"); // Dec 31
  });

  it("formats the first day of the year", () => {
    expect(formatDate(new Date(2025, 0, 1))).toBe("2025-01-01");
  });

  it("formats the last day of the year", () => {
    expect(formatDate(new Date(2024, 11, 31))).toBe("2024-12-31");
  });

  it("handles a leap year date", () => {
    expect(formatDate(new Date(2024, 1, 29))).toBe("2024-02-29"); // Feb 29, 2024
  });

  it("uses local date parts, not UTC", () => {
    // Create a specific local date and verify the output matches local time
    const localDate = new Date(2024, 5, 15); // June 15, 2024 in local time
    expect(formatDate(localDate)).toBe("2024-06-15");
  });
});

describe("formatDateRange", () => {
  it("formats a range with an en-dash separator", () => {
    const start = new Date(2024, 0, 1);
    const end = new Date(2024, 11, 31);
    expect(formatDateRange({ start, end })).toBe("2024-01-01 – 2024-12-31");
  });

  it("handles a same-day range", () => {
    const day = new Date(2024, 5, 15);
    expect(formatDateRange({ start: day, end: day })).toBe(
      "2024-06-15 – 2024-06-15"
    );
  });

  it("formats a short range within one month", () => {
    const start = new Date(2024, 2, 10); // Mar 10
    const end = new Date(2024, 2, 25); // Mar 25
    expect(formatDateRange({ start, end })).toBe("2024-03-10 – 2024-03-25");
  });

  it("formats a multi-year range", () => {
    const start = new Date(2023, 0, 1);
    const end = new Date(2025, 11, 31);
    expect(formatDateRange({ start, end })).toBe("2023-01-01 – 2025-12-31");
  });
});
