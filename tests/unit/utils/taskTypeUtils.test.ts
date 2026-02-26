/**
 * Tests for taskTypeUtils.
 * Verifies task type cycling logic for tasks with/without children.
 */

import { describe, it, expect } from "vitest";
import { getNextTaskType } from "../../../src/utils/taskTypeUtils";

describe("getNextTaskType", () => {
  describe("without children", () => {
    it("cycles task → summary", () => {
      expect(getNextTaskType("task", false)).toBe("summary");
    });

    it("cycles summary → milestone", () => {
      expect(getNextTaskType("summary", false)).toBe("milestone");
    });

    it("cycles milestone → task", () => {
      expect(getNextTaskType("milestone", false)).toBe("task");
    });
  });

  describe("with children", () => {
    it("toggles task → summary", () => {
      expect(getNextTaskType("task", true)).toBe("summary");
    });

    it("toggles summary → task", () => {
      expect(getNextTaskType("summary", true)).toBe("task");
    });

    it("toggles milestone → task (milestone not allowed with children)", () => {
      expect(getNextTaskType("milestone", true)).toBe("task");
    });
  });
});
