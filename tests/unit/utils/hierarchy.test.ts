import { describe, it, expect } from "vitest";
import {
  getEffectiveTasksToMove,
  getTaskDescendants,
  getTaskChildren,
  getTaskPath,
  getTaskLevel,
  wouldCreateCircularHierarchy,
  getMaxDescendantLevel,
  getMaxDepth,
  calculateSummaryDates,
  recalculateSummaryAncestors,
  buildFlattenedTaskList,
  normalizeTaskOrder,
  collectDescendantIds,
  canHaveChildren,
} from "@/utils/hierarchy";
import type { Task } from "@/types/chart.types";
import { tid, hex } from "../../helpers/branded";

// Helper to create a minimal task
function createTask(
  id: string,
  name: string,
  options: Partial<Task> = {}
): Task {
  return {
    id: tid(id),
    name,
    startDate: "2025-01-01",
    endDate: "2025-01-05",
    duration: 5,
    progress: 0,
    color: hex("#3b82f6"),
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

      const result = getEffectiveTasksToMove(tasks, [tid("1"), tid("2")]);

      expect(result).toHaveLength(2);
      expect(result).toContain(tid("1"));
      expect(result).toContain(tid("2"));
      expect(result).not.toContain(tid("3"));
    });

    it("should return single task when only one selected", () => {
      const tasks: Task[] = [
        createTask("1", "Task 1"),
        createTask("2", "Task 2"),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("1")]);

      expect(result).toEqual([tid("1")]);
    });

    it("should return empty array when no tasks selected", () => {
      const tasks: Task[] = [createTask("1", "Task 1")];

      const result = getEffectiveTasksToMove(tasks, []);

      expect(result).toEqual([]);
    });

    it("should handle non-existent task IDs gracefully", () => {
      const tasks: Task[] = [createTask("1", "Task 1")];

      const result = getEffectiveTasksToMove(tasks, [tid("1"), tid("nonexistent")]);

      expect(result).toEqual([tid("1")]);
    });
  });

  describe("summary tasks", () => {
    it("should expand summary to include all descendants", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child1", "Child 1", { parent: tid("summary") }),
        createTask("child2", "Child 2", { parent: tid("summary") }),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("summary")]);

      expect(result).toHaveLength(2);
      expect(result).toContain(tid("child1"));
      expect(result).toContain(tid("child2"));
      // Summary itself should NOT be in result (it auto-recalculates)
      expect(result).not.toContain(tid("summary"));
    });

    it("should handle nested summaries", () => {
      const tasks: Task[] = [
        createTask("root", "Root Summary", { type: "summary" }),
        createTask("nested", "Nested Summary", {
          type: "summary",
          parent: tid("root"),
        }),
        createTask("child1", "Child 1", { parent: tid("nested") }),
        createTask("child2", "Child 2", { parent: tid("root") }),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("root")]);

      // Should include all non-summary descendants
      expect(result).toContain(tid("child1"));
      expect(result).toContain(tid("child2"));
      // Summaries should NOT be included
      expect(result).not.toContain(tid("root"));
      expect(result).not.toContain(tid("nested"));
    });

    it("should not include summary tasks in result", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child", "Child", { parent: tid("summary") }),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("summary")]);

      expect(result).toEqual([tid("child")]);
    });
  });

  describe("overlapping selections", () => {
    it("should not duplicate tasks when both summary and child are selected", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child1", "Child 1", { parent: tid("summary") }),
        createTask("child2", "Child 2", { parent: tid("summary") }),
      ];

      // Select both summary AND one of its children
      const result = getEffectiveTasksToMove(tasks, [tid("summary"), tid("child1")]);

      // child1 should only appear once (via summary expansion)
      expect(result).toHaveLength(2);
      expect(result).toContain(tid("child1"));
      expect(result).toContain(tid("child2"));
    });

    it("should handle selecting child when parent summary is also selected", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("child", "Child", { parent: tid("summary") }),
        createTask("other", "Other Task"),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("summary"), tid("child"), tid("other")]);

      expect(result).toHaveLength(2);
      expect(result).toContain(tid("child"));
      expect(result).toContain(tid("other"));
    });
  });

  describe("milestones", () => {
    it("should include milestones in result", () => {
      const tasks: Task[] = [
        createTask("task", "Task"),
        createTask("milestone", "Milestone", { type: "milestone", duration: 0 }),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("task"), tid("milestone")]);

      expect(result).toHaveLength(2);
      expect(result).toContain(tid("task"));
      expect(result).toContain(tid("milestone"));
    });

    it("should include milestones under summary", () => {
      const tasks: Task[] = [
        createTask("summary", "Summary", { type: "summary" }),
        createTask("milestone", "Milestone", {
          type: "milestone",
          parent: tid("summary"),
          duration: 0,
        }),
      ];

      const result = getEffectiveTasksToMove(tasks, [tid("summary")]);

      expect(result).toEqual([tid("milestone")]);
    });
  });
});

describe("getTaskDescendants", () => {
  it("should return all descendants of a task", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { type: "summary" }),
      createTask("child1", "Child 1", { parent: tid("parent") }),
      createTask("child2", "Child 2", { parent: tid("parent") }),
      createTask("grandchild", "Grandchild", { parent: tid("child1") }),
    ];

    const result = getTaskDescendants(tasks, tid("parent"));

    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toContain(tid("child1"));
    expect(result.map((t) => t.id)).toContain(tid("child2"));
    expect(result.map((t) => t.id)).toContain(tid("grandchild"));
  });

  it("should return empty array for task without children", () => {
    const tasks: Task[] = [createTask("leaf", "Leaf Task")];

    const result = getTaskDescendants(tasks, tid("leaf"));

    expect(result).toEqual([]);
  });
});

describe("getTaskChildren", () => {
  it("should return direct children only", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent"),
      createTask("child1", "Child 1", { parent: tid("parent"), order: 0 }),
      createTask("child2", "Child 2", { parent: tid("parent"), order: 1 }),
      createTask("grandchild", "Grandchild", { parent: tid("child1") }),
    ];

    const result = getTaskChildren(tasks, tid("parent"));

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(tid("child1"));
    expect(result[1].id).toBe(tid("child2"));
  });

  it("should return root-level tasks when parentId is null", () => {
    const tasks: Task[] = [
      createTask("root1", "Root 1", { order: 0 }),
      createTask("root2", "Root 2", { order: 1 }),
      createTask("child", "Child", { parent: tid("root1") }),
    ];

    const result = getTaskChildren(tasks, null);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toContain(tid("root1"));
    expect(result.map((t) => t.id)).toContain(tid("root2"));
  });
});

describe("getTaskPath", () => {
  it("should return empty array for a root task", () => {
    const tasks: Task[] = [createTask("root", "Root")];

    expect(getTaskPath(tasks, tid("root"))).toEqual([]);
  });

  it("should return the parent ID for a direct child", () => {
    const tasks: Task[] = [
      createTask("root", "Root"),
      createTask("child", "Child", { parent: tid("root") }),
    ];

    expect(getTaskPath(tasks, tid("child"))).toEqual([tid("root")]);
  });

  it("should return ancestors root-first for a deeply nested task", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("mid", "Mid", { type: "summary", parent: tid("root") }),
      createTask("leaf", "Leaf", { parent: tid("mid") }),
    ];

    expect(getTaskPath(tasks, tid("leaf"))).toEqual([tid("root"), tid("mid")]);
  });

  it("should return empty array for an unknown task ID", () => {
    const tasks: Task[] = [createTask("root", "Root")];

    expect(getTaskPath(tasks, tid("ghost"))).toEqual([]);
  });
});

describe("getTaskLevel", () => {
  it("should return 0 for a root task", () => {
    const tasks: Task[] = [createTask("root", "Root")];

    expect(getTaskLevel(tasks, tid("root"))).toBe(0);
  });

  it("should return 1 for a direct child", () => {
    const tasks: Task[] = [
      createTask("root", "Root"),
      createTask("child", "Child", { parent: tid("root") }),
    ];

    expect(getTaskLevel(tasks, tid("child"))).toBe(1);
  });

  it("should return 2 for a grandchild", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("mid", "Mid", { type: "summary", parent: tid("root") }),
      createTask("leaf", "Leaf", { parent: tid("mid") }),
    ];

    expect(getTaskLevel(tasks, tid("leaf"))).toBe(2);
  });

  it("should return 0 for an unknown task ID", () => {
    const tasks: Task[] = [createTask("root", "Root")];

    expect(getTaskLevel(tasks, tid("ghost"))).toBe(0);
  });

  it("should handle circular references in task data without infinite recursion", () => {
    // Simulates corrupt data: task A claims task B as parent, and B claims A.
    // The circular-reference guard in buildLevelMap prevents infinite recursion
    // by breaking the cycle. The resulting levels are implementation-defined
    // (which node in the cycle gets 0 depends on iteration order), but both
    // are guaranteed to be finite numbers.
    const tasks: Task[] = [
      createTask("a", "A", { parent: tid("b") }),
      createTask("b", "B", { parent: tid("a") }),
    ];

    const levelA = getTaskLevel(tasks, tid("a"));
    const levelB = getTaskLevel(tasks, tid("b"));

    expect(Number.isFinite(levelA)).toBe(true);
    expect(Number.isFinite(levelB)).toBe(true);
  });
});

describe("wouldCreateCircularHierarchy", () => {
  it("should return false when newParentId is null (root move)", () => {
    const tasks: Task[] = [createTask("a", "A")];

    expect(wouldCreateCircularHierarchy(tasks, tid("a"), null)).toBe(false);
  });

  it("should return true when a task is moved under itself", () => {
    const tasks: Task[] = [createTask("a", "A")];

    expect(wouldCreateCircularHierarchy(tasks, tid("a"), tid("a"))).toBe(true);
  });

  it("should return true when newParent is a descendant of the task", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("child", "Child", { parent: tid("root") }),
      createTask("grandchild", "Grandchild", { parent: tid("child") }),
    ];

    // Moving root under grandchild would create a cycle
    expect(wouldCreateCircularHierarchy(tasks, tid("root"), tid("grandchild"))).toBe(true);
    expect(wouldCreateCircularHierarchy(tasks, tid("root"), tid("child"))).toBe(true);
  });

  it("should return false for a valid reparent (unrelated target)", () => {
    const tasks: Task[] = [
      createTask("a", "A", { type: "summary" }),
      createTask("b", "B", { parent: tid("a") }),
      createTask("c", "C"),
    ];

    expect(wouldCreateCircularHierarchy(tasks, tid("a"), tid("c"))).toBe(false);
  });

  it("should return false when moving a child to a sibling parent", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("child1", "Child 1", { parent: tid("root") }),
      createTask("child2", "Child 2", { parent: tid("root") }),
    ];

    expect(wouldCreateCircularHierarchy(tasks, tid("child1"), tid("child2"))).toBe(false);
  });
});

describe("getMaxDescendantLevel", () => {
  it("should return the task's own level when it has no descendants", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { order: 0 }),
      createTask("child", "Child", { parent: tid("root"), order: 1 }),
    ];

    expect(getMaxDescendantLevel(tasks, tid("child"))).toBe(1);
  });

  it("should return 0 for a root task without children", () => {
    const tasks: Task[] = [createTask("root", "Root", { order: 0 })];

    expect(getMaxDescendantLevel(tasks, tid("root"))).toBe(0);
  });

  it("should return deepest descendant level for a summary with children", () => {
    // Root (0) -> Child (1) -> Grandchild (2)
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary", order: 0 }),
      createTask("child", "Child", { parent: tid("root"), type: "summary", order: 1 }),
      createTask("grandchild", "Grandchild", { parent: tid("child"), order: 2 }),
    ];

    expect(getMaxDescendantLevel(tasks, tid("root"))).toBe(2);
    expect(getMaxDescendantLevel(tasks, tid("child"))).toBe(2);
    expect(getMaxDescendantLevel(tasks, tid("grandchild"))).toBe(2);
  });

  it("should handle mixed depth subtrees", () => {
    // Root (0)
    //   Alpha (1) — no children
    //   Beta (1)
    //     Gamma (2) — deepest
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary", order: 0 }),
      createTask("alpha", "Alpha", { parent: tid("root"), order: 1 }),
      createTask("beta", "Beta", { parent: tid("root"), type: "summary", order: 2 }),
      createTask("gamma", "Gamma", { parent: tid("beta"), order: 3 }),
    ];

    expect(getMaxDescendantLevel(tasks, tid("root"))).toBe(2);
    expect(getMaxDescendantLevel(tasks, tid("beta"))).toBe(2);
    expect(getMaxDescendantLevel(tasks, tid("alpha"))).toBe(1);
  });
});

describe("getMaxDepth", () => {
  it("should return 0 for an empty task list", () => {
    expect(getMaxDepth([])).toBe(0);
  });

  it("should return 0 for a flat list with no children", () => {
    const tasks: Task[] = [
      createTask("a", "A", { order: 0 }),
      createTask("b", "B", { order: 1 }),
    ];

    expect(getMaxDepth(tasks)).toBe(0);
  });

  it("should return 1 for a single level of children", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("child", "Child", { parent: tid("root") }),
    ];

    expect(getMaxDepth(tasks)).toBe(1);
  });

  it("should return 2 for a two-level hierarchy", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("mid", "Mid", { type: "summary", parent: tid("root") }),
      createTask("leaf", "Leaf", { parent: tid("mid") }),
    ];

    expect(getMaxDepth(tasks)).toBe(2);
  });
});

describe("calculateSummaryDates", () => {
  it("should return null for a non-summary task", () => {
    const tasks: Task[] = [
      createTask("task", "Task", { startDate: "2025-01-01", endDate: "2025-01-05" }),
    ];

    expect(calculateSummaryDates(tasks, tid("task"))).toBeNull();
  });

  it("should return null for a summary with no children", () => {
    const tasks: Task[] = [
      createTask("summary", "Summary", { type: "summary" }),
    ];

    expect(calculateSummaryDates(tasks, tid("summary"))).toBeNull();
  });

  it("should return null for an unknown task ID", () => {
    const tasks: Task[] = [createTask("task", "Task")];

    expect(calculateSummaryDates(tasks, tid("ghost"))).toBeNull();
  });

  it("should span the earliest start to latest end of children", () => {
    const tasks: Task[] = [
      createTask("summary", "Summary", { type: "summary" }),
      createTask("child1", "Child 1", {
        parent: tid("summary"),
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        duration: 6,
      }),
      createTask("child2", "Child 2", {
        parent: tid("summary"),
        startDate: "2025-01-03",
        endDate: "2025-01-08",
        duration: 6,
      }),
    ];

    const result = calculateSummaryDates(tasks, tid("summary"));

    expect(result).not.toBeNull();
    expect(result!.startDate).toBe("2025-01-03");
    expect(result!.endDate).toBe("2025-01-10");
    expect(result!.duration).toBe(8); // Jan 3 to Jan 10 inclusive
  });

  it("should compute inclusive duration (same-day start and end = 1 day)", () => {
    const tasks: Task[] = [
      createTask("summary", "Summary", { type: "summary" }),
      createTask("child", "Child", {
        parent: tid("summary"),
        startDate: "2025-06-15",
        endDate: "2025-06-15",
        duration: 1,
      }),
    ];

    const result = calculateSummaryDates(tasks, tid("summary"));

    expect(result!.duration).toBe(1);
  });

  it("should skip children with missing or invalid dates", () => {
    const tasks: Task[] = [
      createTask("summary", "Summary", { type: "summary" }),
      createTask("good", "Good Child", {
        parent: tid("summary"),
        startDate: "2025-02-01",
        endDate: "2025-02-10",
        duration: 10,
      }),
      createTask("bad", "Bad Child", {
        parent: tid("summary"),
        startDate: "",
        endDate: "",
        duration: 0,
      }),
    ];

    const result = calculateSummaryDates(tasks, tid("summary"));

    expect(result!.startDate).toBe("2025-02-01");
    expect(result!.endDate).toBe("2025-02-10");
  });

  it("should return null when all children have invalid dates", () => {
    const tasks: Task[] = [
      createTask("summary", "Summary", { type: "summary" }),
      createTask("bad", "Bad Child", {
        parent: tid("summary"),
        startDate: "",
        endDate: "",
        duration: 0,
      }),
    ];

    expect(calculateSummaryDates(tasks, tid("summary"))).toBeNull();
  });

  it("should not crash on corrupt data with a circular summary chain", () => {
    // Simulates corrupt data: summary A contains summary B which contains summary A.
    // The circular-reference guard (visited set) must prevent infinite recursion.
    const tasks: Task[] = [
      createTask("a", "Summary A", { type: "summary", parent: tid("b") }),
      createTask("b", "Summary B", { type: "summary", parent: tid("a") }),
    ];

    // Must not throw / stack-overflow — result is null (no valid leaf dates to span)
    expect(() => calculateSummaryDates(tasks, tid("a"))).not.toThrow();
    expect(calculateSummaryDates(tasks, tid("a"))).toBeNull();
  });

  it("should recursively derive dates from nested summary children", () => {
    const tasks: Task[] = [
      createTask("outer", "Outer Summary", { type: "summary" }),
      createTask("inner", "Inner Summary", {
        type: "summary",
        parent: tid("outer"),
      }),
      createTask("leaf", "Leaf", {
        parent: tid("inner"),
        startDate: "2025-03-10",
        endDate: "2025-03-20",
        duration: 11,
      }),
    ];

    const result = calculateSummaryDates(tasks, tid("outer"));

    expect(result!.startDate).toBe("2025-03-10");
    expect(result!.endDate).toBe("2025-03-20");
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
        parent: tid("summary1"),
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        duration: 6,
        order: 1,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set([tid("summary1")])
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(tid("summary1"));
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
      new Set([tid("summary1")])
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
        parent: tid("grandparent"),
        startDate: "2025-01-01",
        endDate: "2025-01-20",
        duration: 20,
        order: 1,
      }),
      createTask("child1", "Child 1", {
        parent: tid("parent"),
        startDate: "2025-01-10",
        endDate: "2025-01-15",
        duration: 6,
        order: 2,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set([tid("parent")])
    );

    // Should update both parent and grandparent
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(tid("parent"));
    expect(result[0].updates.startDate).toBe("2025-01-10");
    expect(result[0].updates.endDate).toBe("2025-01-15");
    expect(result[1].id).toBe(tid("grandparent"));
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
        parent: tid("parent"),
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        order: 1,
      }),
    ];

    const result = recalculateSummaryAncestors(
      tasks,
      new Set([tid("parent")])
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
        parent: tid("summary1"),
        startDate: "2025-01-05",
        endDate: "2025-01-10",
        order: 1,
      }),
      createTask("child2", "Child 2", {
        parent: tid("summary1"),
        startDate: "2025-01-08",
        endDate: "2025-01-12",
        order: 2,
      }),
    ];

    // Both children point to same parent
    const result = recalculateSummaryAncestors(
      tasks,
      new Set([tid("summary1"), tid("summary1")])
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
      createTask("child1", "Child 1", { order: 10, parent: tid("root2") }),
      createTask("child2", "Child 2", { order: 11, parent: tid("root2") }),
      createTask("root3", "Root 3", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual([tid("root1"), tid("root2"), tid("child1"), tid("child2"), tid("root3")]);
  });

  it("should handle children with non-sequential order values", () => {
    // Simulates the bug: children have high order values after indent
    const tasks: Task[] = [
      createTask("summary", "Summary", { order: 5, type: "summary" }),
      createTask("childA", "Child A", { order: 27, parent: tid("summary") }),
      createTask("childB", "Child B", { order: 28, parent: tid("summary") }),
      createTask("other", "Other Task", { order: 6 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    // Children must appear right after their parent, not at the bottom
    expect(ids).toEqual([tid("summary"), tid("childA"), tid("childB"), tid("other")]);
  });

  it("should respect collapsed state", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary" }),
      createTask("child", "Child", { order: 1, parent: tid("parent") }),
      createTask("other", "Other", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set([tid("parent")]));
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual([tid("parent"), tid("other")]);
  });

  it("should respect task.open === false", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary", open: false }),
      createTask("child", "Child", { order: 1, parent: tid("parent") }),
      createTask("other", "Other", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual([tid("parent"), tid("other")]);
  });

  it("should handle nested hierarchy with correct levels", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { order: 0, type: "summary" }),
      createTask("child", "Child", { order: 1, parent: tid("root"), type: "summary" }),
      createTask("grandchild", "Grandchild", { order: 2, parent: tid("child") }),
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
      createTask("child", "Child", { order: 1, parent: tid("parent") }),
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
      createTask("orphan", "Orphan", { order: 1, parent: tid("deleted-parent") }),
      createTask("other", "Other", { order: 2 }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    // Orphan must not disappear — should appear at root level
    expect(ids).toContain(tid("orphan"));
    expect(ids).toHaveLength(3);
    // Orphan should be at level 0 (root)
    const orphanEntry = result.find((r) => r.task.id === tid("orphan"));
    expect(orphanEntry!.level).toBe(0);
  });

  it("should not mark non-existent parent as having children", () => {
    const tasks: Task[] = [
      createTask("orphan", "Orphan", { order: 0, parent: tid("ghost") }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());

    expect(result).toHaveLength(1);
    expect(result[0].hasChildren).toBe(false);
  });

  it("should sort siblings by order within each parent group", () => {
    const tasks: Task[] = [
      createTask("parent", "Parent", { order: 0, type: "summary" }),
      createTask("childB", "Child B", { order: 3, parent: tid("parent") }),
      createTask("childA", "Child A", { order: 1, parent: tid("parent") }),
      createTask("childC", "Child C", { order: 5, parent: tid("parent") }),
    ];

    const result = buildFlattenedTaskList(tasks, new Set());
    const ids = result.map((r) => r.task.id);

    expect(ids).toEqual([tid("parent"), tid("childA"), tid("childB"), tid("childC")]);
  });

  describe("globalRowNumber", () => {
    it("should assign 1-based sequential numbers in tree-walk order for a flat list", () => {
      const tasks: Task[] = [
        createTask("a", "A", { order: 0 }),
        createTask("b", "B", { order: 1 }),
        createTask("c", "C", { order: 2 }),
      ];

      const result = buildFlattenedTaskList(tasks, new Set());

      expect(result[0].globalRowNumber).toBe(1);
      expect(result[1].globalRowNumber).toBe(2);
      expect(result[2].globalRowNumber).toBe(3);
    });

    it("should assign sequential numbers in tree-walk order for a hierarchy", () => {
      const tasks: Task[] = [
        createTask("root", "Root", { order: 0, type: "summary" }),
        createTask("child1", "Child 1", { order: 1, parent: tid("root") }),
        createTask("child2", "Child 2", { order: 2, parent: tid("root") }),
        createTask("sibling", "Sibling", { order: 3 }),
      ];

      const result = buildFlattenedTaskList(tasks, new Set());

      // Tree-walk order: root(1), child1(2), child2(3), sibling(4)
      expect(result.map((r) => r.globalRowNumber)).toEqual([1, 2, 3, 4]);
    });

    it("should produce gaps when the full-list output is filtered for hidden tasks", () => {
      // Simulates useFlattenedTasks: build full list, then filter out hidden tasks.
      // globalRowNumber on remaining entries should have gaps — this is the
      // "Excel-style row number" behaviour documented in the FlattenedTask interface.
      const tasks: Task[] = [
        createTask("a", "A", { order: 0 }),
        createTask("b", "B", { order: 1 }), // will be hidden
        createTask("c", "C", { order: 2 }),
      ];

      const fullList = buildFlattenedTaskList(tasks, new Set());
      const hiddenIds = new Set([tid("b")]);
      const visibleList = fullList.filter((r) => !hiddenIds.has(r.task.id));

      // a=1, c=3 — row 2 is absent, creating the gap
      expect(visibleList[0].globalRowNumber).toBe(1);
      expect(visibleList[1].globalRowNumber).toBe(3);
    });

    it("should start globalRowNumber at 1 for the first visible task when parent is collapsed", () => {
      // When a parent is collapsed its children are excluded from the output, but the
      // remaining tasks still get 1-based sequential numbers within the output.
      const tasks: Task[] = [
        createTask("parent", "Parent", { order: 0, type: "summary" }),
        createTask("child", "Child", { order: 1, parent: tid("parent") }),
        createTask("other", "Other", { order: 2 }),
      ];

      const result = buildFlattenedTaskList(tasks, new Set([tid("parent")]));

      // Only parent and other are visible; child is excluded by collapsed state
      expect(result).toHaveLength(2);
      expect(result[0].globalRowNumber).toBe(1);
      expect(result[1].globalRowNumber).toBe(2);
    });
  });
});

describe("normalizeTaskOrder", () => {
  it("should assign sequential order values based on tree-walk", () => {
    const tasks: Task[] = [
      createTask("root1", "Root 1", { order: 0 }),
      createTask("root2", "Root 2", { order: 5, type: "summary" }),
      createTask("child1", "Child 1", { order: 27, parent: tid("root2") }),
      createTask("child2", "Child 2", { order: 28, parent: tid("root2") }),
      createTask("root3", "Root 3", { order: 6 }),
    ];

    normalizeTaskOrder(tasks);

    expect(tasks.find((t) => t.id === tid("root1"))!.order).toBe(0);
    expect(tasks.find((t) => t.id === tid("root2"))!.order).toBe(1);
    expect(tasks.find((t) => t.id === tid("child1"))!.order).toBe(2);
    expect(tasks.find((t) => t.id === tid("child2"))!.order).toBe(3);
    expect(tasks.find((t) => t.id === tid("root3"))!.order).toBe(4);
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
      createTask("weld1", "Sub-Weld 1", { order: 27, parent: tid("welding") }),
      createTask("weld2", "Sub-Weld 2", { order: 28, parent: tid("welding") }),
      createTask("weld3", "Sub-Weld 3", { order: 29, parent: tid("welding") }),
    ];

    normalizeTaskOrder(tasks);

    // After normalization, children should follow parent sequentially
    const welding = tasks.find((t) => t.id === tid("welding"))!;
    const weld1 = tasks.find((t) => t.id === tid("weld1"))!;
    const weld2 = tasks.find((t) => t.id === tid("weld2"))!;
    const weld3 = tasks.find((t) => t.id === tid("weld3"))!;
    const task10 = tasks.find((t) => t.id === tid("task10"))!;

    expect(weld1.order).toBe(welding.order + 1);
    expect(weld2.order).toBe(welding.order + 2);
    expect(weld3.order).toBe(welding.order + 3);
    expect(task10.order).toBeGreaterThan(weld3.order);
  });
});

describe("collectDescendantIds", () => {
  it("should return a Set of all descendant IDs", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("child1", "Child 1", { parent: tid("root") }),
      createTask("child2", "Child 2", { parent: tid("root") }),
      createTask("grandchild", "Grandchild", { parent: tid("child1") }),
    ];

    const result = collectDescendantIds(tasks, tid("root"));

    expect(result.size).toBe(3);
    expect(result.has(tid("child1"))).toBe(true);
    expect(result.has(tid("child2"))).toBe(true);
    expect(result.has(tid("grandchild"))).toBe(true);
    expect(result.has(tid("root"))).toBe(false); // root itself is not a descendant
  });

  it("should return an empty Set for a leaf task", () => {
    const tasks: Task[] = [createTask("leaf", "Leaf")];

    const result = collectDescendantIds(tasks, tid("leaf"));

    expect(result.size).toBe(0);
  });

  it("should accumulate into a provided result Set", () => {
    const tasks: Task[] = [
      createTask("a", "A", { type: "summary" }),
      createTask("a1", "A1", { parent: tid("a") }),
      createTask("b", "B", { type: "summary" }),
      createTask("b1", "B1", { parent: tid("b") }),
    ];

    const accumulator = new Set<ReturnType<typeof tid>>();
    collectDescendantIds(tasks, tid("a"), accumulator);
    collectDescendantIds(tasks, tid("b"), accumulator);

    expect(accumulator.size).toBe(2);
    expect(accumulator.has(tid("a1"))).toBe(true);
    expect(accumulator.has(tid("b1"))).toBe(true);
  });

  it("should not include the root ID in the accumulated result", () => {
    const tasks: Task[] = [
      createTask("root", "Root", { type: "summary" }),
      createTask("child", "Child", { parent: tid("root") }),
    ];

    const result = collectDescendantIds(tasks, tid("root"));

    expect(result.has(tid("root"))).toBe(false);
  });
});

describe("canHaveChildren", () => {
  it("should return true for task type", () => {
    expect(canHaveChildren(createTask("t", "T", { type: "task" }))).toBe(true);
  });

  it("should return true for summary type", () => {
    expect(canHaveChildren(createTask("t", "T", { type: "summary" }))).toBe(true);
  });

  it("should return false for milestone type", () => {
    expect(canHaveChildren(createTask("t", "T", { type: "milestone" }))).toBe(false);
  });

  it("should return true when type is undefined (treated as regular task)", () => {
    expect(canHaveChildren(createTask("t", "T"))).toBe(true);
  });
});
