import { describe, it, expect } from "vitest";
import { prepareExportTasks } from "@/utils/export/prepareExportTasks";
import { toTaskId } from "@/types/branded.types";
import type { Task } from "@/types/chart.types";

function makeTask(id: string): Task {
  return {
    id: toTaskId(id),
    name: `Task ${id}`,
    type: "task",
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    progress: 0,
    parentId: null,
    sortOrder: 0,
    color: null,
  };
}

describe("prepareExportTasks", () => {
  it("filters out hidden tasks", () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    const result = prepareExportTasks(tasks, [toTaskId("b")]);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual([toTaskId("a"), toTaskId("c")]);
  });

  it("returns all tasks when hiddenTaskIds is empty", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const result = prepareExportTasks(tasks, []);
    expect(result).toHaveLength(2);
    expect(result).toEqual(tasks);
  });

  it("silently ignores non-existent IDs in hiddenTaskIds", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const result = prepareExportTasks(tasks, [toTaskId("zzz")]);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when all tasks are hidden", () => {
    const tasks = [makeTask("a"), makeTask("b")];
    const result = prepareExportTasks(tasks, [toTaskId("a"), toTaskId("b")]);
    expect(result).toHaveLength(0);
  });

  it("returns a new array (not a reference to the input)", () => {
    const tasks = [makeTask("a")];
    const result = prepareExportTasks(tasks, []);
    expect(result).not.toBe(tasks);
  });

  it("handles duplicate IDs in hiddenTaskIds gracefully", () => {
    const tasks = [makeTask("a"), makeTask("b"), makeTask("c")];
    // "b" appears three times — Set deduplication means it is still filtered once
    const result = prepareExportTasks(tasks, [
      toTaskId("b"),
      toTaskId("b"),
      toTaskId("b"),
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual([toTaskId("a"), toTaskId("c")]);
  });
});
