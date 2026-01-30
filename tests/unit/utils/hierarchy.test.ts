import { describe, it, expect } from "vitest";
import {
  getEffectiveTasksToMove,
  getTaskDescendants,
  getTaskChildren,
  recalculateSummaryAncestors,
  buildFlattenedTaskList,
  normalizeTaskOrder,
} from "../../../src/utils/hierarchy";
import type { Task } from "../../../src/types/chart.types";

// Helper to create a minimal task
function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id,
    name,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: "#3b82f6",
    order: 0,
    metadata: {},
    type: "task",
    ...options,
  };
}

describe("getEffectiveTasksToMove", () => {
  describe("simple non-hierarchical tasks", () => {
    it("should return all selected task IDs for regular tasks", () => {
      const tasks: Task[] = [
        createTask("1", "Task 1"),
        createTask("2", "Task 2"),
        createTask("3", "Task 3"),
      ];

      const result = getEffectiveTasksToMove(tasks, ["1", "2"]);

      expect(result).toHaveLength(2);
      expect(result).toContain("1");
      expect(result).toContain("2");
      expect(result).not.toContain("3");
    });

    it("should return single task when only one selected", () => {
      const tasks: Task[] = [
        createTask("1", "Task 1"),
        createTask("2", "Task 2"),
      ];

      const result = getEffectiveTasksToMove(tasks, ["1"]);

      expect(result).toEqual(["1"]);
    });

    it("should return empty array when no tasks selected", () => {
      const tasks: Task[] = [createTask("1", "Task 1")];

      const result = getEffectiveTasksToMove(tasks, []);

      expect(result).toEqual([]);
    });

    it("should handle non-existent task IDs gracefully", () => {
      const tasks: Task[] = [createTask("1", "Task 1")];

      const result = getEffectiveTasksToMove(tasks, ["1", "nonexistent"]);

      expect(result).toEqual(["1"]);
    });
  });

  describe("summary tasks", () => {
    it("should expand summary to include all descendants", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child1", "Child 1", { parent: "summary" }),
        createTask("child2", "Child 2", { parent: "summary" }),
      ];

      const result = getEffectiveTasksToMove(tasks, ["summary"]);

      expect(result).toHaveLength(2);
      expect(result).toContain("child1");
      expect(result).toContain("child2");
      // Summary itself should NOT be in result (it auto-recalculates)
      expect(result).not.toContain("summary");
    });

    it("should handle nested summaries", () => {
      const tasks: Task[] = [
        createTask("root", "Root Summary", { type: "summary" }),
        createTask("nested", "Nested Summary", {
          type: "summary",
          parent: "root",
        }),
        createTask("child1", "Child 1", { parent: "nested" }),
        createTask("child2", "Child 2", { parent: "root" }),
      ];

      const result = getEffectiveTasksToMove(tasks, ["root"]);

      // Should include all non-summary descendants
      expect(result).toContain("child1");
      expect(result).toContain("child2");
      // Summaries should NOT be included
      expect(result).not.toContain("root");
      expect(result).not.toContain("nested");
    });

    it("should not include summary tasks in result", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child", "Child", { parent: "summary" }),
      ];

      const result = getEffectiveTasksToMove(tasks, ["summary"]);

      expect(result).toEqual(["child"]);
    });
  });

  describe("overlapping selections", () => {
    it("should not duplicate tasks when both summary and child are selected", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child1", "Child 1", { parent: "summary" }),
        createTask("child2", "Child 2", { parent: "summary" }),
      ];

      // Select both summary AND one of its children
      const result = getEffectiveTasksToMove(tasks, ["summary", "child1"]);

      // child1 should only appear once (via summary expansion)
      expect(result).toHaveLength(2);
      expect(result).toContain("child1");
      expect(result).toContain("child2");
    });

    it("should handle selecting child when parent summary is also selected", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child", "Child", { parent: "summary" }),
        createTask("other", "Other Task"),
      ];

      const result = getEffectiveTasksToMove(tasks, ["summary", "child", "other"]);

      expect(result).toHaveLength(2);
      expect(result).toContain("child");
      expect(result).toContain("other");
    });
  });

  describe("milestones", () => {
    it("should include milestones in result", () => {
      const tasks: Task[] = [
        createTask("task", "Task"),
        createTask("milestone", "Milestone", { type: "milestone", duration: 0 }),
      ];

      const result = getEffectiveTasksToMove(tasks, ["task", "milestone"]);

      expect(result).toHaveLength(2);
      expect(result).toContain("task");
      expect(result).toContain("milestone");
    });

    it("should include milestones under summary", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("milestone", "Milestone", {
          type: "milestone",
          parent: "summary",
          duration: 0,
        }),
      ];

      const result = getEffectiveTasksToMove(tasks, ["summary"]);

      expect(result).toEqual(["milestone"]);
    });
  });
});

describe("getTaskDescendants", () => {
  it("should return all descendants of a task", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { type: "summary" }),
      createTask("child1", "Child 1", { parent: "parent" }),
      createTask("child2", "Child 2", { parent: "parent" }),
      createTask("grandchild", "Grandchild", { parent: "child1" }),
    ];

    const result = getTaskDescendants(tasks, "parent");

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toContain("child1");
    expect(result.map((t) => t.id)).toContain("child2");
    expect(result.map((t) => t.id)).toContain("grandchild");
  });

  it("should return empty array for task without children", () => {
    const tasks: Task[] = [createTask("leaf", "Leaf Task")];

    const result = getTaskDescendants(tasks, "leaf");

    expect(result).toEqual([]);
  });
});

describe("getTaskChildren", () => {
  it("should return direct children only", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent"),
      createTask("child1", "Child 1", { parent: "parent", order: 0 }),
      createTask("child2", "Child 2", { parent: "parent", order: 1 }),
      createTask("grandchild", "Grandchild", { parent: "child1" }),
    ];

    const result = getTaskChildren(tasks, "parent");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("child1");
    expect(result[1].id).toBe("child2");
  });

  it("should return root-level tasks when parentId is null", () => {
    const tasks: Task[] = [
      createTask("root1", "Root 1", { order: 0 }),
      createTask("root2", "Root 2", { order: 1 }),
      createTask("child", "Child", { parent: "root1" }),
    ];

    const result = getTaskChildren(tasks, null);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toContain("root1");
    expect(result.map((t) => t.id)).toContain("root2");
  });
});

describe("recalculateSummaryAncestors", () => {
  it("should recalculate summary dates from remaining children", () => {
    const tasks: Task[] = [
      createTask("summary1", "Summary", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-15",
        duration: 15,
        order: 0,
      }),
      createTask("child1", "Child 1", {
        parent: "summary1",
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        duration: 6,
        order: 1,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set(["summary1"])
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("summary1");
    expect(result[0].updates.startDate).toBe("2025-01-05");
    expect(result[0].updates.endDate).toBe("2025-01-10");
    expect(result[0].previousValues.startDate).toBe("2025-01-01");
    expect(result[0].previousValues.endDate).toBe("2025-01-15");

    // Should mutate in place
    expect(tasks[0].startDate).toBe("2025-01-05");
    expect(tasks[0].endDate).toBe("2025-01-10");
  });

  it("should clear dates when summary has no children", () => {
    const tasks: Task[] = [
      createTask("summary1", "Summary", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-15",
        duration: 15,
        order: 0,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set(["summary1"])
    );

    expect(result).toHaveLength(1);
    expect(result[0].updates.startDate).toBe("");
    expect(result[0].updates.endDate).toBe("");
    expect(result[0].updates.duration).toBe(0);
    expect(tasks[0].startDate).toBe("");
  });

  it("should cascade up through nested summaries", () => {
    const tasks: Task[] = [
      createTask("grandparent", "Grandparent", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        duration: 31,
        order: 0,
      }),
      createTask("parent", "Parent", {
        type: "summary",
        parent: "grandparent",
        startDate: "2025-01-01",
        endDate: "2025-01-20",
        duration: 20,
        order: 1,
      }),
      createTask("child1", "Child 1", {
        parent: "parent",
        startDate: "2025-01-10",
        endDate: "2025-01-15",
        duration: 6,
        order: 2,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set(["parent"])
    );

    // Should update both parent and grandparent
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("parent");
    expect(result[0].updates.startDate).toBe("2025-01-10");
    expect(result[0].updates.endDate).toBe("2025-01-15");
    expect(result[1].id).toBe("grandparent");
    expect(result[1].updates.startDate).toBe("2025-01-10");
    expect(result[1].updates.endDate).toBe("2025-01-15");
  });

  it("should skip non-summary parents", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", {
        type: "task",
        startDate: "2025-01-01",
        endDate: "2025-01-15",
        duration: 15,
        order: 0,
      }),
      createTask("child1", "Child 1", {
        parent: "parent",
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        order: 1,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set(["parent"])
    );

    expect(result).toHaveLength(0);
    // Parent task dates should not be changed
    expect(tasks[0].startDate).toBe("2025-01-01");
  });

  it("should not process the same parent twice", () => {
    const tasks: Task[] = [
      createTask("summary1", "Summary", {
        type: "summary",
        startDate: "2025-01-01",
        endDate: "2025-01-15",
        duration: 15,
        order: 0,
      }),
      createTask("child1", "Child 1", {
        parent: "summary1",
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        order: 1,
      }),
      createTask("child2", "Child 2", {
        parent: "summary1",
        startDate: "2025-01-08",
        endDate: "2025-01-12",
        order: 2,
      }),
    ];

    // Both children point to same parent
    const result = recalculateSummaryAncestors(
      tasks,
      new Set(["summary1", "summary1"])
    );

    expect(result).toHaveLength(1);
    expect(result[0].updates.startDate).toBe("2025-01-05");
    expect(result[0].updates.endDate).toBe("2025-01-12");
  });
});

describe("buildFlattenedTaskList", () => {
  it("should place children directly below their parent (tree-walk)", () => {
    const tasks: Task[] = [
      createTask("root1", "Root 1", { order: 0 }),
      createTask("root2", "Root 2", { order: 1, type: "summary" }),
      createTask("child1", "Child 1", { order: 10, parent: "root2" }),
      createTask("child2", "Child 2", { order: 11, parent: "root2" }),
      createTask("root3", "Root 3", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual(["root1", "root2", "child1", "child2", "root3"]);
  });

  it("should handle children with non-sequential order values", () => {
    // Simulates the bug: children have high order values after indent
    const tasks: Task[] = [
      createTask("summary", "Summary", { order: 5, type: "summary" }),
      createTask("childA", "Child A", { order: 27, parent: "summary" }),
      createTask("childB", "Child B", { order: 28, parent: "summary" }),
      createTask("other", "Other Task", { order: 6 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    // Children must appear right after their parent, not at the bottom
    expect(ids).toEqual(["summary", "childA", "childB", "other"]);
  });

  it("should respect collapsed state", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary" }),
      createTask("child", "Child", { order: 1, parent: "parent" }),
      createTask("other", "Other", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set(["parent"]));
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual(["parent", "other"]);
  });

  it("should respect task.open === false", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary", open: false }),
      createTask("child", "Child", { order: 1, parent: "parent" }),
      createTask("other", "Other", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual(["parent", "other"]);
  });

  it("should handle nested hierarchy with correct levels", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { order: 0, type: "summary" }),
      createTask("child", "Child", { order: 1, parent: "root", type: "summary" }),
      createTask("grandchild", "Grandchild", { order: 2, parent: "child" }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());

    expect(result).toHaveLength(3);
    expect(result[0].level).toBe(0);
    expect(result[1].level).toBe(1);
    expect(result[2].level).toBe(2);
  });

  it("should set hasChildren correctly", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary" }),
      createTask("child", "Child", { order: 1, parent: "parent" }),
      createTask("leaf", "Leaf", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());

    expect(result[0].hasChildren).toBe(true);
    expect(result[1].hasChildren).toBe(false);
    expect(result[2].hasChildren).toBe(false);
  });

  it("should treat orphan tasks as root-level (parent ID not found)", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { order: 0 }),
      createTask("orphan", "Orphan", { order: 1, parent: "deleted-parent" }),
      createTask("other", "Other", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    // Orphan must not disappear — should appear at root level
    expect(ids).toContain("orphan");
    expect(ids).toHaveLength(3);
    // Orphan should be at level 0 (root)
    const orphanEntry = result.find((r) => r.task.id === "orphan");
    expect(orphanEntry!.level).toBe(0);
  });

  it("should not mark non-existent parent as having children", () => {
    const tasks: Task[] = [
      createTask("orphan", "Orphan", { order: 0, parent: "ghost" }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());

    expect(result).toHaveLength(1);
    expect(result[0].hasChildren).toBe(false);
  });

  it("should sort siblings by order within each parent group", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary" }),
      createTask("childB", "Child B", { order: 3, parent: "parent" }),
      createTask("childA", "Child A", { order: 1, parent: "parent" }),
      createTask("childC", "Child C", { order: 5, parent: "parent" }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual(["parent", "childA", "childB", "childC"]);
  });
});

describe("normalizeTaskOrder", () => {
  it("should assign sequential order values based on tree-walk", () => {
    const tasks: Task[] = [
      createTask("root1", "Root 1", { order: 0 }),
      createTask("root2", "Root 2", { order: 5, type: "summary" }),
      createTask("child1", "Child 1", { order: 27, parent: "root2" }),
      createTask("child2", "Child 2", { order: 28, parent: "root2" }),
      createTask("root3", "Root 3", { order: 6 }),
    ];

    normalizeTaskOrder(tasks);

    expect(tasks.find((t) => t.id === "root1")!.order).toBe(0);
    expect(tasks.find((t) => t.id === "root2")!.order).toBe(1);
    expect(tasks.find((t) => t.id === "child1")!.order).toBe(2);
    expect(tasks.find((t) => t.id === "child2")!.order).toBe(3);
    expect(tasks.find((t) => t.id === "root3")!.order).toBe(4);
  });

  it("should handle empty task list", () => {
    const tasks: Task[] = [];
    normalizeTaskOrder(tasks);
    expect(tasks).toEqual([]);
  });

  it("should fix the real-world bug scenario", () => {
    // "Welding Frames & Sheet Metal" (order=9) with children at order=27,28,29
    const tasks: Task[] = [
      createTask("task1", "Task 1", { order: 0 }),
      createTask("task2", "Task 2", { order: 1 }),
      createTask("welding", "Welding Frames", { order: 9, type: "summary" }),
      createTask("task10", "Task 10", { order: 10 }),
      createTask("weld1", "Sub-Weld 1", { order: 27, parent: "welding" }),
      createTask("weld2", "Sub-Weld 2", { order: 28, parent: "welding" }),
      createTask("weld3", "Sub-Weld 3", { order: 29, parent: "welding" }),
    ];

    normalizeTaskOrder(tasks);

    // After normalization, children should follow parent sequentially
    const welding = tasks.find((t) => t.id === "welding")!;
    const weld1 = tasks.find((t) => t.id === "weld1")!;
    const weld2 = tasks.find((t) => t.id === "weld2")!;
    const weld3 = tasks.find((t) => t.id === "weld3")!;
    const task10 = tasks.find((t) => t.id === "task10")!;

    expect(weld1.order).toBe(welding.order + 1);
    expect(weld2.order).toBe(welding.order + 2);
    expect(weld3.order).toBe(welding.order + 3);
    expect(task10.order).toBeGreaterThan(weld3.order);
  });
});
