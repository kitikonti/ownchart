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
          id: "task-1",
          name: "Test Task",
          startDate: "2025-01-01",
          endDate: "2025-01-07",
          duration: 7,
          progress: 50,
          color: "#3b82f6",
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
          id: "task-1",
          name: "Task 1",
          startDate: "2025-01-01",
          endDate: "2025-01-07",
          duration: 7,
          progress: 0,
          color: "#3b82f6",
          order: 0,
          metadata: {},
        },
        {
          id: "task-2",
          name: "Task 2",
          startDate: "2025-01-08",
          endDate: "2025-01-14",
          duration: 7,
          progress: 0,
          color: "#3b82f6",
          order: 1,
          metadata: {},
        },
      ];
      const dependencies: Dependency[] = [
        {
          id: "dep-1",
          fromTaskId: "task-1",
          toTaskId: "task-2",
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

    it("should return null on clipboard read failure", async () => {
      mockClipboard.readText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await readRowsFromSystemClipboard();

      expect(result).toBeNull();
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

    it("should return null on clipboard read failure", async () => {
      mockClipboard.readText.mockRejectedValueOnce(new Error("Permission denied"));

      const result = await readCellFromSystemClipboard();

      expect(result).toBeNull();
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
          id: "task-1",
          name: "Round Trip Task",
          startDate: "2025-06-01",
          endDate: "2025-06-15",
          duration: 15,
          progress: 25,
          color: "#ff0000",
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
