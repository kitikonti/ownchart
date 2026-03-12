/**
 * Unit tests for dragSelectionState singleton.
 * Verifies initial state, mutation, and reset behaviour.
 *
 * IMPORTANT: Tests must call resetDragState() in afterEach (or beforeEach)
 * to prevent state leaking between cases — see module-level documentation.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  dragState,
  resetDragState,
} from "../../../../src/components/TaskList/dragSelectionState";
import type { TaskId } from "../../../../src/types/branded.types";

afterEach(() => {
  resetDragState();
});

describe("dragState initial values", () => {
  it("starts with isDragging = false", () => {
    expect(dragState.isDragging).toBe(false);
  });

  it("starts with startTaskId = null", () => {
    expect(dragState.startTaskId).toBeNull();
  });

  it("starts with onDragSelect = null", () => {
    expect(dragState.onDragSelect).toBeNull();
  });
});

describe("resetDragState", () => {
  it("resets isDragging to false after mutation", () => {
    dragState.isDragging = true;
    resetDragState();
    expect(dragState.isDragging).toBe(false);
  });

  it("resets startTaskId to null after mutation", () => {
    dragState.startTaskId = "task-1" as TaskId;
    resetDragState();
    expect(dragState.startTaskId).toBeNull();
  });

  it("resets onDragSelect to null after mutation", () => {
    dragState.onDragSelect = () => {};
    resetDragState();
    expect(dragState.onDragSelect).toBeNull();
  });

  it("resets all fields simultaneously", () => {
    dragState.isDragging = true;
    dragState.startTaskId = "task-2" as TaskId;
    dragState.onDragSelect = () => {};

    resetDragState();

    expect(dragState.isDragging).toBe(false);
    expect(dragState.startTaskId).toBeNull();
    expect(dragState.onDragSelect).toBeNull();
  });
});

describe("state isolation between tests", () => {
  it("first test: mutates state", () => {
    dragState.isDragging = true;
    dragState.startTaskId = "task-x" as TaskId;
    expect(dragState.isDragging).toBe(true);
    // afterEach will reset
  });

  it("second test: sees clean state thanks to afterEach reset", () => {
    expect(dragState.isDragging).toBe(false);
    expect(dragState.startTaskId).toBeNull();
  });
});
