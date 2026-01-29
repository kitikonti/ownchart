import { describe, it, expect } from "vitest";
import {
  getEffectiveTasksToMove,
  getTaskDescendants,
  getTaskChildren,
  recalculateSummaryAncestors,
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
