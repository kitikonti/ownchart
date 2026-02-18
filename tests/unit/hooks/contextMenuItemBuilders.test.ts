/**
 * Tests for context menu item builder functions.
 * Pure function tests — no renderHook needed.
 */

import { describe, it, expect, vi } from "vitest";
import {
  getEffectiveSelection,
  buildClipboardItems,
  buildDeleteItem,
  buildHideItem,
  buildInsertItems,
  buildHierarchyItems,
  buildUnhideItem,
} from "../../../src/hooks/contextMenuItemBuilders";

describe("getEffectiveSelection", () => {
  it("should return full selection when task is in selection", () => {
    const result = getEffectiveSelection("t1", ["t1", "t2", "t3"]);
    expect(result.effectiveSelection).toEqual(["t1", "t2", "t3"]);
    expect(result.count).toBe(3);
  });

  it("should return single-item array when task is not in selection", () => {
    const result = getEffectiveSelection("t4", ["t1", "t2"]);
    expect(result.effectiveSelection).toEqual(["t4"]);
    expect(result.count).toBe(1);
  });

  it("should return single-item array when selection is empty", () => {
    const result = getEffectiveSelection("t1", []);
    expect(result.effectiveSelection).toEqual(["t1"]);
    expect(result.count).toBe(1);
  });
});

describe("buildClipboardItems", () => {
  const defaultParams = {
    handleCut: vi.fn(),
    handleCopy: vi.fn(),
    handlePaste: vi.fn().mockResolvedValue(undefined),
    canCopyOrCut: true,
    canPaste: true,
    cutIcon: "cut-icon",
    copyIcon: "copy-icon",
    pasteIcon: "paste-icon",
  };

  it("should return 3 items: cut, copy, paste", () => {
    const items = buildClipboardItems(defaultParams);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.id)).toEqual(["cut", "copy", "paste"]);
  });

  it("should pass icons through", () => {
    const items = buildClipboardItems(defaultParams);
    expect(items[0].icon).toBe("cut-icon");
    expect(items[1].icon).toBe("copy-icon");
    expect(items[2].icon).toBe("paste-icon");
  });

  it("should disable cut/copy when canCopyOrCut is false", () => {
    const items = buildClipboardItems({
      ...defaultParams,
      canCopyOrCut: false,
    });
    expect(items[0].disabled).toBe(true);
    expect(items[1].disabled).toBe(true);
  });

  it("should disable paste when canPaste is false", () => {
    const items = buildClipboardItems({ ...defaultParams, canPaste: false });
    expect(items[2].disabled).toBe(true);
  });

  it("should default pasteSeparator to true", () => {
    const items = buildClipboardItems(defaultParams);
    expect(items[2].separator).toBe(true);
  });

  it("should respect pasteSeparator = false", () => {
    const items = buildClipboardItems({
      ...defaultParams,
      pasteSeparator: false,
    });
    expect(items[2].separator).toBe(false);
  });

  it("should have correct shortcuts", () => {
    const items = buildClipboardItems(defaultParams);
    expect(items[0].shortcut).toBe("Ctrl+X");
    expect(items[1].shortcut).toBe("Ctrl+C");
    expect(items[2].shortcut).toBe("Ctrl+V");
  });

  it("should call handleCut on cut click", () => {
    const items = buildClipboardItems(defaultParams);
    items[0].onClick();
    expect(defaultParams.handleCut).toHaveBeenCalled();
  });

  it("should call handleCopy on copy click", () => {
    const items = buildClipboardItems(defaultParams);
    items[1].onClick();
    expect(defaultParams.handleCopy).toHaveBeenCalled();
  });

  it("should call handlePaste on paste click", () => {
    const items = buildClipboardItems(defaultParams);
    items[2].onClick();
    expect(defaultParams.handlePaste).toHaveBeenCalled();
  });
});

describe("buildDeleteItem", () => {
  it("should show singular label for count = 1", () => {
    const item = buildDeleteItem({
      count: 1,
      taskId: "t1",
      deleteSelectedTasks: vi.fn(),
      deleteTask: vi.fn(),
      icon: "trash-icon",
    });
    expect(item.label).toBe("Delete Task");
  });

  it("should show plural label for count > 1", () => {
    const item = buildDeleteItem({
      count: 3,
      taskId: "t1",
      deleteSelectedTasks: vi.fn(),
      deleteTask: vi.fn(),
      icon: "trash-icon",
    });
    expect(item.label).toBe("Delete 3 Tasks");
  });

  it("should be disabled when count is 0", () => {
    const item = buildDeleteItem({
      count: 0,
      taskId: "t1",
      deleteSelectedTasks: vi.fn(),
      deleteTask: vi.fn(),
      icon: "trash-icon",
    });
    expect(item.disabled).toBe(true);
  });

  it("should call deleteSelectedTasks for multi-selection", () => {
    const deleteSelectedTasks = vi.fn();
    const item = buildDeleteItem({
      count: 3,
      taskId: "t1",
      deleteSelectedTasks,
      deleteTask: vi.fn(),
      icon: "trash-icon",
    });
    item.onClick();
    expect(deleteSelectedTasks).toHaveBeenCalled();
  });

  it("should call deleteTask for single selection", () => {
    const deleteTask = vi.fn();
    const item = buildDeleteItem({
      count: 1,
      taskId: "t1",
      deleteSelectedTasks: vi.fn(),
      deleteTask,
      icon: "trash-icon",
    });
    item.onClick();
    expect(deleteTask).toHaveBeenCalledWith("t1", true);
  });

  it("should set separator when specified", () => {
    const item = buildDeleteItem({
      count: 1,
      taskId: "t1",
      deleteSelectedTasks: vi.fn(),
      deleteTask: vi.fn(),
      icon: "trash-icon",
      separator: true,
    });
    expect(item.separator).toBe(true);
  });

  it("should not set separator by default", () => {
    const item = buildDeleteItem({
      count: 1,
      taskId: "t1",
      deleteSelectedTasks: vi.fn(),
      deleteTask: vi.fn(),
      icon: "trash-icon",
    });
    expect(item.separator).toBeUndefined();
  });
});

describe("buildHideItem", () => {
  it("should show singular label for count = 1", () => {
    const item = buildHideItem({
      count: 1,
      effectiveSelection: ["t1"],
      hideRows: vi.fn(),
      icon: "eye-slash-icon",
    });
    expect(item.label).toBe("Hide Row");
  });

  it("should show plural label for count > 1", () => {
    const item = buildHideItem({
      count: 3,
      effectiveSelection: ["t1", "t2", "t3"],
      hideRows: vi.fn(),
      icon: "eye-slash-icon",
    });
    expect(item.label).toBe("Hide 3 Rows");
  });

  it("should be disabled when count is 0", () => {
    const item = buildHideItem({
      count: 0,
      effectiveSelection: [],
      hideRows: vi.fn(),
      icon: "eye-slash-icon",
    });
    expect(item.disabled).toBe(true);
  });

  it("should call hideRows with effectiveSelection on click", () => {
    const hideRows = vi.fn();
    const item = buildHideItem({
      count: 2,
      effectiveSelection: ["t1", "t2"],
      hideRows,
      icon: "eye-slash-icon",
    });
    item.onClick();
    expect(hideRows).toHaveBeenCalledWith(["t1", "t2"]);
  });

  it("should have Ctrl+H shortcut", () => {
    const item = buildHideItem({
      count: 1,
      effectiveSelection: ["t1"],
      hideRows: vi.fn(),
      icon: "eye-slash-icon",
    });
    expect(item.shortcut).toBe("Ctrl+H");
  });
});

describe("buildInsertItems", () => {
  const defaultParams = {
    taskId: "t1",
    insertTaskAbove: vi.fn(),
    insertTaskBelow: vi.fn(),
    insertAboveIcon: "above-icon",
    insertBelowIcon: "below-icon",
  };

  it("should return 2 items: insertAbove, insertBelow", () => {
    const items = buildInsertItems(defaultParams);
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id)).toEqual(["insertAbove", "insertBelow"]);
  });

  it("should have correct labels", () => {
    const items = buildInsertItems(defaultParams);
    expect(items[0].label).toBe("Insert Task Above");
    expect(items[1].label).toBe("Insert Task Below");
  });

  it("should have Ctrl++ shortcut on insertAbove only", () => {
    const items = buildInsertItems(defaultParams);
    expect(items[0].shortcut).toBe("Ctrl++");
    expect(items[1].shortcut).toBeUndefined();
  });

  it("should call insertTaskAbove with taskId on click", () => {
    const items = buildInsertItems(defaultParams);
    items[0].onClick();
    expect(defaultParams.insertTaskAbove).toHaveBeenCalledWith("t1");
  });

  it("should call insertTaskBelow with taskId on click", () => {
    const items = buildInsertItems(defaultParams);
    items[1].onClick();
    expect(defaultParams.insertTaskBelow).toHaveBeenCalledWith("t1");
  });

  it("should pass icons through", () => {
    const items = buildInsertItems(defaultParams);
    expect(items[0].icon).toBe("above-icon");
    expect(items[1].icon).toBe("below-icon");
  });
});

describe("buildHierarchyItems", () => {
  const defaultParams = {
    canIndent: true,
    canOutdent: false,
    canGroup: true,
    canUngroup: false,
    indentSelectedTasks: vi.fn(),
    outdentSelectedTasks: vi.fn(),
    groupSelectedTasks: vi.fn(),
    ungroupSelectedTasks: vi.fn(),
    indentIcon: "indent-icon",
    outdentIcon: "outdent-icon",
    groupIcon: "group-icon",
    ungroupIcon: "ungroup-icon",
  };

  it("should return 4 items: indent, outdent, group, ungroup", () => {
    const items = buildHierarchyItems(defaultParams);
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.id)).toEqual([
      "indent",
      "outdent",
      "group",
      "ungroup",
    ]);
  });

  it("should respect disabled states", () => {
    const items = buildHierarchyItems(defaultParams);
    expect(items[0].disabled).toBe(false); // canIndent = true
    expect(items[1].disabled).toBe(true); // canOutdent = false
    expect(items[2].disabled).toBe(false); // canGroup = true
    expect(items[3].disabled).toBe(true); // canUngroup = false
  });

  it("should have correct shortcuts", () => {
    const items = buildHierarchyItems(defaultParams);
    expect(items[0].shortcut).toBe("Alt+Shift+→");
    expect(items[1].shortcut).toBe("Alt+Shift+←");
    expect(items[2].shortcut).toBe("Ctrl+G");
    expect(items[3].shortcut).toBe("Ctrl+Shift+G");
  });

  it("should have separator on ungroup", () => {
    const items = buildHierarchyItems(defaultParams);
    expect(items[3].separator).toBe(true);
  });

  it("should call correct actions on click", () => {
    const items = buildHierarchyItems(defaultParams);
    items[0].onClick();
    expect(defaultParams.indentSelectedTasks).toHaveBeenCalled();
    items[1].onClick();
    expect(defaultParams.outdentSelectedTasks).toHaveBeenCalled();
    items[2].onClick();
    expect(defaultParams.groupSelectedTasks).toHaveBeenCalled();
    items[3].onClick();
    expect(defaultParams.ungroupSelectedTasks).toHaveBeenCalled();
  });
});

describe("buildUnhideItem", () => {
  it("should return null when hiddenCount is 0", () => {
    const item = buildUnhideItem({
      hiddenCount: 0,
      unhideSelection: vi.fn(),
      selectedTaskIds: ["t1", "t2"],
      icon: "eye-icon",
    });
    expect(item).toBeNull();
  });

  it("should return null when fewer than 2 tasks selected", () => {
    const item = buildUnhideItem({
      hiddenCount: 1,
      unhideSelection: vi.fn(),
      selectedTaskIds: ["t1"],
      icon: "eye-icon",
    });
    expect(item).toBeNull();
  });

  it("should return item with singular label for 1 hidden row", () => {
    const item = buildUnhideItem({
      hiddenCount: 1,
      unhideSelection: vi.fn(),
      selectedTaskIds: ["t1", "t2"],
      icon: "eye-icon",
    });
    expect(item).not.toBeNull();
    expect(item!.label).toBe("Unhide 1 Row");
  });

  it("should return item with plural label for multiple hidden rows", () => {
    const item = buildUnhideItem({
      hiddenCount: 3,
      unhideSelection: vi.fn(),
      selectedTaskIds: ["t1", "t2"],
      icon: "eye-icon",
    });
    expect(item!.label).toBe("Unhide 3 Rows");
  });

  it("should call unhideSelection with selectedTaskIds on click", () => {
    const unhideSelection = vi.fn();
    const item = buildUnhideItem({
      hiddenCount: 1,
      unhideSelection,
      selectedTaskIds: ["t1", "t3"],
      icon: "eye-icon",
    });
    item!.onClick();
    expect(unhideSelection).toHaveBeenCalledWith(["t1", "t3"]);
  });

  it("should have Ctrl+Shift+H shortcut", () => {
    const item = buildUnhideItem({
      hiddenCount: 1,
      unhideSelection: vi.fn(),
      selectedTaskIds: ["t1", "t2"],
      icon: "eye-icon",
    });
    expect(item!.shortcut).toBe("Ctrl+Shift+H");
  });
});
