/**
 * Unit tests for useTaskRowData helper functions.
 * Tests getClipboardPosition, getSelectionPosition, and getHiddenGap
 * which compute derived row state for the task table.
 */

import { describe, it, expect } from "vitest";
import {
  getClipboardPosition,
  getSelectionPosition,
  getHiddenGap,
} from "../../../src/hooks/useTaskRowData";

describe("useTaskRowData helpers", () => {
  // ── getClipboardPosition ───────────────────────────────────────────────

  describe("getClipboardPosition", () => {
    const clipboardSet = new Set(["task-2", "task-3", "task-4"]);

    it("should return undefined for tasks not in clipboard", () => {
      expect(
        getClipboardPosition("task-1", undefined, "task-2", clipboardSet)
      ).toBeUndefined();
    });

    it("should mark first task in clipboard group", () => {
      const result = getClipboardPosition(
        "task-2",
        "task-1",
        "task-3",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("should mark middle task in clipboard group", () => {
      const result = getClipboardPosition(
        "task-3",
        "task-2",
        "task-4",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: false, isLast: false });
    });

    it("should mark last task in clipboard group", () => {
      const result = getClipboardPosition(
        "task-4",
        "task-3",
        "task-5",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: false, isLast: true });
    });

    it("should mark single task as both first and last", () => {
      const singleSet = new Set(["task-2"]);
      const result = getClipboardPosition(
        "task-2",
        "task-1",
        "task-3",
        singleSet
      );
      expect(result).toEqual({ isFirst: true, isLast: true });
    });

    it("should treat first visible row (no prev) as first in group", () => {
      const result = getClipboardPosition(
        "task-2",
        undefined,
        "task-3",
        clipboardSet
      );
      expect(result).toEqual({ isFirst: true, isLast: false });
    });

    it("should treat last visible row (no next) as last in group", () => {
      const result = getClipboardPosition(
        "task-4",
        "task-3",
        undefined,
        clipboardSet
      );
      expect(result).toEqual({ isFirst: false, isLast: true });
    });
  });

  // ── getSelectionPosition ───────────────────────────────────────────────

  describe("getSelectionPosition", () => {
    const selectedSet = new Set(["task-1", "task-2", "task-3"]);

    it("should return undefined for unselected tasks", () => {
      expect(
        getSelectionPosition("task-5", "task-4", "task-6", selectedSet)
      ).toBeUndefined();
    });

    it("should mark first selected in contiguous group", () => {
      const result = getSelectionPosition(
        "task-1",
        "task-0",
        "task-2",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: true,
        isLastSelected: false,
      });
    });

    it("should mark middle selected in contiguous group", () => {
      const result = getSelectionPosition(
        "task-2",
        "task-1",
        "task-3",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: false,
        isLastSelected: false,
      });
    });

    it("should mark last selected in contiguous group", () => {
      const result = getSelectionPosition(
        "task-3",
        "task-2",
        "task-4",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: false,
        isLastSelected: true,
      });
    });

    it("should mark single selected as both first and last", () => {
      const singleSet = new Set(["task-2"]);
      const result = getSelectionPosition(
        "task-2",
        "task-1",
        "task-3",
        singleSet
      );
      expect(result).toEqual({
        isFirstSelected: true,
        isLastSelected: true,
      });
    });

    it("should handle first row in list (no prev)", () => {
      const result = getSelectionPosition(
        "task-1",
        undefined,
        "task-2",
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: true,
        isLastSelected: false,
      });
    });

    it("should handle last row in list (no next)", () => {
      const result = getSelectionPosition(
        "task-3",
        "task-2",
        undefined,
        selectedSet
      );
      expect(result).toEqual({
        isFirstSelected: false,
        isLastSelected: true,
      });
    });

    it("should handle non-contiguous selection (gaps)", () => {
      const gappedSet = new Set(["task-1", "task-3"]);
      // task-1 is selected, task-2 is not
      const result1 = getSelectionPosition(
        "task-1",
        undefined,
        "task-2",
        gappedSet
      );
      expect(result1).toEqual({
        isFirstSelected: true,
        isLastSelected: true,
      });
      // task-3 is selected, task-2 is not
      const result3 = getSelectionPosition(
        "task-3",
        "task-2",
        "task-4",
        gappedSet
      );
      expect(result3).toEqual({
        isFirstSelected: true,
        isLastSelected: true,
      });
    });
  });

  // ── getHiddenGap ──────────────────────────────────────────────────────

  describe("getHiddenGap", () => {
    it("should return no gap for consecutive rows", () => {
      expect(getHiddenGap(1, 2)).toEqual({
        hasHiddenBelow: false,
        hiddenBelowCount: 0,
      });
    });

    it("should detect a single hidden row", () => {
      expect(getHiddenGap(1, 3)).toEqual({
        hasHiddenBelow: true,
        hiddenBelowCount: 1,
      });
    });

    it("should detect multiple hidden rows", () => {
      expect(getHiddenGap(5, 10)).toEqual({
        hasHiddenBelow: true,
        hiddenBelowCount: 4,
      });
    });

    it("should handle last visible row (next = total + 1)", () => {
      // If this is row 8 and there are 10 total rows, next would be 11
      expect(getHiddenGap(8, 11)).toEqual({
        hasHiddenBelow: true,
        hiddenBelowCount: 2,
      });
    });

    it("should handle last row with no hidden rows after", () => {
      // Row 10 of 10, next = 11
      expect(getHiddenGap(10, 11)).toEqual({
        hasHiddenBelow: false,
        hiddenBelowCount: 0,
      });
    });
  });
});
