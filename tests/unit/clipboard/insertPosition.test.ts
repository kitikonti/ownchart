import { describe, it, expect } from "vitest";
import { determineInsertPosition } from "../../../src/utils/clipboard/insertPosition";
import { PLACEHOLDER_TASK_ID } from "../../../src/config/placeholderRow";
import type { FlattenedTask } from "../../../src/utils/hierarchy";
import type { Task } from "../../../src/types/chart.types";
import { tid, hex } from "../../helpers/branded";

function makeTask(id: string): Task {
  return {
    id: tid(id),
    name: id,
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    metadata: {},
  };
}

function makeFlattened(ids: string[]): FlattenedTask[] {
  return ids.map((id, i) => ({
    task: makeTask(id),
    level: 0,
    hasChildren: false,
    globalRowNumber: i + 1,
  }));
}

const noActiveCell = { taskId: null };

describe("determineInsertPosition", () => {
  describe("Priority 1: placeholder row", () => {
    it("should insert at end when active cell is the placeholder", () => {
      const flattened = makeFlattened(["a", "b", "c"]);
      const result = determineInsertPosition(
        { taskId: PLACEHOLDER_TASK_ID },
        [],
        flattened
      );
      expect(result).toBe(3);
    });

    it("should insert at end when only the placeholder is selected", () => {
      const flattened = makeFlattened(["a", "b"]);
      const result = determineInsertPosition(
        noActiveCell,
        [PLACEHOLDER_TASK_ID],
        flattened
      );
      expect(result).toBe(2);
    });

    it("should NOT trigger placeholder-end when placeholder is selected alongside real tasks", () => {
      // Placeholder + real selection → real selection should determine position
      const flattened = makeFlattened(["a", "b", "c"]);
      const result = determineInsertPosition(
        noActiveCell,
        [PLACEHOLDER_TASK_ID, tid("b")],
        flattened
      );
      // b is at index 1 → insert after → index 2
      expect(result).toBe(2);
    });
  });

  describe("Priority 2: active cell", () => {
    it("should insert before the active cell row", () => {
      const flattened = makeFlattened(["a", "b", "c"]);
      const result = determineInsertPosition(
        { taskId: tid("b") },
        [],
        flattened
      );
      // b is at index 1 → insert before → index 1
      expect(result).toBe(1);
    });

    it("should insert before the first row when active cell is row 0", () => {
      const flattened = makeFlattened(["a", "b"]);
      const result = determineInsertPosition(
        { taskId: tid("a") },
        [],
        flattened
      );
      expect(result).toBe(0);
    });

    it("should fall through to selection when active cell is not found in list", () => {
      const flattened = makeFlattened(["a", "b"]);
      // Active cell points to a task not in the flattened list (hidden/collapsed)
      const result = determineInsertPosition(
        { taskId: tid("missing") },
        [tid("b")],
        flattened
      );
      // Falls through to Priority 3: last selected = "b" at index 1 → insert after → 2
      expect(result).toBe(2);
    });
  });

  describe("Priority 3: last selected row", () => {
    it("should insert after the last selected task by visual position", () => {
      const flattened = makeFlattened(["a", "b", "c", "d"]);
      // selectedTaskIds in non-visual order to verify bottommost is used
      const result = determineInsertPosition(
        noActiveCell,
        [tid("d"), tid("b")],
        flattened
      );
      // d is at index 3 (bottommost) → insert after → 4
      expect(result).toBe(4);
    });

    it("should insert after a single selected task", () => {
      const flattened = makeFlattened(["a", "b", "c"]);
      const result = determineInsertPosition(
        noActiveCell,
        [tid("a")],
        flattened
      );
      expect(result).toBe(1);
    });

    it("should fall through to end when selected task not found in flattened list", () => {
      const flattened = makeFlattened(["a", "b"]);
      const result = determineInsertPosition(
        noActiveCell,
        [tid("nonexistent")],
        flattened
      );
      expect(result).toBe(2); // end of list
    });
  });

  describe("Priority 4: end of list (default)", () => {
    it("should insert at end when no active cell and no selection", () => {
      const flattened = makeFlattened(["a", "b", "c"]);
      const result = determineInsertPosition(noActiveCell, [], flattened);
      expect(result).toBe(3);
    });

    it("should return 0 for an empty flattened list with no context", () => {
      const result = determineInsertPosition(noActiveCell, [], []);
      expect(result).toBe(0);
    });
  });
});
