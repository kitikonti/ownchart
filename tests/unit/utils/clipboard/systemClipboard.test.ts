import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  writeRowsToSystemClipboard,
  writeCellToSystemClipboard,
  readRowsFromSystemClipboard,
  readCellFromSystemClipboard,
  getSystemClipboardType,
  clearSystemClipboard,
  isClipboardApiAvailable,
} from "../../../../src/utils/clipboard/systemClipboard";
import type { Task } from "../../../../src/types/chart.types";
import type { Dependency } from "../../../../src/types/dependency.types";
import { tid, hex } from "../../../helpers/branded";

// Mock clipboard storage
let clipboardContent = "";

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(async (text: string) => {
    clipboardContent = text;
  }),
  readText: vi.fn(async () => clipboardContent),
};

describe("systemClipboard", () => {
  beforeEach(() => {
    clipboardContent = "";
    vi.clearAllMocks();

    // Setup mock
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe("isClipboardApiAvailable", () => {
    it("should return true when clipboard API is available", () => {
      expect(isClipboardApiAvailable()).toBe(true);
    });

    it("should return false when clipboard is undefined", () => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isClipboardApiAvailable()).toBe(false);
    });
  });

  describe("writeRowsToSystemClipboard", () => {
    it("should write tasks and dependencies to clipboard with correct prefix", async () => {
      const tasks: Task[] = [
        {
          id: tid("task-1"),
          name: "Test Task",
          startDate: "2025-01-01",
          endDate: "2025-01-07",
          duration: 7,
          progress: 50,
          color: hex("#3b82f6"),
          order: 0,
          metadata: {},
        },
      ];
      const dependencies: Dependency[] = [];

      const result = await writeRowsToSystemClipboard(tasks, dependencies);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      expect(clipboardContent).toMatch(/^OWNCHART_ROWS:/);
      expect(clipboardContent).toContain("task-1");
      expect(clipboardContent).toContain("Test Task");
    });

    it("should include dependencies in clipboard data", async () => {
      const tasks: Task[] = [
        {
          id: tid("task-1"),
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-07",
          duration: 7,
          progress: 0,
          color: hex("#3b82f6"),
          order: 0,
          metadata: {},
        },
        {
          id: tid("task-2"),
          name: "Task 2",
          startDate: "2025-01-08",
          endDate: "2025-01-14",
          duration: 7,
          progress: 0,
          color: hex("#3b82f6"),
          order: 1,
          metadata: {},
        },
      ];
      const dependencies: Dependency[] = [
        {
          id: "dep-1",
          fromTaskId: tid("task-1"),
          toTaskId: tid("task-2"),
          type: "FS",
          createdAt: "2025-01-01T00:00:00Z",
        },
      ];

      await writeRowsToSystemClipboard(tasks, dependencies);

      expect(clipboardContent).toContain("dep-1");
      expect(clipboardContent).toContain("fromTaskId");
    });

    it("should return false on clipboard write failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await writeRowsToSystemClipboard([], []);

      expect(result).toBe(false);
    });
  });

  describe("writeCellToSystemClipboard", () => {
    it("should write cell value to clipboard with correct prefix", async () => {
      const result = await writeCellToSystemClipboard("Test Value", "name");

      expect(result).toBe(true);
      expect(clipboardContent).toMatch(/^OWNCHART_CELL:/);
      expect(clipboardContent).toContain("Test Value");
      expect(clipboardContent).toContain("name");
    });

    it("should handle numeric values", async () => {
      await writeCellToSystemClipboard(75, "progress");

      const parsed = JSON.parse(clipboardContent.replace("OWNCHART_CELL:", ""));
      expect(parsed.value).toBe(75);
      expect(parsed.field).toBe("progress");
    });

    it("should return false on clipboard write failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await writeCellToSystemClipboard("test", "name");

      expect(result).toBe(false);
    });
  });

  describe("readRowsFromSystemClipboard", () => {
    it("should read and parse row data from clipboard", async () => {
      const data = {
        tasks: [
          {
            id: "task-1",
            name: "Test Task",
            startDate: "2025-01-01",
            endDate: "2025-01-07",
            duration: 7,
            progress: 0,
            color: "#3b82f6",
            order: 0,
            metadata: {},
          },
        ],
        dependencies: [],
      };
      clipboardContent = "OWNCHART_ROWS:" + JSON.stringify(data);

      const result = await readRowsFromSystemClipboard();

      expect(result).not.toBeNull();
      expect(result?.tasks).toHaveLength(1);
      expect(result?.tasks[0].name).toBe("Test Task");
      expect(result?.dependencies).toHaveLength(0);
    });

    it("should return null for non-OwnChart data", async () => {
      clipboardContent = "Some random text";

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", async () => {
      clipboardContent = "OWNCHART_ROWS:{invalid json}";

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null when root JSON value is null", async () => {
      clipboardContent = "OWNCHART_ROWS:null";

      expect(await readRowsFromSystemClipboard()).toBeNull();
    });

    it("should return null when root JSON value is a string, not an object", async () => {
      clipboardContent = 'OWNCHART_ROWS:"just a string"';

      expect(await readRowsFromSystemClipboard()).toBeNull();
    });

    it("should return null if tasks is not an array", async () => {
      clipboardContent = 'OWNCHART_ROWS:{"tasks":"not an array","dependencies":[]}';

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null if dependencies is not an array", async () => {
      clipboardContent = 'OWNCHART_ROWS:{"tasks":[],"dependencies":"not an array"}';

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null when tasks have invalid shape (missing id)", async () => {
      clipboardContent =
        'OWNCHART_ROWS:{"tasks":[{"name":"No ID"}],"dependencies":[]}';

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null when tasks have invalid shape (missing name)", async () => {
      clipboardContent =
        'OWNCHART_ROWS:{"tasks":[{"id":"1"}],"dependencies":[]}';

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null when tasks contain non-object entries", async () => {
      clipboardContent =
        'OWNCHART_ROWS:{"tasks":["not-a-task"],"dependencies":[]}';

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null on clipboard read failure", async () => {
      mockClipboard.readText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null for oversized clipboard payload", async () => {
      clipboardContent = "OWNCHART_ROWS:" + "x".repeat(6_000_000);

      expect(await readRowsFromSystemClipboard()).toBeNull();
    });

    describe("task shape validation", () => {
      const validTask = {
        id: "task-1",
        name: "Test Task",
        startDate: "2025-01-01",
        endDate: "2025-01-07",
        duration: 7,
        progress: 0,
        color: "#3b82f6",
        order: 0,
        metadata: {},
      };

      const setClipboard = (overrides: Record<string, unknown>): void => {
        clipboardContent =
          "OWNCHART_ROWS:" +
          JSON.stringify({
            tasks: [{ ...validTask, ...overrides }],
            dependencies: [],
          });
      };

      it("should reject task with non-numeric duration", async () => {
        setClipboard({ duration: "seven" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with non-numeric order", async () => {
        setClipboard({ order: null });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with named color (not hex)", async () => {
        setClipboard({ color: "red" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with bare # color", async () => {
        setClipboard({ color: "#" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with non-hex color characters", async () => {
        setClipboard({ color: "#xyz123" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with 3-char short hex color", async () => {
        setClipboard({ color: "#f00" });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should accept task with 4-char hex color with alpha (#RGBA)", async () => {
        setClipboard({ color: "#f00f" });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should accept task with 6-char standard hex color", async () => {
        setClipboard({ color: "#ff0000" });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should accept task with 8-char hex color with alpha", async () => {
        setClipboard({ color: "#ff000088" });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject task with 5-char hex color (invalid CSS length)", async () => {
        setClipboard({ color: "#ff000" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with 7-char hex color (invalid CSS length)", async () => {
        setClipboard({ color: "#ff00000" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with non-ISO startDate", async () => {
        setClipboard({ startDate: "January 1, 2025" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with non-ISO endDate", async () => {
        setClipboard({ endDate: "not-a-date" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with empty string startDate", async () => {
        setClipboard({ startDate: "" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with non-boolean open field", async () => {
        setClipboard({ open: "yes" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with numeric open field", async () => {
        setClipboard({ open: 1 });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with open: false", async () => {
        setClipboard({ open: false });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should accept task with open: true", async () => {
        setClipboard({ open: true });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject task with non-hex colorOverride", async () => {
        setClipboard({ colorOverride: "blue" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with valid colorOverride", async () => {
        setClipboard({ colorOverride: "#ff0000" });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject task with empty string id", async () => {
        setClipboard({ id: "" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with negative duration", async () => {
        setClipboard({ duration: -1 });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with zero duration", async () => {
        setClipboard({ duration: 0 });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject task with progress above 100", async () => {
        setClipboard({ progress: 101 });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with negative progress", async () => {
        setClipboard({ progress: -1 });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with progress at boundary values (0 and 100)", async () => {
        setClipboard({ progress: 0 });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
        setClipboard({ progress: 100 });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject task with negative order", async () => {
        setClipboard({ order: -1 });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with order 0", async () => {
        setClipboard({ order: 0 });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject task with semantically invalid date (2024-02-30)", async () => {
        // Regex alone would accept this; the round-trip check must catch it.
        setClipboard({ startDate: "2024-02-30" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with semantically invalid date (2024-13-01)", async () => {
        setClipboard({ startDate: "2024-13-01" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with array metadata", async () => {
        setClipboard({ metadata: [] });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject task with empty string parent", async () => {
        setClipboard({ parent: "" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should accept task with non-empty string parent", async () => {
        setClipboard({ parent: "some-parent-id" });
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should return null when startDate is missing", async () => {
        setClipboard({ startDate: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should return null when endDate is missing", async () => {
        setClipboard({ endDate: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should return null when duration is missing", async () => {
        setClipboard({ duration: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should return null when progress is missing", async () => {
        setClipboard({ progress: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should return null when color is missing", async () => {
        setClipboard({ color: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should return null when order is missing", async () => {
        setClipboard({ order: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should return null when metadata is missing", async () => {
        setClipboard({ metadata: undefined });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });
    });

    describe("dependency shape validation", () => {
      const validTask = {
        id: "task-1",
        name: "Test Task",
        startDate: "2025-01-01",
        endDate: "2025-01-07",
        duration: 7,
        progress: 0,
        color: "#3b82f6",
        order: 0,
        metadata: {},
      };

      const validDep = {
        id: "dep-1",
        fromTaskId: "task-1",
        toTaskId: "task-2",
        type: "FS",
        createdAt: "2025-01-01T00:00:00Z",
      };

      const setClipboardWithDep = (
        overrides: Record<string, unknown>
      ): void => {
        clipboardContent =
          "OWNCHART_ROWS:" +
          JSON.stringify({
            tasks: [validTask],
            dependencies: [{ ...validDep, ...overrides }],
          });
      };

      it("should accept dependency with valid ISO datetime createdAt", async () => {
        setClipboardWithDep({});
        expect(await readRowsFromSystemClipboard()).not.toBeNull();
      });

      it("should reject dependency with invalid createdAt string", async () => {
        setClipboardWithDep({ createdAt: "not-a-date" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject dependency with empty string id", async () => {
        setClipboardWithDep({ id: "" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject dependency with empty string fromTaskId", async () => {
        setClipboardWithDep({ fromTaskId: "" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject dependency with empty string toTaskId", async () => {
        setClipboardWithDep({ toTaskId: "" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });

      it("should reject dependency with unknown type", async () => {
        setClipboardWithDep({ type: "INVALID" });
        expect(await readRowsFromSystemClipboard()).toBeNull();
      });
    });
  });

  describe("readCellFromSystemClipboard", () => {
    it("should read and parse cell data from clipboard", async () => {
      clipboardContent = 'OWNCHART_CELL:{"value":"Test Value","field":"name"}';

      const result = await readCellFromSystemClipboard();

      expect(result).not.toBeNull();
      expect(result?.value).toBe("Test Value");
      expect(result?.field).toBe("name");
    });

    it("should handle numeric values", async () => {
      clipboardContent = 'OWNCHART_CELL:{"value":75,"field":"progress"}';

      const result = await readCellFromSystemClipboard();

      expect(result?.value).toBe(75);
      expect(result?.field).toBe("progress");
    });

    it("should return null for non-OwnChart data", async () => {
      clipboardContent = "Some random text";

      const result = await readCellFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null for row data prefix", async () => {
      clipboardContent = 'OWNCHART_ROWS:{"tasks":[],"dependencies":[]}';

      const result = await readCellFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null if field is missing", async () => {
      clipboardContent = 'OWNCHART_CELL:{"value":"test"}';

      const result = await readCellFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null for invalid field name", async () => {
      clipboardContent =
        'OWNCHART_CELL:{"value":"test","field":"invalidField"}';

      const result = await readCellFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null on clipboard read failure", async () => {
      mockClipboard.readText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await readCellFromSystemClipboard();

      expect(result).toBeNull();
    });

    it("should return null for oversized clipboard payload", async () => {
      clipboardContent = "OWNCHART_CELL:" + "x".repeat(6_000_000);

      expect(await readCellFromSystemClipboard()).toBeNull();
    });

    describe("cell value type validation", () => {
      const setCell = (field: string, value: unknown): void => {
        clipboardContent =
          "OWNCHART_CELL:" + JSON.stringify({ field, value });
      };

      it("should return null for progress field with string value", async () => {
        setCell("progress", "75");
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for duration field with string value", async () => {
        setCell("duration", "5");
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for progress field with out-of-range value", async () => {
        setCell("progress", 150);
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for duration field with negative value", async () => {
        setCell("duration", -1);
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for name field with numeric value", async () => {
        setCell("name", 42);
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for startDate field with non-ISO string", async () => {
        setCell("startDate", "January 1");
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for color field with named color", async () => {
        setCell("color", "red");
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should return null for type field with invalid value", async () => {
        setCell("type", "project");
        expect(await readCellFromSystemClipboard()).toBeNull();
      });

      it("should not return null for type field with valid value", async () => {
        setCell("type", "summary");
        expect(await readCellFromSystemClipboard()).not.toBeNull();
      });

      it("should not return null for color field with valid hex", async () => {
        setCell("color", "#ff0000");
        expect(await readCellFromSystemClipboard()).not.toBeNull();
      });
    });
  });

  describe("getSystemClipboardType", () => {
    it('should return "row" for row clipboard data', async () => {
      clipboardContent = 'OWNCHART_ROWS:{"tasks":[],"dependencies":[]}';

      const result = await getSystemClipboardType();

      expect(result).toBe("row");
    });

    it('should return "cell" for cell clipboard data', async () => {
      clipboardContent = 'OWNCHART_CELL:{"value":"test","field":"name"}';

      const result = await getSystemClipboardType();

      expect(result).toBe("cell");
    });

    it("should return null for non-OwnChart data", async () => {
      clipboardContent = "Random clipboard content";

      const result = await getSystemClipboardType();

      expect(result).toBeNull();
    });

    it("should return null for empty clipboard", async () => {
      clipboardContent = "";

      const result = await getSystemClipboardType();

      expect(result).toBeNull();
    });

    it("should return null on clipboard read failure", async () => {
      mockClipboard.readText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await getSystemClipboardType();

      expect(result).toBeNull();
    });

    it("should return null for oversized OwnChart row payload", async () => {
      clipboardContent = "OWNCHART_ROWS:" + "x".repeat(6_000_000);

      expect(await getSystemClipboardType()).toBeNull();
    });

    it("should return null for oversized OwnChart cell payload", async () => {
      clipboardContent = "OWNCHART_CELL:" + "x".repeat(6_000_000);

      expect(await getSystemClipboardType()).toBeNull();
    });
  });

  describe("clearSystemClipboard", () => {
    it("should write empty string to clipboard", async () => {
      clipboardContent = "OWNCHART_ROWS:...";

      await clearSystemClipboard();

      expect(mockClipboard.writeText).toHaveBeenCalledWith("");
      expect(clipboardContent).toBe("");
    });

    it("should not throw on clipboard write failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Permission denied"));

      // Should not throw
      await expect(clearSystemClipboard()).resolves.toBeUndefined();
    });
  });

  describe("round-trip tests", () => {
    it("should correctly round-trip row data", async () => {
      const originalTasks: Task[] = [
        {
          id: tid("task-1"),
          name: "Round Trip Task",
          startDate: "2025-06-01",
          endDate: "2025-06-15",
          duration: 15,
          progress: 25,
          color: hex("#ff0000"),
          order: 0,
          type: "task",
          metadata: { custom: "data" },
        },
      ];
      const originalDeps: Dependency[] = [];

      await writeRowsToSystemClipboard(originalTasks, originalDeps);
      const result = await readRowsFromSystemClipboard();

      expect(result).not.toBeNull();
      expect(result?.tasks).toEqual(originalTasks);
      expect(result?.dependencies).toEqual(originalDeps);
    });

    it("should correctly round-trip cell data", async () => {
      const value = "Cell Value";
      const field = "name" as const;

      await writeCellToSystemClipboard(value, field);
      const result = await readCellFromSystemClipboard();

      expect(result).not.toBeNull();
      expect(result?.value).toBe(value);
      expect(result?.field).toBe(field);
    });
  });
});
