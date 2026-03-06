import { describe, it, expect } from "vitest";
import {
  toISODateString,
  calculateDuration,
  addDays,
  formatDate,
  formatDateByPreference,
  getDateRange,
  isWeekend,
  getBusinessDays,
} from "../../../src/utils/dateUtils";
import type { Task } from "../../../src/types/chart.types";

function makeTask(startDate: string, endDate: string): Task {
  return { startDate, endDate } as Task;
}

describe("toISODateString", () => {
  it("formats a specific local date correctly", () => {
    // Construct in local time to avoid UTC ambiguity
    expect(toISODateString(new Date(2025, 0, 15))).toBe("2025-01-15");
  });

  it("pads single-digit month and day", () => {
    expect(toISODateString(new Date(2025, 8, 5))).toBe("2025-09-05");
  });

  it("handles leap day", () => {
    expect(toISODateString(new Date(2024, 1, 29))).toBe("2024-02-29");
  });

  it("handles year boundary (Dec 31)", () => {
    expect(toISODateString(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("calculateDuration", () => {
  it("returns 1 for a same-day range", () => {
    expect(calculateDuration("2025-01-01", "2025-01-01")).toBe(1);
  });

  it("returns 5 for a 5-day span", () => {
    expect(calculateDuration("2025-01-01", "2025-01-05")).toBe(5);
  });

  it("handles month boundary", () => {
    expect(calculateDuration("2025-01-28", "2025-02-03")).toBe(7);
  });

  it("handles year boundary", () => {
    expect(calculateDuration("2024-12-30", "2025-01-02")).toBe(4);
  });

  it("returns 0 for a reversed range (end before start)", () => {
    expect(calculateDuration("2025-01-10", "2025-01-09")).toBe(0);
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    expect(addDays("2025-01-01", 5)).toBe("2025-01-06");
  });

  it("subtracts days when negative", () => {
    expect(addDays("2025-01-10", -3)).toBe("2025-01-07");
  });

  it("handles zero", () => {
    expect(addDays("2025-06-15", 0)).toBe("2025-06-15");
  });

  it("crosses month boundary", () => {
    expect(addDays("2025-01-28", 5)).toBe("2025-02-02");
  });

  it("crosses year boundary", () => {
    expect(addDays("2024-12-30", 5)).toBe("2025-01-04");
  });
});

describe("formatDate", () => {
  it("formats with an ISO pattern", () => {
    expect(formatDate("2025-01-15", "yyyy-MM-dd")).toBe("2025-01-15");
  });

  it("formats with a display pattern", () => {
    expect(formatDate("2025-01-15", "MMM d")).toBe("Jan 15");
  });
});

describe("formatDateByPreference", () => {
  it("formats DD/MM/YYYY", () => {
    expect(formatDateByPreference("2025-03-07", "DD/MM/YYYY")).toBe(
      "07/03/2025"
    );
  });

  it("formats MM/DD/YYYY", () => {
    expect(formatDateByPreference("2025-03-07", "MM/DD/YYYY")).toBe(
      "03/07/2025"
    );
  });

  it("formats YYYY-MM-DD", () => {
    expect(formatDateByPreference("2025-03-07", "YYYY-MM-DD")).toBe(
      "2025-03-07"
    );
  });

  it("accepts a Date object", () => {
    const d = new Date(2025, 2, 7); // March 7, 2025 local time
    expect(formatDateByPreference(d, "DD/MM/YYYY")).toBe("07/03/2025");
  });
});

describe("getDateRange", () => {
  it("returns min and max dates from tasks", () => {
    const tasks = [
      makeTask("2025-01-05", "2025-01-10"),
      makeTask("2025-01-01", "2025-01-08"),
      makeTask("2025-01-03", "2025-01-15"),
    ];
    const { min, max } = getDateRange(tasks);
    expect(min).toBe("2025-01-01");
    expect(max).toBe("2025-01-15");
  });

  it("handles a single task", () => {
    const { min, max } = getDateRange([makeTask("2025-06-01", "2025-06-30")]);
    expect(min).toBe("2025-06-01");
    expect(max).toBe("2025-06-30");
  });

  it("returns today and today+30 for an empty array", () => {
    const { min, max } = getDateRange([]);
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(max).toBe(addDays(min, 30));
  });

  it("filters out tasks with empty start date", () => {
    const tasks = [makeTask("", "2025-01-08"), makeTask("2025-01-05", "2025-01-10")];
    const { min, max } = getDateRange(tasks);
    expect(min).toBe("2025-01-05");
    expect(max).toBe("2025-01-10");
  });

  it("filters out tasks with empty end date", () => {
    const tasks = [makeTask("2025-01-05", ""), makeTask("2025-01-03", "2025-01-15")];
    const { min, max } = getDateRange(tasks);
    expect(min).toBe("2025-01-03");
    expect(max).toBe("2025-01-15");
  });

  it("returns today+30 fallback when all tasks have empty dates", () => {
    const { min, max } = getDateRange([makeTask("", ""), makeTask("", "")]);
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(max).toBe(addDays(min, 30));
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday", () => {
    expect(isWeekend("2025-01-04")).toBe(true);
  });

  it("returns true for Sunday", () => {
    expect(isWeekend("2025-01-05")).toBe(true);
  });

  it("returns false for Monday", () => {
    expect(isWeekend("2025-01-06")).toBe(false);
  });

  it("returns false for Friday", () => {
    expect(isWeekend("2025-01-03")).toBe(false);
  });
});

describe("getBusinessDays", () => {
  it("counts all 5 days in a Mon–Fri week", () => {
    expect(getBusinessDays("2025-01-06", "2025-01-10")).toBe(5);
  });

  it("excludes weekends when spanning a full week", () => {
    // Fri 3 Jan through Thu 9 Jan: Fri(1) + Mon–Thu(4) = 5 business days
    expect(getBusinessDays("2025-01-03", "2025-01-09")).toBe(5);
  });

  it("returns 1 for a single weekday", () => {
    expect(getBusinessDays("2025-01-06", "2025-01-06")).toBe(1);
  });

  it("returns 0 for a single Saturday", () => {
    expect(getBusinessDays("2025-01-04", "2025-01-04")).toBe(0);
  });

  it("returns 0 for a single Sunday", () => {
    expect(getBusinessDays("2025-01-05", "2025-01-05")).toBe(0);
  });

  it("returns 0 when start > end", () => {
    expect(getBusinessDays("2025-01-10", "2025-01-06")).toBe(0);
  });

  it("handles two full weeks correctly", () => {
    // Mon 6 Jan through Sun 19 Jan = 2 weeks = 10 business days
    expect(getBusinessDays("2025-01-06", "2025-01-19")).toBe(10);
  });

  it("handles month boundaries", () => {
    // Mon 27 Jan through Fri 7 Feb: 5 + 5 = 10
    expect(getBusinessDays("2025-01-27", "2025-02-07")).toBe(10);
  });
});
