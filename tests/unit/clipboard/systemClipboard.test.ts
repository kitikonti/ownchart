import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  writeRowsToSystemClipboard,
  writeCellToSystemClipboard,
  readRowsFromSystemClipboard,
  readCellFromSystemClipboard,
  getSystemClipboardType,
  clearSystemClipboard,
  isClipboardApiAvailable,
} from "../../../src/utils/clipboard/systemClipboard";
import type { Task } from "../../../src/types/chart.types";
import type { Dependency } from "../../../src/types/dependency.types";
import { tid, hex } from "../../helpers/branded";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTask(id = "t1"): Task {
  return {
    id: tid(id),
    name: "Task",
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    duration: 7,
    progress: 0,
    color: hex("#3b82f6"),
    order: 0,
    metadata: {},
  };
}

function makeDep(id = "d1"): Dependency {
  return {
    id,
    fromTaskId: tid("t1"),
    toTaskId: tid("t2"),
    type: "FS",
    createdAt: "2025-01-01T00:00:00.000Z",
  };
}

// ─── Clipboard API mock ──────────────────────────────────────────────────────

function mockClipboard(
  overrides: Partial<{
    writeText: () => Promise<void>;
    readText: () => Promise<string>;
  }> = {}
): void {
  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    value: {
      writeText: overrides.writeText ?? vi.fn().mockResolvedValue(undefined),
      readText: overrides.readText ?? vi.fn().mockResolvedValue(""),
    },
  });
}

beforeEach(() => {
  mockClipboard();
});

// ─── isClipboardApiAvailable ─────────────────────────────────────────────────

describe("isClipboardApiAvailable", () => {
  it("should return true when all clipboard methods are present", () => {
    mockClipboard();
    expect(isClipboardApiAvailable()).toBe(true);
  });

  it("should return false when navigator.clipboard is missing", () => {
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: undefined,
    });
    expect(isClipboardApiAvailable()).toBe(false);
    // restore
    mockClipboard();
  });
});

// ─── writeRowsToSystemClipboard ──────────────────────────────────────────────

describe("writeRowsToSystemClipboard", () => {
  it("should write serialized JSON with the row prefix", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });

    const task = makeTask();
    await writeRowsToSystemClipboard([task], []);

    expect(writeText).toHaveBeenCalledOnce();
    const written = writeText.mock.calls[0][0] as string;
    expect(written).toMatch(/^OWNCHART_ROWS:/);

    const parsed = JSON.parse(written.slice("OWNCHART_ROWS:".length)) as {
      tasks: Task[];
      dependencies: Dependency[];
    };
    expect(parsed.tasks).toHaveLength(1);
    expect(parsed.dependencies).toHaveLength(0);
  });

  it("should return true on success", async () => {
    const result = await writeRowsToSystemClipboard([makeTask()], []);
    expect(result).toBe(true);
  });

  it("should return false when clipboard API throws", async () => {
    mockClipboard({
      writeText: vi.fn().mockRejectedValue(new Error("permission denied")),
    });
    const result = await writeRowsToSystemClipboard([makeTask()], []);
    expect(result).toBe(false);
  });
});

// ─── writeCellToSystemClipboard ──────────────────────────────────────────────

describe("writeCellToSystemClipboard", () => {
  it("should write serialized JSON with the cell prefix", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });

    await writeCellToSystemClipboard("My Task", "name");

    const written = writeText.mock.calls[0][0] as string;
    expect(written).toMatch(/^OWNCHART_CELL:/);
    const parsed = JSON.parse(written.slice("OWNCHART_CELL:".length)) as {
      value: string;
      field: string;
    };
    expect(parsed.value).toBe("My Task");
    expect(parsed.field).toBe("name");
  });

  it("should return true on success", async () => {
    const result = await writeCellToSystemClipboard(42, "progress");
    expect(result).toBe(true);
  });

  it("should return false when clipboard API throws", async () => {
    mockClipboard({
      writeText: vi.fn().mockRejectedValue(new Error("denied")),
    });
    const result = await writeCellToSystemClipboard("x", "name");
    expect(result).toBe(false);
  });
});

// ─── readRowsFromSystemClipboard ─────────────────────────────────────────────

describe("readRowsFromSystemClipboard", () => {
  it("should return valid data when clipboard contains well-formed row data", async () => {
    const task = makeTask();
    const dep = makeDep();
    const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [task], dependencies: [dep] })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });

    const result = await readRowsFromSystemClipboard();
    expect(result).not.toBeNull();
    expect(result!.tasks).toHaveLength(1);
    expect(result!.dependencies).toHaveLength(1);
  });

  it("should return null when prefix does not match", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("OWNCHART_CELL:{...}") });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should return null for invalid JSON", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("OWNCHART_ROWS:not-json") });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should return null when tasks is not an array", async () => {
    const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: "bad", dependencies: [] })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should return null when a task fails shape validation (missing required field)", async () => {
    const bad = { id: tid("x"), name: "No color" }; // missing color, order, etc.
    const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [bad], dependencies: [] })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should return null when a task has a color without # prefix", async () => {
    const bad = { ...makeTask(), color: "3b82f6" }; // missing #
    const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [bad], dependencies: [] })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should return null when a task has an unknown type value", async () => {
    const bad = { ...makeTask(), type: "invalid-type" };
    const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [bad], dependencies: [] })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should accept tasks with known type values", async () => {
    for (const type of ["task", "summary", "milestone"] as const) {
      const task = { ...makeTask(), type };
      const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [task], dependencies: [] })}`;
      mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
      const result = await readRowsFromSystemClipboard();
      expect(result).not.toBeNull();
    }
  });

  it("should return null when a dependency has an unknown type value", async () => {
    const bad = { ...makeDep(), type: "XY" }; // not a DependencyType
    const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [makeTask()], dependencies: [bad] })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });

  it("should accept all known dependency type values", async () => {
    for (const type of ["FS", "SS", "FF", "SF"] as const) {
      const dep = { ...makeDep(), type };
      const payload = `OWNCHART_ROWS:${JSON.stringify({ tasks: [makeTask()], dependencies: [dep] })}`;
      mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
      const result = await readRowsFromSystemClipboard();
      expect(result).not.toBeNull();
    }
  });

  it("should return null when clipboard API throws", async () => {
    mockClipboard({ readText: vi.fn().mockRejectedValue(new Error("denied")) });
    expect(await readRowsFromSystemClipboard()).toBeNull();
  });
});

// ─── readCellFromSystemClipboard ─────────────────────────────────────────────

describe("readCellFromSystemClipboard", () => {
  it("should return valid data for a well-formed cell entry", async () => {
    const payload = `OWNCHART_CELL:${JSON.stringify({ value: "My Task", field: "name" })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    const result = await readCellFromSystemClipboard();
    expect(result).not.toBeNull();
    expect(result!.value).toBe("My Task");
    expect(result!.field).toBe("name");
  });

  it("should return null when prefix does not match", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("OWNCHART_ROWS:{...}") });
    expect(await readCellFromSystemClipboard()).toBeNull();
  });

  it("should return null when field is not a known EditableField", async () => {
    const payload = `OWNCHART_CELL:${JSON.stringify({ value: "x", field: "unknown" })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readCellFromSystemClipboard()).toBeNull();
  });

  it("should return null when value is null", async () => {
    const payload = `OWNCHART_CELL:${JSON.stringify({ value: null, field: "name" })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readCellFromSystemClipboard()).toBeNull();
  });

  it("should return null when value is undefined (missing key)", async () => {
    const payload = `OWNCHART_CELL:${JSON.stringify({ field: "name" })}`;
    mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
    expect(await readCellFromSystemClipboard()).toBeNull();
  });

  it("should return null when clipboard API throws", async () => {
    mockClipboard({ readText: vi.fn().mockRejectedValue(new Error("denied")) });
    expect(await readCellFromSystemClipboard()).toBeNull();
  });

  it("should accept all known EditableField values", async () => {
    const fields = ["name", "startDate", "endDate", "duration", "progress", "color", "type"] as const;
    for (const field of fields) {
      const payload = `OWNCHART_CELL:${JSON.stringify({ value: "x", field })}`;
      mockClipboard({ readText: vi.fn().mockResolvedValue(payload) });
      const result = await readCellFromSystemClipboard();
      expect(result).not.toBeNull();
    }
  });
});

// ─── getSystemClipboardType ───────────────────────────────────────────────────

describe("getSystemClipboardType", () => {
  it("should return 'row' for row clipboard data", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("OWNCHART_ROWS:{...}") });
    expect(await getSystemClipboardType()).toBe("row");
  });

  it("should return 'cell' for cell clipboard data", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("OWNCHART_CELL:{...}") });
    expect(await getSystemClipboardType()).toBe("cell");
  });

  it("should return null for non-OwnChart clipboard content", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("plain text") });
    expect(await getSystemClipboardType()).toBeNull();
  });

  it("should return null for empty clipboard", async () => {
    mockClipboard({ readText: vi.fn().mockResolvedValue("") });
    expect(await getSystemClipboardType()).toBeNull();
  });

  it("should return null when clipboard API throws", async () => {
    mockClipboard({ readText: vi.fn().mockRejectedValue(new Error("denied")) });
    expect(await getSystemClipboardType()).toBeNull();
  });
});

// ─── clearSystemClipboard ────────────────────────────────────────────────────

describe("clearSystemClipboard", () => {
  it("should write an empty string to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard({ writeText });
    await clearSystemClipboard();
    expect(writeText).toHaveBeenCalledWith("");
  });

  it("should not throw when clipboard API throws", async () => {
    mockClipboard({
      writeText: vi.fn().mockRejectedValue(new Error("denied")),
    });
    await expect(clearSystemClipboard()).resolves.toBeUndefined();
  });
});
